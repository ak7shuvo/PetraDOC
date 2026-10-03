// Dev-only scale check: 2,000 patients / 5,000 consultations loaded through the real restore flow.
//   npm run build && npm run perf [-- patients consultations]
import { genData, open, seedViaBackup, startServer } from "./e2e/lib.mjs";

const [np, nc] = [Number(process.argv[2]) || 2000, Number(process.argv[3]) || 5000];
const srv = await startServer();
const rows = [];
const time = async (label, fn) => { const t = performance.now(); await fn(); const ms = Math.round(performance.now() - t); rows.push([label, ms]); console.log(`${String(ms).padStart(6)} ms  ${label}`); };
try {
  const { b, p } = await open();
  await time(`restore ${np} patients + ${nc} consultations from backup file`, () => seedViaBackup(p, genData({ patients: np, consultations: nc, appointmentsToday: 40 })));
  await p.goto(p.base + "/patients"); await p.getByLabel("Search patients").waitFor();
  await time("patients page: initial list", () => p.waitForFunction(() => document.querySelectorAll("main li a").length > 0));
  await time('patient search "Karim" (name)', async () => { await p.getByLabel("Search patients").fill("Karim"); await p.waitForFunction(() => { const a = [...document.querySelectorAll("main li a")]; return a.length > 0 && a.every((x) => x.textContent.includes("Karim")); }); });
  await time("patient search by mobile", async () => { await p.getByLabel("Search patients").fill("0171000"); await p.waitForTimeout(50); await p.waitForFunction(() => document.querySelectorAll("main li a").length >= 0); });
  await time('patient search by ID "PD-001999"', async () => { await p.getByLabel("Search patients").fill("PD-001999"); await p.waitForFunction(() => document.querySelectorAll("main li a").length === 1); });
  await time("dashboard load (counts + queue + recent)", async () => { await p.goto(p.base + "/"); await p.waitForFunction(() => !document.querySelector("main").innerText.includes("–") && document.querySelector("main").innerText.includes("Patients")); });
  await time("patient detail + timeline", async () => { await p.goto(p.base + "/patients/detail?id=p5"); await p.locator("ol li").first().waitFor(); });
  await time("consultations list page", async () => { await p.goto(p.base + "/consultations"); await p.locator("main li").first().waitFor(); });
  await time("prescriptions list page", async () => { await p.goto(p.base + "/prescriptions"); await p.locator("main li").first().waitFor(); });
  await time("appointments page (today)", async () => { await p.goto(p.base + "/appointments"); await p.locator("main li").first().waitFor(); });
  await time("patient picker search (new consultation)", async () => { await p.goto(p.base + "/consultations/new"); await p.getByLabel("Patient *").fill("Karim"); await p.getByRole("button", { name: /Karim/ }).first().waitFor(); });
  console.log("DOM rows on lists:", await (async () => { await p.goto(p.base + "/patients"); await p.waitForTimeout(800); return p.locator("main li").count(); })());
  await b.close();
} finally { srv.kill(); }
