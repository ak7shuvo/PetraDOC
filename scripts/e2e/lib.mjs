// Dev-only end-to-end helpers (not shipped). Requires a production build: `npm run build`.
import { chromium, firefox, webkit } from "playwright-core";
import { spawn } from "node:child_process";

export const PORT = process.env.E2E_PORT || "3111";
export const base = `http://localhost:${PORT}`;
const TYPES = { chromium, firefox, webkit };
export const browserName = process.env.E2E_BROWSER || "chromium";
const results = [];

export function ok(name, cond, detail = "") {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + detail}`);
}
export const failures = () => results.filter((r) => !r.pass).length;
export const total = () => results.length;

export async function startServer(dist = ".next") {
  const srv = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", PORT], { env: { ...process.env, NEXT_DIST_DIR: dist }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + "/")).ok) return srv; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  srv.kill(); throw new Error("server did not start");
}

/** Fresh browser + page (fresh IndexedDB). Starts the local trial unless trial:false. */
export async function open({ width = 390, height = 900, trial = true, role } = {}) {
  const b = await TYPES[browserName].launch();
  const ctx = await b.newContext({ viewport: { width, height }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.errs = [];
  p.on("pageerror", (e) => p.errs.push(e.message));
  p.on("dialog", (d) => d.accept());
  p.base = base;
  await p.goto(base + "/");
  if (role) await p.evaluate((r) => localStorage.setItem("petradoc.activeRole", r), role);
  if (trial) {
    const t = p.getByRole("button", { name: "Start 30-day trial" });
    await t.waitFor({ timeout: 5000 }).catch(() => {});
    if (await t.count()) { await t.click(); await p.waitForTimeout(300); }
  }
  return { b, p };
}

export async function patient(p, name = "Rahim Uddin", mobile = "01711223344") {
  await p.goto(base + "/patients/new");
  await p.getByLabel("Full name *").fill(name);
  await p.getByLabel("Mobile *").fill(mobile);
  await p.getByRole("button", { name: "Create patient" }).click();
  await p.waitForURL(/detail/);
}

export async function run(name, fn) {
  console.log(`\n== ${name} [${browserName}]`);
  try { await fn(); } catch (e) { ok(`${name}: completed without exception`, false, String(e.message).split("\n")[0]); }
}

const TABLES = ["doctors", "chambers", "patients", "consultations", "appointments", "medicines", "rxTemplates", "tests", "panels", "settings"];

/** Builds a PetraDOC backup object; unspecified tables are empty. */
export const makeBackup = (data) => ({
  app: "petradoc", formatVersion: 1, exportedAt: new Date().toISOString(),
  data: Object.fromEntries(TABLES.map((t) => [t, data[t] ?? []])),
});

/** Loads data into the app through the real restore flow (also exercises restore at scale). */
export async function seedViaBackup(p, data, file = "/tmp/e2e-seed.json") {
  const fs = await import("node:fs");
  fs.writeFileSync(file, JSON.stringify(makeBackup(data)));
  await p.goto(base + "/settings");
  await p.getByLabel("Backup file").setInputFiles(file);
  await p.getByRole("button", { name: "Replace data and restore" }).click();
  await p.waitForTimeout(2500);
}

const FIRST = ["Rahim", "Karim", "Ayesha", "Fatima", "Nusrat", "Imran", "Sadia", "Tanvir", "Mitu", "Rafiq", "Salma", "Jamal", "Rina", "Hasan", "Lipi"];
const LAST = ["Uddin", "Hossain", "Begum", "Khan", "Akter", "Ahmed", "Chowdhury", "Islam", "Sarker", "Mia"];
const dateOf = (offsetDays) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
const blankPatient = { dob: "", approxAge: "30", gender: "Male", address: "Dhaka", bloodGroup: "", occupation: "", emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", notes: "" };

/** Deterministic demo/scale data in backup format. */
export function genData({ patients = 5, consultations = 8, appointmentsToday = 4 } = {}) {
  const now = new Date().toISOString();
  const t = { createdAt: now, updatedAt: now };
  const doctors = [{ id: "d1", name: "Anika Rahman", title: "Dr.", gender: "Female", phone: "01700000000", email: "", address: "", specialty: "Medicine", subSpecialty: "", bmdcNumber: "A-12345", experienceYears: "10", position: "", department: "", expertise: "", languages: "", education: [{ id: "e1", degree: "MBBS", institution: "DMC", passingYear: "2012", specialty: "" }], training: [], experience: [], ...t }];
  const chambers = [{ id: "ch1", doctorId: "d1", name: "City Clinic", address: "Road 1", phone: "01711111111", visitingHours: "5pm-9pm", fee: "500", ...t }];
  const pts = Array.from({ length: patients }, (_, i) => ({
    id: `p${i}`, code: `PD-${String(i + 1).padStart(6, "0")}`, name: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]} ${i}`,
    mobile: `01${7 + (i % 3)}${String(10000000 + i * 37).slice(0, 8)}`, ...blankPatient, ...t,
    updatedAt: new Date(Date.now() - i * 1000).toISOString(),
  }));
  const cons = Array.from({ length: consultations }, (_, i) => ({
    id: `c${i}`, rxCode: `RX-${String(i + 1).padStart(6, "0")}`, patientId: `p${i % patients}`, doctorId: "d1", chamberId: "ch1", date: dateOf(i % 365),
    chiefComplaint: "Fever", history: "", examination: "", diagnosis: "Viral fever", advice: "Rest", followUpNotes: "",
    followUpDate: i % 10 === 0 ? dateOf(-7) : undefined,
    vitals: { bp: "120/80", pulse: "80", temperature: "99", spo2: "98", respiratoryRate: "16", weight: "70", height: "170", bmi: "24.2" },
    medicines: [{ id: `m${i}a`, name: "Napa", strength: "500 mg", dose: "1", frequency: "1+0+1", route: "Oral", duration: "5 days", instructions: "" }],
    investigations: [{ id: `t${i}a`, name: "CBC", notes: "" }], ...t,
  }));
  const appts = Array.from({ length: appointmentsToday }, (_, i) => ({
    id: `a${i}`, patientId: `p${i % patients}`, doctorId: "d1", chamberId: "ch1", date: dateOf(0), token: i + 1,
    status: ["scheduled", "waiting", "in_consultation", "done"][i % 4], notes: "", ...t,
  }));
  const medicines = [["Paracetamol", "Napa"], ["Omeprazole", "Seclo"], ["Cetirizine", "Alatrol"]].map(([generic, brand], i) => ({ id: `med${i}`, generic, brand, strength: "10 mg", form: "Tablet", route: "Oral", manufacturer: "ACME", favourite: i === 0, ...t }));
  const tests = [["CBC", "Haematology"], ["ESR", "Haematology"], ["Creatinine", "Biochemistry"]].map(([name, category], i) => ({ id: `tst${i}`, name, category, ...t }));
  return { doctors, chambers, patients: pts, consultations: cons, appointments: appts, medicines, tests, panels: [{ id: "pn1", name: "Fever", tests: ["CBC", "ESR"], ...t }], rxTemplates: [{ id: "tp1", name: "Fever template", items: [], ...t }] };
}
