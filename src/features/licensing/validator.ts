import { localDate } from "@/lib/date";
import type { LicenseInfo, LicensePayload, LicenseState, LicenseValidator } from "./types";

export const TRIAL_DAYS = 30;

export interface Verification { state: LicenseState; payload?: LicensePayload; reason?: string; trialDaysLeft?: number }

const b64uToBytes = (s: string) => {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b + "=".repeat((4 - (b.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

/** License key text = base64url(payload JSON) + "." + base64url(signature). */
export function parseLicenseKey(text: string): { signedPayload: string; signature: string } | null {
  const [p, sig, ...rest] = text.trim().split(".");
  if (!p || !sig || rest.length) return null;
  try { return { signedPayload: new TextDecoder().decode(b64uToBytes(p)), signature: sig }; } catch { return null; }
}

/**
 * Verifies vendor-signed licenses with a public key supplied at build time
 * (NEXT_PUBLIC_LICENSE_PUBLIC_KEY, a JWK). There is no hardcoded key and no license server yet:
 * without a configured public key a signed license can never validate.
 */
export class SignedLicenseValidator implements LicenseValidator {
  constructor(private publicKeyJwk?: JsonWebKey) {}

  async validate(info: LicenseInfo | null) { return (await this.verify(info)).state; }

  async verify(info: LicenseInfo | null, now = new Date()): Promise<Verification> {
    if (!info) return { state: "UNACTIVATED" };
    if (info.revokedAt) return { state: "REVOKED", reason: "This license was revoked." };
    if (info.signedPayload && info.signature) {
      if (!this.publicKeyJwk) return { state: "INVALID", reason: "No license verification key is configured in this build." };
      try {
        const key = await crypto.subtle.importKey("jwk", this.publicKeyJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
        const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64uToBytes(info.signature), new TextEncoder().encode(info.signedPayload));
        if (!ok) return { state: "INVALID", reason: "License signature does not match." };
        const payload = JSON.parse(info.signedPayload) as LicensePayload;
        if (payload.expiresAt && payload.expiresAt < localDate(now)) return { state: "EXPIRED", payload, reason: `License expired on ${payload.expiresAt}.` };
        return { state: "ACTIVE", payload };
      } catch {
        return { state: "INVALID", reason: "License data could not be read." };
      }
    }
    if (info.trialStartedAt) {
      const left = Math.ceil((new Date(info.trialStartedAt).getTime() + TRIAL_DAYS * 86400000 - now.getTime()) / 86400000);
      return left > 0 ? { state: "TRIAL", trialDaysLeft: left } : { state: "EXPIRED", trialDaysLeft: 0, reason: "The trial has ended." };
    }
    return { state: "UNACTIVATED" };
  }
}
