import { db } from "./db";
import type { BaseEntity, ListQuery, Repository } from "./repository";

export class DexieRepository<T extends BaseEntity> implements Repository<T> {
  constructor(
    private table: string,
    private searchText: (e: T) => string = () => "",
  ) {}

  private t() {
    return db.table<T, string>(this.table);
  }

  async get(id: string) {
    return (await this.t().get(id)) ?? null;
  }

  async list(q: ListQuery<T> = {}) {
    let rows = await this.t().toArray();
    if (q.where) {
      const w = Object.entries(q.where);
      rows = rows.filter((r) => w.every(([k, v]) => (r as Record<string, unknown>)[k] === v));
    }
    if (q.search?.trim()) {
      const s = q.search.trim().toLowerCase();
      rows = rows.filter((r) => this.searchText(r).toLowerCase().includes(s));
    }
    rows.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    const off = q.offset ?? 0;
    return rows.slice(off, q.limit ? off + q.limit : undefined);
  }

  async count(where?: Partial<T>) {
    return where ? (await this.list({ where })).length : this.t().count();
  }

  async save(entity: T) {
    const now = new Date().toISOString();
    const existing = await this.get(entity.id);
    const saved = { ...entity, createdAt: existing?.createdAt ?? entity.createdAt ?? now, updatedAt: now };
    await this.t().put(saved);
    return saved;
  }

  async remove(id: string) {
    await this.t().delete(id);
  }

  async clear() {
    await this.t().clear();
  }

  async importMany(entities: T[]) {
    await this.t().bulkPut(entities);
  }
}
