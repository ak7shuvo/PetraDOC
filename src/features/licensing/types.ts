export type LicenseState =
  | "UNACTIVATED" | "TRIAL" | "ACTIVE" | "EXPIRED" | "REVOKED" | "INVALID";

export interface LicenseInfo {
  state: LicenseState; // last computed state (informational; always recomputed by the validator)
  expiresAt?: string;
  /** JSON text of the signed license payload, exactly as signed by the vendor. */
  signedPayload?: string;
  /** base64url ECDSA P-256 / SHA-256 signature over `signedPayload`. */
  signature?: string;
  trialStartedAt?: string; // ISO; local trial only
  revokedAt?: string; // set by a future license-server check; no server exists yet
}

export interface LicensePayload { licenseId: string; holder: string; issuedAt: string; expiresAt?: string }

export interface LicenseRepository {
  load(): Promise<LicenseInfo | null>;
  save(info: LicenseInfo): Promise<void>;
}

export interface LicenseValidator {
  validate(info: LicenseInfo | null): Promise<LicenseState>;
}
