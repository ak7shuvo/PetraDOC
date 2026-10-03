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
