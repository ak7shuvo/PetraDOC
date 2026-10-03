/**
 * Storage abstraction. UI/services depend on this, never on a concrete DB.
 * Implementations: Dexie/IndexedDB (web, src/lib/dexie-repository.ts).
 * Later: SQLite (Capacitor/Tauri), Prisma/PostgreSQL (server).
 */
export interface BaseEntity {
  id: string;
  createdAt?: string; // ISO, set by the repository
  updatedAt?: string; // ISO, set by the repository
}

export interface ListQuery<T> {
  search?: string;
  /** Exact-match filter on top-level fields. */
  where?: Partial<T>;
  limit?: number;
  offset?: number;
}

export interface Repository<T extends BaseEntity> {
  get(id: string): Promise<T | null>;
  /** Newest-updated first. */
  list(query?: ListQuery<T>): Promise<T[]>;
  count(where?: Partial<T>): Promise<number>;
  save(entity: T): Promise<T>;
  remove(id: string): Promise<void>;
  /** Delete every record (used by restore). */
  clear(): Promise<void>;
  /** Insert as-is, keeping ids and timestamps (used by restore). */
  importMany(entities: T[]): Promise<void>;
}

export const newId = (): string => crypto.randomUUID();
