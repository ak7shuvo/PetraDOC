/** Google Drive is a backup/sync DESTINATION, never the primary DB. */
export interface BackupDestination {
  readonly name: string;
  upload(fileName: string, data: Uint8Array): Promise<void>;
  list(): Promise<string[]>;
  download(fileName: string): Promise<Uint8Array>;
}

export interface BackupService {
  createBackup(): Promise<Uint8Array>;
  restore(data: Uint8Array): Promise<void>;
}
