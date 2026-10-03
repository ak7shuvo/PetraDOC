import { licenseRepo } from "@/lib/repositories";
import type { LicenseInfo, LicenseRepository } from "./types";
import { parseLicenseKey, SignedLicenseValidator, type Verification } from "./validator";

const ID = "license";

/** Dexie-backed license storage. Kept separate from the Doctor Profile on purpose. */
class DexieLicenseRepository implements LicenseRepository {
  async load() { return (await licenseRepo.get(ID)) ?? null; }
  async save(info: LicenseInfo) { await licenseRepo.save({ ...info, id: ID }); }
}

function publicKey(): JsonWebKey | undefined {
  try { const raw = process.env.NEXT_PUBLIC_LICENSE_PUBLIC_KEY; return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
}

const repo = new DexieLicenseRepository();
export const licenseValidator = new SignedLicenseValidator(publicKey());

export interface LicenseStatus extends Verification { info: LicenseInfo | null; canWrite: boolean }

export async function getLicenseStatus(): Promise<LicenseStatus> {
  const info = await repo.load();
  const v = await licenseValidator.verify(info);
  return { ...v, info, canWrite: v.state === "TRIAL" || v.state === "ACTIVE" };
}

export async function startTrial(): Promise<void> {
  const cur = await repo.load();
  if (cur?.trialStartedAt) return;
  await repo.save({ ...(cur ?? { state: "TRIAL" }), state: "TRIAL", trialStartedAt: new Date().toISOString() });
}

export async function activateLicense(text: string): Promise<{ ok: boolean; message: string }> {
  const parsed = parseLicenseKey(text);
  if (!parsed) return { ok: false, message: "That is not a valid license key format." };
  const cur = await repo.load();
  const candidate: LicenseInfo = { ...(cur ?? {}), ...parsed, state: "INVALID", revokedAt: undefined };
  const v = await licenseValidator.verify(candidate);
  if (v.state !== "ACTIVE") return { ok: false, message: v.reason ?? "License could not be validated." };
  await repo.save({ ...candidate, state: "ACTIVE", expiresAt: v.payload?.expiresAt });
  return { ok: true, message: `License activated for ${v.payload?.holder ?? "holder"}.` };
}
