/**
 * Storage abstraction. UI/services depend on this, never on a concrete DB.
 * Implementations (later): Dexie (web), SQLite (Capacitor/Tauri), Prisma (server).
 */
export interface Repository<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  list(query?: { search?: string; limit?: number; offset?: number }): Promise<T[]>;
  save(entity: T): Promise<T>;
  remove(id: string): Promise<void>;
}
