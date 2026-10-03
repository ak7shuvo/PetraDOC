// Dev-only accessibility check (axe-core in headless Chromium). Not shipped.
//   npm run build && npm run a11y     (exit code 1 if any serious/critical violation)
import { createRequire } from "node:module";
import { genData, open, seedViaBackup, startServer } from "./e2e/lib.mjs";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const PAGES = ["/", "/patients", "/patients/new", "/patients/detail?id=p0", "/patients/edit?id=p0", "/consultations", "/consultations/new", "/consultations/edit?id=c0",
  "/prescriptions", "/prescriptions/view?id=c0", "/appointments", "/medicines", "/investigations", "/profile", "/settings"];

const srv = await startServer();
let blocking = 0;
try {
  for (const width of [390, 1280]) {
    const { b, p } = await open({ width, height: width > 600 ? 900 : 800 });
    await seedViaBackup(p, genData());
    const check = async (label) => {
      await p.addScriptTag({ path: AXE });
      const res = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })).violations
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })));
      const hard = res.filter((v) => v.impact === "serious" || v.impact === "critical");
      blocking += hard.length;
      console.log(`${hard.length ? "FAIL" : "ok  "} ${width}px ${label}  serious/critical=${hard.length} other=${res.length - hard.length}`);
      for (const v of hard) console.log(`      [${v.impact}] ${v.id}: ${v.help}  ${v.nodes.join(" | ")}`);
      if (process.env.A11Y_VERBOSE) for (const v of res.filter((x) => !hard.includes(x))) console.log(`      (${v.impact}) ${v.id}: ${v.nodes[0]}`);
    };
    for (const u of PAGES) { await p.goto(p.base + u); await p.waitForTimeout(700); await check(u); }
    // dialogs open
    await p.goto(p.base + "/profile"); await p.waitForTimeout(500);
    await p.getByRole("button", { name: "Add chamber" }).click(); await p.waitForTimeout(300); await check("/profile (chamber dialog)");
    await b.close();
  }
} finally { srv.kill(); }
console.log(blocking ? `\n${blocking} serious/critical violation(s)` : "\nNo serious or critical violations");
process.exit(blocking ? 1 : 0);
