import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ok, open, patient, run, seedViaBackup } from "./lib.mjs";

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
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Export backup file" }).click()]);
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
    await p.goto(p.base + "/consultations"); ok("roles: receptionist blocked from consultations", (await p.getByText("does not have access").count()) === 1);
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
