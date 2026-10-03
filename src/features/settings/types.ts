import type { BaseEntity } from "@/lib/repository";

export interface AppSettings extends BaseEntity {
  prescriptionFooter: string; // custom footer / standing advice printed on every prescription
  lastBackupAt?: string;
}
export const SETTINGS_ID = "app";
export const defaultSettings = (): AppSettings => ({ id: SETTINGS_ID, prescriptionFooter: "" });
