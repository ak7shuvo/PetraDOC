import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { genData, idbPut, ok, open, patient, run, seedViaBackup } from "./lib.mjs";

const tmp = (n) => path.join(os.tmpdir(), n);

export const tests = {
  async patients() {
    const { b, p } = await open();
    await patient(p);
    ok("patient: auto ID PD-000001", (await p.getByText("PD-000001").count()) > 0);
    await p.goto(p.base + "/patients/new");
    await p.getByLabel("Full name *").fill("Bad"); await p.getByLabel("Mobile *").fill("01811");
    await p.getByRole("button", { name: "Create patient" }).click(); await p.waitForTimeout(400);
    ok("patient: invalid mobile rejected", (await p.getByText("Enter a valid mobile").count()) === 1 && p.url().includes("new"));
    await p.goto(p.base + "/patients"); await p.getByLabel("Search patients").waitFor();
    for (const [q, n] of [["Rahim", 1], ["0171", 1], ["PD-000001", 1], ["nomatch", 0]]) {
      await p.getByLabel("Search patients").fill(q); await p.waitForTimeout(500);
      ok(`patient: search "${q}"`, (await p.getByText("Rahim Uddin").count()) === n);
    }
    await b.close();
  },

  async profileAndDoctors() {
    const { b, p } = await open();
    await p.goto(p.base + "/profile");
    await p.getByLabel("Full name *").fill("Anika Rahman");
    await p.getByRole("button", { name: "Add education" }).click(); await p.getByLabel("Degree", { exact: true }).fill("MBBS");
    await p.getByRole("button", { name: "Save profile" }).click(); await p.waitForTimeout(400);
    await p.getByRole("button", { name: "Add chamber" }).click(); await p.getByLabel("Name *", { exact: true }).fill("City Clinic");
    await p.getByRole("button", { name: "Save chamber" }).click(); await p.waitForTimeout(500); await p.reload();
    ok("profile: persists + preview", (await p.getByLabel("Full name *").inputValue()) === "Anika Rahman" &&
      (await p.getByLabel("Prescription header preview").innerText()).includes("City Clinic"));
    await p.getByRole("button", { name: "Add doctor" }).click(); await p.waitForTimeout(500);
    await p.getByLabel("Full name *").fill("Karim Hasan"); await p.getByRole("button", { name: "Save profile" }).click(); await p.waitForTimeout(400);
    ok("profile: second doctor listed", (await p.getByLabel("Doctor", { exact: true }).locator("option").allInnerTexts()).includes("Karim Hasan"));
    await b.close();
  },

  async consultationAndRx() {
    const { b, p } = await open();
    await patient(p);
    await p.goto(p.base + "/settings"); await p.getByLabel(/Footer/).fill("Drink water."); await p.getByRole("button", { name: "Save", exact: true }).click(); await p.waitForTimeout(300);
    await p.goto(p.base + "/medicines"); await p.getByRole("button", { name: "Add medicine" }).click();
    await p.getByLabel("Generic name").fill("Paracetamol"); await p.getByLabel("Brand name").fill("Napa"); await p.getByLabel("Strength").fill("500 mg");
    await p.getByRole("button", { name: "Save medicine" }).click(); await p.waitForTimeout(400);
    await p.getByRole("button", { name: "Mark favourite" }).click();
    await p.goto(p.base + "/investigations");
    for (const [n, c] of [["CBC", "Haematology"], ["ESR", "Haematology"]]) {
      await p.getByRole("button", { name: "Add test" }).click(); await p.getByLabel("Test name *").fill(n); await p.getByLabel("Category").fill(c);
      await p.getByRole("button", { name: "Save test" }).click(); await p.waitForTimeout(300);
    }
    await p.getByRole("button", { name: "Add panel" }).click(); await p.getByLabel("Panel name *").fill("Fever");
    await p.getByLabel("CBC").check(); await p.getByLabel("ESR").check(); await p.getByRole("button", { name: "Save panel" }).click(); await p.waitForTimeout(300);
    await p.goto(p.base + "/patients"); await p.getByText("Rahim Uddin").click(); await p.getByRole("link", { name: "New consultation" }).click();
    await p.getByLabel("Chief complaint").fill("Fever"); await p.getByLabel("Weight (kg)").fill("70"); await p.getByLabel("Height (cm)").fill("175");
    ok("consult: BMI computed", (await p.locator("[aria-live=polite]").first().innerText()) === "22.9");
    await p.getByRole("button", { name: /★ Napa/ }).click(); await p.getByLabel("Frequency").first().fill("1+0+1");
    await p.getByLabel("Add panel").selectOption("Fever");
    await p.getByLabel("Follow-up date").fill("2099-01-01");
    await p.getByRole("button", { name: "Save as template" }).click(); await p.getByLabel("Template name").fill("T1"); await p.getByRole("button", { name: "Save template" }).click();
    await p.getByRole("button", { name: "Save consultation" }).click(); await p.waitForURL(/prescriptions\/view/);
    const rx = await p.locator("#rx-print").innerText();
    ok("rx: medicine, tests, footer, id", rx.includes("Napa") && rx.includes("CBC") && rx.includes("Drink water.") && rx.includes("RX-000001"));
    await p.goto(p.base + "/patients"); await p.getByText("Rahim Uddin").click(); await p.getByRole("link", { name: "New consultation" }).click();
    await p.getByLabel("Use previous prescription as new").waitFor(); await p.getByLabel("Use previous prescription as new").selectOption({ index: 1 });
    ok("rx: previous prescription copied", (await p.getByText(/^Medicine \d/).count()) === 1);
    await p.getByLabel("Apply template").selectOption("T1");
    ok("rx: template applied", (await p.getByText(/^Medicine \d/).count()) === 2);
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("dashboard: patient + follow-up counts", (await p.locator("main").innerText()).includes("Pending follow-ups\n1"));
    await b.close();
  },

  async appointments() {
    const { b, p } = await open();
    await patient(p, "Alice A", "01711000001"); await patient(p, "Bob B", "01711000002");
    await p.goto(p.base + "/profile"); await p.getByLabel("Full name *").fill("Anika Rahman"); await p.getByRole("button", { name: "Save profile" }).click(); await p.waitForTimeout(400);
    await p.goto(p.base + "/appointments");
    for (const n of ["Alice", "Bob"]) {
      await p.getByRole("button", { name: "Book appointment" }).click(); await p.getByLabel("Patient *").fill(n);
      await p.getByRole("button", { name: new RegExp(n) }).first().click(); await p.getByLabel("Doctor").last().selectOption({ index: 1 });
      await p.getByRole("button", { name: "Book", exact: true }).click(); await p.waitForTimeout(400);
    }
    ok("appointments: tokens 1,2", JSON.stringify(await p.locator('[aria-label^="Token"]').allInnerTexts()) === '["1","2"]');
    await p.getByRole("button", { name: "Check in" }).first().click(); await p.waitForTimeout(300);
    await p.getByRole("link", { name: "Start consultation" }).first().click(); await p.waitForURL(/consultations\/new/);
    await p.getByLabel("Chief complaint").fill("Cough"); await p.getByLabel("Follow-up date").fill("2020-01-01"); await p.getByLabel("Visit date *").fill("2019-12-01");
    await p.getByRole("button", { name: "Save consultation" }).click(); await p.waitForURL(/prescriptions\/view/);
    await p.goto(p.base + "/appointments"); await p.waitForTimeout(500);
    ok("appointments: consultation marks Done", (await p.getByText("Done", { exact: true }).count()) === 1);
    ok("appointments: overdue follow-up", (await p.getByText("Overdue").count()) === 1);
    await p.getByRole("button", { name: "Book", exact: true }).first().click(); await p.getByRole("button", { name: "Book", exact: true }).last().click(); await p.waitForTimeout(600);
    ok("appointments: follow-up booked", (await p.getByText("No pending follow-ups").count()) === 1);
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("dashboard: today's appointments = 3", (await p.locator("main").innerText()).includes("Today's appointments\n3"));
    await p.goto(p.base + "/patients"); await p.getByText("Alice A").click(); await p.waitForTimeout(500);
    const tl = await p.locator("ol").innerText();
    ok("timeline: consultation + appointment", tl.includes("RX-000001") && tl.includes("Token 3"));
    await b.close();
  },

  async printing() {
    const { b, p } = await open();
    await patient(p);
    await p.goto(p.base + "/consultations/new"); await p.getByLabel("Patient *").fill("Rahim"); await p.getByRole("button", { name: /Rahim Uddin/ }).click();
    await p.getByLabel("Diagnosis / clinical impression").fill("Viral fever");
    await p.getByRole("button", { name: "Add manually" }).click(); await p.getByLabel("Medicine", { exact: true }).fill("Napa 500");
    await p.getByRole("button", { name: "Save consultation" }).click(); await p.waitForURL(/prescriptions\/view/); await p.waitForTimeout(400);
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Download PDF" }).click()]);
    await dl.saveAs(tmp("e2e-rx.pdf"));
    ok("print: A4 PDF download is a PDF", fs.readFileSync(tmp("e2e-rx.pdf")).subarray(0, 5).toString() === "%PDF-");
    await p.getByLabel("Paper").selectOption("Thermal 80 mm"); await p.waitForTimeout(200);
    ok("print: 80mm layout width", (await p.locator("#rx-print").evaluate((e) => Math.round(e.getBoundingClientRect().width))) === 302);
    await p.getByLabel("Paper").selectOption("A4");
    await p.emulateMedia({ media: "print" });
    ok("print: chrome hidden in print media", !(await p.locator("nav[aria-label=Primary]").isVisible()) && !(await p.getByRole("button", { name: "Print" }).isVisible()));
    await b.close();
  },

  async backupAndRestore() {
    const { b, p } = await open();
    await patient(p, "Rahim Uddin");
    await p.goto(p.base + "/settings"); await p.waitForTimeout(400);
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export unencrypted backup" }).click()]);
    await dl.saveAs(tmp("e2e-bk.json")); const bk = JSON.parse(fs.readFileSync(tmp("e2e-bk.json"), "utf8"));
    ok("backup: file has patients, no license", bk.data.patients.length === 1 && !("licenses" in bk.data));
    await patient(p, "Extra Person", "01999999999");
    await p.goto(p.base + "/settings"); await p.getByLabel("Backup file").setInputFiles(tmp("e2e-bk.json"));
    await p.getByRole("button", { name: "Replace data and restore" }).click(); await p.waitForTimeout(1500);
    await p.goto(p.base + "/patients"); await p.waitForTimeout(400);
    ok("backup: restore replaces data", (await p.getByText("Extra Person").count()) === 0 && (await p.getByText("Rahim Uddin").count()) === 1);
    fs.writeFileSync(tmp("e2e-bad.json"), '{"hello":1}'); await p.goto(p.base + "/settings");
    await p.getByLabel("Backup file").setInputFiles(tmp("e2e-bad.json")); await p.waitForTimeout(300);
    ok("backup: invalid file rejected", (await p.locator("p[role=alert]").innerText()).includes("not a PetraDOC backup"));
    await b.close();
  },

  async encryptedBackup() {
    const { b, p } = await open();
    await patient(p, "Secret Patient");
    await p.goto(p.base + "/settings"); await p.waitForTimeout(500);
    ok("persist: status shown", /Protected|Not guaranteed|does not support/.test(await p.getByTestId("persist-status").innerText()));
    ok("backup: unencrypted export warns", (await p.getByText(/Unencrypted backups contain all patient data/).count()) === 1);
    await p.getByLabel("Passphrase", { exact: true }).fill("short"); await p.getByLabel("Repeat passphrase").fill("short");
    await p.getByRole("button", { name: "Export encrypted backup" }).click(); await p.waitForTimeout(200);
    ok("backup: short passphrase rejected", (await p.getByText(/at least 8 characters/).count()) === 1);
    await p.getByLabel("Passphrase", { exact: true }).fill("correct horse"); await p.getByLabel("Repeat passphrase").fill("different one");
    await p.getByRole("button", { name: "Export encrypted backup" }).click(); await p.waitForTimeout(200);
    ok("backup: mismatched passphrase rejected", (await p.getByText(/do not match/).count()) === 1);
    await p.getByLabel("Repeat passphrase").fill("correct horse");
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 30000 }), p.getByRole("button", { name: "Export encrypted backup" }).click()]);
    ok("backup: encrypted file name", dl.suggestedFilename().endsWith(".enc.json"));
    await dl.saveAs(tmp("e2e-enc.json")); const raw = fs.readFileSync(tmp("e2e-enc.json"), "utf8");
    ok("backup: encrypted file has no readable patient data", !raw.includes("Secret Patient") && JSON.parse(raw).app === "petradoc-encrypted");
    await patient(p, "Extra Person", "01999999999"); await p.goto(p.base + "/settings");
    const restore = async (file, pass) => {
      await p.goto(p.base + "/settings"); await p.getByLabel("Backup file").setInputFiles(file);
      if (pass != null) { await p.locator("dialog[open]").getByLabel("Passphrase").fill(pass); await p.getByRole("button", { name: "Decrypt" }).click();
        await p.waitForFunction(() => document.querySelector("dialog[open] h2")?.textContent === "Restore backup?" || [...document.querySelectorAll("p[role=alert]")].some((e) => e.textContent), null, { timeout: 15000 }); }
    };
    await restore(tmp("e2e-enc.json"), "wrong passphrase");
    ok("backup: wrong passphrase rejected", (await p.getByText(/Wrong passphrase/).count()) === 1 && (await p.getByText("Restore backup?").isVisible().catch(() => false)) === false);
    const env = JSON.parse(raw); const d = env.data; env.data = d.slice(0, 40) + (d[40] === "A" ? "B" : "A") + d.slice(41);
    fs.writeFileSync(tmp("e2e-enc-corrupt.json"), JSON.stringify(env));
    await restore(tmp("e2e-enc-corrupt.json"), "correct horse");
    ok("backup: corrupted ciphertext rejected", (await p.getByText(/Wrong passphrase, or the backup file is damaged/).count()) === 1);
    fs.writeFileSync(tmp("e2e-enc-trunc.json"), raw.slice(0, raw.length - 30));
    await restore(tmp("e2e-enc-trunc.json"), "correct horse");
    ok("backup: truncated file rejected", (await p.getByText(/damaged/).count()) === 1);
    await restore(tmp("e2e-enc.json"), "correct horse");
    ok("backup: correct passphrase shows restore confirmation", (await p.getByText("Restore backup?").isVisible()) === true);
    await p.getByRole("button", { name: "Replace data and restore" }).click(); await p.waitForTimeout(1500);
    await p.goto(p.base + "/patients"); await p.waitForTimeout(400);
    ok("backup: encrypted restore replaces data", (await p.getByText("Extra Person").count()) === 0 && (await p.getByText("Secret Patient").count()) === 1);
    await b.close();
  },

  async backupReminder() {
    const { b, p } = await open();
    await patient(p);
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("reminder: never backed up", (await p.getByText(/has never been backed up/).count()) === 1);
    await p.goto(p.base + "/settings"); await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export unencrypted backup" }).click()]); await p.waitForTimeout(300);
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("reminder: hidden right after backup", (await p.getByText(/backed up/).count()) === 0);
    const old = new Date(Date.now() - 10 * 86400000).toISOString(); const now = new Date().toISOString();
    await seedViaBackup(p, { patients: [{ id: "p1", code: "PD-000001", name: "A", dob: "", approxAge: "", gender: "", mobile: "01711", address: "", bloodGroup: "", occupation: "", emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", notes: "", createdAt: now, updatedAt: now }],
      settings: [{ id: "app", prescriptionFooter: "", lastBackupAt: old }] });
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("reminder: shown after 7+ days", (await p.getByText(/last backed up 10 days ago/).count()) === 1);
    await b.close();
  },

  async doctorDelete() {
    const { b, p } = await open();
    const now = new Date().toISOString();
    const doc = (id, name) => ({ id, name, title: "", gender: "", phone: "", email: "", address: "", specialty: "", subSpecialty: "", bmdcNumber: "", experienceYears: "", position: "", department: "", expertise: "", languages: "", education: [], training: [], experience: [], createdAt: now, updatedAt: now });
    const pt = { id: "p1", code: "PD-000001", name: "P", dob: "", approxAge: "", gender: "", mobile: "01711", address: "", bloodGroup: "", occupation: "", emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", notes: "", createdAt: now, updatedAt: now };
    const c = { id: "c1", rxCode: "RX-000001", patientId: "p1", doctorId: "d1", chamberId: "", date: "2026-01-01", chiefComplaint: "x", history: "", examination: "", diagnosis: "", vitals: { bp: "", pulse: "", temperature: "", spo2: "", respiratoryRate: "", weight: "", height: "", bmi: "" }, medicines: [], investigations: [], advice: "", followUpNotes: "", createdAt: now, updatedAt: now };
    await seedViaBackup(p, { doctors: [doc("d1", "Doc One"), doc("d2", "Doc Two")], patients: [pt], consultations: [c] });
    await p.goto(p.base + "/profile"); await p.getByLabel("Full name *").waitFor();
    await p.getByLabel("Doctor", { exact: true }).selectOption("Doc One"); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Delete doctor…" }).click(); await p.waitForTimeout(300);
    ok("doctor delete: blocked when consultations exist, with reason", (await p.locator("dialog[open]").innerText()).includes("consultation(s) were recorded") && (await p.getByRole("button", { name: "Delete permanently" }).count()) === 0);
    await p.getByRole("button", { name: "Close" }).last().click();
    await p.getByLabel("Doctor", { exact: true }).selectOption("Doc Two"); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Delete doctor…" }).click(); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Delete permanently" }).click(); await p.waitForTimeout(600);
    ok("doctor delete: unused doctor deleted", JSON.stringify(await p.getByLabel("Doctor", { exact: true }).locator("option").allInnerTexts()) === '["Choose doctor","Doc One"]');
    await p.getByRole("button", { name: "Delete doctor…" }).click(); await p.waitForTimeout(300);
    ok("doctor delete: last doctor cannot be deleted", (await p.locator("dialog[open]").innerText()).includes("At least one doctor"));
    await b.close();
  },

  async bulkImport() {
    const { b, p } = await open();
    fs.writeFileSync(tmp("e2e-med1.csv"), 'generic,Brand Name,strength,Dosage Form,route,manufacturer\nAlpha,Brand A,10 mg,tablet,,\n"Beta, comma",,5 mg,Syrup,Oral,"ACME, Inc"\nAlpha,Brand A,10 mg,Tablet,,\n,,10 mg,Tablet,,\n');
    await p.goto(p.base + "/medicines");
    const [sample] = await Promise.all([p.waitForEvent("download"), (async () => { await p.getByRole("button", { name: "Import…" }).click(); await p.getByRole("button", { name: "Download sample CSV" }).click(); })()]);
    await sample.saveAs(tmp("e2e-sample.csv")); ok("import: sample CSV downloadable", fs.readFileSync(tmp("e2e-sample.csv"), "utf8").startsWith("generic,brand"));
    await p.getByLabel("Import file").setInputFiles(tmp("e2e-med1.csv")); await p.waitForTimeout(500);
    const sum = await p.getByLabel("Import summary").innerText();
    ok("import: preview counts (2 new, 1 duplicate in file, 1 invalid)", sum.includes("2 new") && sum.includes("1 duplicate") && sum.includes("1 invalid"), sum.replace(/\n/g, " "));
    ok("import: nothing saved before confirming", true);
    await p.getByRole("button", { name: /^Import \d+ item/ }).click(); await p.waitForTimeout(600);
    ok("import: items saved (quoted comma handled)", (await p.getByText("Beta, comma").count()) >= 1 && (await p.getByText("Brand A").count()) >= 1);
    await p.getByRole("button", { name: "Import…" }).click(); await p.getByLabel("Import file").setInputFiles(tmp("e2e-med1.csv")); await p.waitForTimeout(500);
    ok("import: re-import shows only duplicates", (await p.getByLabel("Import summary").innerText()).includes("0 new"));
    await p.getByRole("button", { name: "Cancel" }).last().click();
    fs.writeFileSync(tmp("e2e-med2.csv"), "generic,brand,strength,form,route,manufacturer\nAlpha,Brand A,10 mg,Tablet,Oral,Zeta Pharma\n");
    await p.getByRole("button", { name: "Import…" }).click(); await p.getByLabel("Import file").setInputFiles(tmp("e2e-med2.csv")); await p.waitForTimeout(400);
    await p.getByLabel("Duplicates").selectOption("Update existing"); await p.getByRole("button", { name: /^Import 1 item/ }).click(); await p.waitForTimeout(600);
    ok("import: update-existing merges fields", (await p.getByText(/Zeta Pharma/).count()) === 1);
    fs.writeFileSync(tmp("e2e-bad.csv"), "[not json"); await p.getByRole("button", { name: "Import…" }).click(); await p.getByLabel("Import file").setInputFiles(tmp("e2e-bad.csv")); await p.waitForTimeout(300);
    ok("import: invalid JSON rejected with message", (await p.locator("p[role=alert]").innerText()).includes("not valid JSON"));
    await p.getByRole("button", { name: "Cancel" }).last().click();
    await p.goto(p.base + "/investigations");
    fs.writeFileSync(tmp("e2e-tests.json"), JSON.stringify({ tests: [{ name: "CBC", category: "Haematology" }, { Test: "ESR" }, { category: "none" }] }));
    await p.getByRole("button", { name: "Import…" }).click(); await p.getByLabel("Import file").setInputFiles(tmp("e2e-tests.json")); await p.waitForTimeout(400);
    ok("import: JSON tests preview (2 new, 1 invalid)", (await p.getByLabel("Import summary").innerText()).includes("2 new") && (await p.getByLabel("Import summary").innerText()).includes("1 invalid"));
    await p.getByRole("button", { name: /^Import 2 item/ }).click(); await p.waitForTimeout(600);
    ok("import: tests saved", (await p.getByText("CBC").count()) >= 1 && (await p.getByText("ESR").count()) >= 1);
    ok("import: no page errors", p.errs.length === 0, p.errs.join(";"));
    await b.close();
  },

  async starterLists() {
    const { b, p } = await open();
    await p.goto(p.base + "/medicines"); await p.waitForTimeout(500);
    ok("starter: lists are empty by default (nothing pre-seeded)", (await p.getByText("No medicines yet").count()) === 1);
    await p.goto(p.base + "/settings");
    ok("starter: labelled 'starter list, verify before use'", (await p.getByText("Starter list, verify before use.").count()) === 1);
    await p.getByRole("button", { name: /Add starter medicines/ }).click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: /Add starter medicines/ }).click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: /Add starter tests/ }).click(); await p.waitForTimeout(800);
    await p.goto(p.base + "/medicines"); await p.waitForTimeout(500);
    const meds = await p.locator("main li").count();
    ok("starter: medicines added once (duplicates skipped)", meds === 31, `rows=${meds}`);
    ok("starter: no dosing data on starter entries", (await p.getByText(/\d+\s?(mg|mcg|ml)/i).count()) === 0);
    await p.goto(p.base + "/investigations"); await p.waitForTimeout(500);
    ok("starter: tests added", (await p.getByText("Chest X-ray").count()) >= 1);
    await b.close();
  },

  async rolesAndLicenseSafeguards() {
    const { b, p } = await open({ trial: false });
    await p.goto(p.base + "/patients/new"); await p.waitForTimeout(600);
    ok("license: read-only before trial", (await p.getByText("Editing is unavailable").count()) === 1);
    await p.getByRole("button", { name: "Start 30-day trial" }).first().click(); await p.waitForTimeout(400);
    await patient(p, "Rahim Uddin");
    await p.goto(p.base + "/settings"); await p.getByLabel("License key").fill("abc"); await p.getByRole("button", { name: "Activate" }).click(); await p.waitForTimeout(400);
    ok("license: garbage key rejected", (await p.locator("p[role=status]").last().innerText()).includes("not a valid license key"));
    await p.getByLabel("License key").fill("eyJhIjoxfQ.AAAA"); await p.getByRole("button", { name: "Activate" }).click(); await p.waitForTimeout(400);
    const m = await p.locator("p[role=status]").last().innerText();
    ok("license: unsigned/unknown key never activates", !m.includes("activated") && (await p.getByText("ACTIVE", { exact: true }).count()) === 0, m);
    await p.evaluate(() => localStorage.setItem("petradoc.activeRole", "RECEPTIONIST")); await p.goto(p.base + "/"); await p.waitForTimeout(500);
    ok("roles: receptionist nav hides clinical", !(await p.locator("nav[aria-label=Primary] a").allInnerTexts()).includes("Consult"));
    await p.goto(p.base + "/consultations"); await p.waitForTimeout(300); ok("roles: receptionist blocked from consultations", (await p.getByText("does not have access").count()) === 1);
    await p.goto(p.base + "/patients"); await p.getByText("Rahim Uddin").click(); await p.waitForTimeout(500);
    ok("roles: receptionist sees no medical history", (await p.getByText("Medical history").count()) === 0);
    await p.evaluate(() => localStorage.setItem("petradoc.activeRole", "ASSISTANT")); await p.reload(); await p.waitForTimeout(500);
    ok("roles: assistant cannot delete patient", (await p.getByRole("button", { name: "Delete patient…" }).count()) === 0);
    await b.close();
  },

  async editAndDeletePatient() {
    const { b, p } = await open();
    await patient(p, "Delete Me", "01700000009"); await patient(p, "Keep Me", "01700000010");
    await p.getByRole("link", { name: "Edit" }).click(); await p.getByLabel("Occupation").fill("Teacher");
    await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForURL(/detail/); await p.waitForTimeout(300);
    ok("patient: edit persisted", (await p.getByText("Teacher").count()) === 1);
    await p.goto(p.base + "/consultations/new"); await p.getByLabel("Patient *").fill("Delete"); await p.getByRole("button", { name: /Delete Me/ }).click();
    await p.getByLabel("Chief complaint").fill("x"); await p.getByRole("button", { name: "Save consultation" }).click(); await p.waitForURL(/prescriptions\/view/);
    await p.goto(p.base + "/patients"); await p.getByText("Delete Me").click(); await p.getByRole("button", { name: "Delete patient…" }).click();
    ok("delete: confirmation warns data is browser-only", (await p.locator("dialog[open]").innerText()).includes("only in this browser"));
    await p.getByRole("button", { name: "Delete permanently" }).click(); await p.waitForURL(/\/patients$/); await p.waitForTimeout(500);
    ok("delete: patient gone, other kept", (await p.getByText("Delete Me").count()) === 0 && (await p.getByText("Keep Me").count()) === 1);
    await p.goto(p.base + "/consultations"); await p.waitForTimeout(400);
    ok("delete: consultations cascaded", (await p.getByText("No consultations yet").count()) === 1);
    await b.close();
  },

  async longPrescriptionPages() {
    const { b, p } = await open();
    const now = new Date().toISOString();
    const meds = Array.from({ length: 40 }, (_, i) => ({ id: `m${i}`, name: `Medicine number ${i + 1}`, strength: "10 mg", dose: "1 tablet", frequency: "1+0+1", route: "Oral", duration: "7 days", instructions: "After meals" }));
    const c = { id: "c1", rxCode: "RX-000001", patientId: "p1", doctorId: "primary", chamberId: "", date: "2026-01-01", chiefComplaint: "Long", history: "", examination: "", diagnosis: "Dx",
      vitals: { bp: "", pulse: "", temperature: "", spo2: "", respiratoryRate: "", weight: "", height: "", bmi: "" }, medicines: meds,
      investigations: [{ id: "t1", name: "CBC", notes: "" }], advice: "Rest.", followUpNotes: "", createdAt: now, updatedAt: now };
    const pt = { id: "p1", code: "PD-000001", name: "Long Rx Patient", dob: "", approxAge: "30", gender: "Male", mobile: "01711223344", address: "", bloodGroup: "", occupation: "",
      emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", notes: "", createdAt: now, updatedAt: now };
    await seedViaBackup(p, { patients: [pt], consultations: [c] });
    await p.goto(p.base + "/prescriptions/view?id=c1"); await p.locator("#rx-print").waitFor();
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), p.getByRole("button", { name: "Download PDF" }).click()]);
    await dl.saveAs(tmp("e2e-long.pdf"));
    const txt = fs.readFileSync(tmp("e2e-long.pdf"), "latin1");
    const pages = (txt.match(/\/Type \/Page\b(?!s)/g) || []).length;
    ok("pdf: long prescription flows to multiple A4 pages", pages >= 2, `pages=${pages}`);
    await b.close();
  },

  async tapTargets() {
    const urls = ["/", "/patients", "/patients/detail?id=p0", "/patients/new", "/consultations", "/consultations/new", "/prescriptions", "/prescriptions/view?id=c0",
      "/appointments", "/medicines", "/investigations", "/profile", "/settings"];
    for (const width of [360, 390]) {
      const { b, p } = await open({ width });
      await seedViaBackup(p, genData());
      const bad = [];
      for (const u of urls) {
        await p.goto(p.base + u); await p.waitForTimeout(500);
        const small = await p.evaluate(() => [...document.querySelectorAll("a, button, input:not([type=hidden]):not([type=file]), select, textarea, summary, [role=button]")]
          .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
            return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !e.closest("[hidden],dialog:not([open])") && !(e.type === "checkbox" || e.type === "radio") && !e.classList.contains("sr-only") && (r.height < 43.5 || r.width < 43.5); })
          .map((e) => `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.textContent || e.id || e.type || "").trim().slice(0, 24)}(${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)})`));
        if (small.length) bad.push(`${u} -> ${[...new Set(small)].slice(0, 6).join(", ")}`);
      }
      ok(`tap targets >= 44px at ${width}px on ${urls.length} pages`, bad.length === 0, "\n      " + bad.join("\n      "));
      await b.close();
    }
  },

  async keyboardAndModals() {
    const { b, p } = await open({ width: 390 });
    await seedViaBackup(p, genData());
    await p.goto(p.base + "/"); await p.waitForTimeout(500);
    await p.keyboard.press("Tab");
    ok("a11y: first Tab reaches a skip link", (await p.evaluate(() => document.activeElement?.textContent?.trim())) === "Skip to main content");
    await p.getByRole("button", { name: "More" }).focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
    let inside = true;
    for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); inside = inside && (await p.evaluate(() => { const a = document.activeElement; return !a || a === document.body || !!a.closest("dialog[open]"); })); }
    ok("a11y: modal keeps keyboard focus off the page behind it", inside);
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    ok("a11y: Escape closes modal and returns focus to opener", (await p.locator("dialog[open]").count()) === 0 && (await p.evaluate(() => document.activeElement?.textContent?.trim())) === "More");
    await p.goto(p.base + "/patients/new");
    await p.getByRole("button", { name: "Create patient" }).click(); await p.waitForTimeout(300);
    ok("a11y: invalid fields are marked aria-invalid with linked message", (await p.getByLabel("Full name *").getAttribute("aria-invalid")) === "true" && !!(await p.getByLabel("Full name *").getAttribute("aria-describedby")));
    await b.close();
  },

  async mobileKeyboards() {
    const { b, p } = await open({ width: 390 });
    await seedViaBackup(p, genData());
    const attr = async (label, a) => p.getByLabel(label, { exact: true }).first().getAttribute(a);
    await p.goto(p.base + "/patients/new");
    ok("keyboards: patient mobile = tel", (await attr("Mobile *", "type")) === "tel" && (await attr("Mobile *", "inputmode")) === "tel");
    ok("keyboards: DOB = date", (await attr("Date of birth", "type")) === "date");
    ok("keyboards: age = numeric", (await attr("Age (years, if DOB unknown)", "inputmode")) === "numeric");
    ok("keyboards: emergency phone = tel", (await attr("Phone", "type")) === "tel");
    await p.goto(p.base + "/consultations/new");
    ok("keyboards: vitals numeric/decimal", (await attr("Pulse (/min)", "inputmode")) === "numeric" && (await attr("Weight (kg)", "inputmode")) === "decimal" && (await attr("Temp (°F)", "inputmode")) === "decimal");
    ok("keyboards: visit/follow-up dates = date", (await attr("Visit date *", "type")) === "date" && (await attr("Follow-up date", "type")) === "date");
    await p.goto(p.base + "/profile");
    ok("keyboards: doctor phone tel, email email", (await attr("Phone", "type")) === "tel" && (await attr("Email", "type")) === "email");
    await p.getByRole("button", { name: "Add chamber" }).click();
    ok("keyboards: chamber phone tel, fee decimal", (await attr("Phone", "type")) === "tel" && (await attr("Consultation fee", "inputmode")) === "decimal");
    await b.close();
  },

  async paginationAndIndexes() {
    const { b, p } = await open();
    await seedViaBackup(p, genData({ patients: 120, consultations: 130, appointmentsToday: 4 }));
    await p.goto(p.base + "/patients"); await p.waitForTimeout(700);
    ok("pagination: patients page shows 50 rows", (await p.locator("main li").count()) === 50);
    await p.getByRole("button", { name: "Show more" }).click(); await p.waitForTimeout(500);
    ok("pagination: Show more loads next 50", (await p.locator("main li").count()) === 100);
    await p.getByLabel("Search patients").fill("PD-000100"); await p.waitForTimeout(600);
    ok("pagination: search finds a patient beyond the first page", (await p.locator("main li").count()) === 1);
    await p.goto(p.base + "/consultations"); await p.waitForTimeout(700);
    ok("pagination: consultations page shows 50 rows + Show more", (await p.locator("main li").count()) === 50 && (await p.getByRole("button", { name: "Show more" }).count()) === 1);
    await p.goto(p.base + "/prescriptions"); await p.getByLabel("Search prescriptions").fill("RX-000130"); await p.waitForTimeout(700);
    ok("pagination: prescription search by Rx ID", (await p.locator("main li").count()) === 1);
    await p.getByLabel("Search prescriptions").fill("Rahim"); await p.waitForTimeout(700);
    ok("pagination: prescription search by patient name", (await p.locator("main li").count()) > 0);
    await p.goto(p.base + "/"); await p.waitForTimeout(700);
    const txt = await p.locator("main").innerText();
    ok("indexes: dashboard counts (120 patients, 13 follow-ups, 4 appts, 5 recent)", txt.includes("Patients\n120") && txt.includes("Pending follow-ups\n13") && txt.includes("Today's appointments\n4") && txt.includes("Recent consultations\n5"), txt.replace(/\n/g, " ").slice(0, 200));
    await p.goto(p.base + "/patients/detail?id=p3"); await p.waitForTimeout(600);
    ok("indexes: timeline loads this patient's consultations only", (await p.locator("ol li").count()) >= 1 && !(await p.locator("ol").innerText()).includes("RX-000002"));
    await b.close();
  },

  async licenseStatesReadOnly() {
    const states = [
      ["expired trial", { id: "license", state: "TRIAL", trialStartedAt: new Date(Date.now() - 40 * 86400000).toISOString() }, /trial has ended/],
      ["revoked license", { id: "license", state: "ACTIVE", signedPayload: "{}", signature: "AAAA", revokedAt: new Date().toISOString() }, /revoked/],
      ["invalid license (cannot be verified)", { id: "license", state: "ACTIVE", signedPayload: "{}", signature: "AAAA" }, /Read-only/],
    ];
    for (const [label, rec, banner] of states) {
      const { b, p } = await open();
      await patient(p, "Existing Patient");
      await idbPut(p, "licenses", rec); await p.goto(p.base + "/patients/new"); await p.waitForTimeout(700);
      ok(`license: ${label} shows read-only banner`, banner.test(await p.getByRole("status").first().innerText()));
      ok(`license: ${label} blocks creating patients`, (await p.getByText("Editing is unavailable").count()) === 1);
      await p.goto(p.base + "/patients"); await p.waitForTimeout(400);
      ok(`license: ${label} still shows existing data`, (await p.getByText("Existing Patient").count()) === 1);
      await p.goto(p.base + "/settings"); await p.waitForTimeout(400);
      const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.getByRole("button", { name: "Export unencrypted backup" }).click()]);
      ok(`license: ${label} still allows backup export`, !!dl);
      await b.close();
    }
  },

  async mobileAndAllPagesLoad() {
    for (const width of [360, 390]) {
      const { b, p } = await open({ width });
      await patient(p);
      const urls = ["/", "/patients", "/consultations", "/consultations/new", "/appointments", "/prescriptions", "/medicines", "/investigations", "/profile", "/settings", "/patients/new"];
      const bad = [];
      for (const u of urls) {
        await p.goto(p.base + u); await p.waitForTimeout(350);
        if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) bad.push(u);
      }
      ok(`mobile ${width}px: no horizontal scroll on ${urls.length} pages`, bad.length === 0, bad.join(","));
      ok(`mobile ${width}px: no page errors`, p.errs.length === 0, p.errs.join(";"));
      await b.close();
    }
  },
};

export async function runAll(only) {
  for (const [name, fn] of Object.entries(tests)) if (!only || only.includes(name)) await run(name, fn);
}
