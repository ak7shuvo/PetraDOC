export type LicenseState =
  | "UNACTIVATED" | "TRIAL" | "ACTIVE" | "EXPIRED" | "REVOKED" | "INVALID";

export interface LicenseInfo {
  state: LicenseState;
  expiresAt?: string;
  // Future: signed payload + signature from license server.
  signedPayload?: string;
  signature?: string;
}

export interface LicenseRepository {
  load(): Promise<LicenseInfo | null>;
  save(info: LicenseInfo): Promise<void>;
}

export interface LicenseValidator {
  validate(info: LicenseInfo | null): Promise<LicenseState>;
}
