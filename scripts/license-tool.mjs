#!/usr/bin/env node
// Vendor-side license tooling (NOT shipped in the app). Uses Node's WebCrypto.
//   node scripts/license-tool.mjs keygen <dir>                       -> private.jwk, public.jwk
//   node scripts/license-tool.mjs sign <private.jwk> <holder> <licenseId> [expiresAt YYYY-MM-DD]
// Put the content of public.jwk (single line) in NEXT_PUBLIC_LICENSE_PUBLIC_KEY at build time.
// Keep private.jwk secret and out of the repository.
import { webcrypto as c } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const [cmd, ...a] = process.argv.slice(2);

if (cmd === "keygen") {
  const dir = a[0] ?? ".";
  mkdirSync(dir, { recursive: true });
  const { privateKey, publicKey } = await c.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  writeFileSync(`${dir}/private.jwk`, JSON.stringify(await c.subtle.exportKey("jwk", privateKey)));
  writeFileSync(`${dir}/public.jwk`, JSON.stringify(await c.subtle.exportKey("jwk", publicKey)));
  console.log(`Wrote ${dir}/private.jwk (SECRET) and ${dir}/public.jwk`);
} else if (cmd === "sign") {
  const [keyFile, holder, licenseId, expiresAt] = a;
  if (!keyFile || !holder || !licenseId) { console.error("usage: sign <private.jwk> <holder> <licenseId> [expiresAt]"); process.exit(1); }
  const key = await c.subtle.importKey("jwk", JSON.parse(readFileSync(keyFile, "utf8")), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const payload = JSON.stringify({ licenseId, holder, issuedAt: new Date().toISOString().slice(0, 10), ...(expiresAt ? { expiresAt } : {}) });
  const sig = await c.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(payload));
  console.log(`${b64u(Buffer.from(payload))}.${b64u(sig)}`);
} else {
  console.error("commands: keygen <dir> | sign <private.jwk> <holder> <licenseId> [expiresAt]");
  process.exit(1);
}
