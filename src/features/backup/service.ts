import type { BaseEntity, Repository } from "@/lib/repository";
import * as repos from "@/lib/repositories";
import { updateSettings } from "@/features/settings/service";
import type { BackupDestination, BackupService } from "./types";

export const BACKUP_FORMAT = 1;

/** Tables included in a backup. The license is deliberately excluded (it is bound to this device). */
const TABLES: Record<string, Repository<BaseEntity>> = {
  doctors: repos.doctorRepo, chambers: repos.chamberRepo, patients: repos.patientRepo,
  consultations: repos.consultationRepo, appointments: repos.appointmentRepo, medicines: repos.medicineRepo,
  rxTemplates: repos.rxTemplateRepo, tests: repos.testRepo, panels: repos.panelRepo, settings: repos.settingsRepo,
} as unknown as Record<string, Repository<BaseEntity>>;

export interface BackupFile { app: "petradoc"; formatVersion: number; exportedAt: string; data: Record<string, BaseEntity[]> }
export class BackupError extends Error {}

export function parseBackup(bytes: Uint8Array): { file: BackupFile; counts: Record<string, number> } {
  let file: BackupFile;
  try { file = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new BackupError("This file is not a valid PetraDOC backup (not JSON)."); }
  if (file?.app !== "petradoc" || typeof file.data !== "object" || !file.data) throw new BackupError("This file is not a PetraDOC backup.");
  if (file.formatVersion !== BACKUP_FORMAT) throw new BackupError(`Unsupported backup version ${file.formatVersion}.`);
  const counts: Record<string, number> = {};
  for (const name of Object.keys(TABLES)) {
    const rows = file.data[name];
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r.id !== "string")) throw new BackupError(`Backup is damaged: table "${name}" is missing or invalid.`);
    counts[name] = rows.length;
  }
  return { file, counts };
}

export class LocalBackupService implements BackupService {
  async createBackup() {
    const data: Record<string, BaseEntity[]> = {};
    for (const [name, repo] of Object.entries(TABLES)) data[name] = await repo.list();
    const file: BackupFile = { app: "petradoc", formatVersion: BACKUP_FORMAT, exportedAt: new Date().toISOString(), data };
    return new TextEncoder().encode(JSON.stringify(file));
  }

  /** Validates everything first, then replaces all current data. Not atomic across tables. */
  async restore(bytes: Uint8Array) {
    const { file } = parseBackup(bytes);
    for (const [name, repo] of Object.entries(TABLES)) {
      await repo.clear();
      await repo.importMany(file.data[name]);
    }
  }
}

export const backupService = new LocalBackupService();

/** Pass a passphrase to get a passphrase-encrypted file (AES-GCM); without one the file is plain readable JSON. */
export async function exportBackupFile(passphrase?: string): Promise<{ name: string; bytes: Uint8Array }> {
  const { encryptBackup } = await import("./crypto");
  const plain = await (async () => { await updateSettings({ lastBackupAt: new Date().toISOString() }); return backupService.createBackup(); })();
  const date = new Date().toISOString().slice(0, 10);
  if (passphrase) return { name: `petradoc-backup-${date}.enc.json`, bytes: await encryptBackup(plain, passphrase) };
  return { name: `petradoc-backup-${date}.json`, bytes: plain };
}

/** Planned destinations. They report unavailable and never pretend to upload. */
export class UnavailableDestination implements BackupDestination {
  constructor(readonly name: string, readonly reason: string) {}
  async upload(): Promise<void> { throw new Error(`${this.name}: ${this.reason}`); }
  async list(): Promise<string[]> { throw new Error(`${this.name}: ${this.reason}`); }
  async download(): Promise<Uint8Array> { throw new Error(`${this.name}: ${this.reason}`); }
}
export const GOOGLE_DRIVE = new UnavailableDestination("Google Drive", "not implemented yet (needs OAuth setup)");
