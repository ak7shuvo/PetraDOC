// Builds a separate copy of the app with a TEST public key and verifies real signed-license activation.
//   node scripts/e2e/license-signed.mjs      (also: npm run e2e:license)
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.E2E_PORT = "3113";
const { failures, ok, open, patient, run, startServer, total } = await import("./lib.mjs");
const dir = mkdtempSync(path.join(os.tmpdir(), "petradoc-lic-"));
const tool = (...a) => spawnSync("node", ["scripts/license-tool.mjs", ...a], { encoding: "utf8" }).stdout.trim();
tool("keygen", dir); tool("keygen", dir + "/other");
const key = (name, exp) => tool("sign", `${dir}/private.jwk`, name, "LIC-" + name, ...(exp ? [exp] : []));
const valid = key("DrTest", "2099-12-31"), expired = key("DrOld", "2020-01-01");
const forged = tool("sign", `${dir}/other/private.jwk`, "DrFake", "LIC-X", "2099-12-31");
const [pl, sig] = valid.split(".");
const tampered = Buffer.from(Buffer.from(pl, "base64url").toString().replace("DrTest", "DrEvil")).toString("base64url") + "." + sig;

console.log("building with test public key into .next-license ...");
const b = spawnSync("npm", ["run", "build"], { env: { ...process.env, NEXT_PUBLIC_LICENSE_PUBLIC_KEY: readFileSync(dir + "/public.jwk", "utf8"), NEXT_DIST_DIR: ".next-license" }, stdio: "ignore" });
if (b.status !== 0) { console.log("FAIL  build with license key"); process.exit(1); }
const srv = await startServer(".next-license");
try {
  await run("signedLicense", async () => {
    const { b, p } = await open({ trial: false });
    await p.goto(p.base + "/settings");
    const act = async (t) => { await p.getByLabel("License key").fill(t); await p.getByRole("button", { name: "Activate" }).click(); await p.waitForTimeout(600); return p.locator("p[role=status]").last().innerText(); };
    ok("signed: garbage key rejected", (await act("abc")).includes("not a valid license key"));
    ok("signed: key signed by another vendor rejected", (await act(forged)).includes("signature does not match"));
    ok("signed: tampered payload rejected", (await act(tampered)).includes("signature does not match"));
    ok("signed: expired license rejected", (await act(expired)).includes("expired on 2020-01-01"));
    ok("signed: still read-only after rejected keys", (await p.getByText("ACTIVE", { exact: true }).count()) === 0);
    ok("signed: valid key activates", (await act(valid)).includes("activated for DrTest"));
    ok("signed: status ACTIVE, banner gone", (await p.getByText("ACTIVE", { exact: true }).count()) === 1 && (await p.getByText(/read-only/i).count()) === 0);
    await patient(p, "After Activation");
    await p.waitForTimeout(600);
    ok("signed: writes allowed once active", (await p.getByText("After Activation").count()) > 0);
    await p.goto(p.base + "/settings"); await p.waitForTimeout(800);
    ok("signed: license persists after reload", (await p.getByText("ACTIVE", { exact: true }).count()) === 1);
    await b.close();
  });
} finally { srv.kill(); }
console.log(`\n${total() - failures()}/${total()} checks passed`);
process.exit(failures() ? 1 : 0);
