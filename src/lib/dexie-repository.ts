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

  private indexed(field: string) {
    const sc = this.t().schema;
    return field === sc.primKey.name || !!sc.idxByName[field];
  }

  async list(q: ListQuery<T> = {}) {
    const t = this.t();
    const needle = q.search?.trim().toLowerCase();
    const where = q.where ? Object.entries(q.where) : [];
    const matches = (r: T) =>
      where.every(([k, v]) => (r as Record<string, unknown>)[k] === v) &&
      (!q.filter || q.filter(r)) &&
      (!needle || this.searchText(r).toLowerCase().includes(needle));

    if (q.orderBy && this.indexed(q.orderBy)) {
      // Cursor over an index: stops early when limit is set.
      let c = t.orderBy(q.orderBy);
      if (q.desc) c = c.reverse();
      c = c.filter(matches);
      if (q.offset) c = c.offset(q.offset);
      if (q.limit) c = c.limit(q.limit);
      return c.toArray();
    }
    const key = where.find(([k, v]) => this.indexed(k) && (typeof v === "string" || typeof v === "number"));
    let rows = key ? await t.where(key[0]).equals(key[1] as string | number).toArray() : await t.toArray();
    rows = rows.filter(matches);
    rows.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    const off = q.offset ?? 0;
    return rows.slice(off, q.limit ? off + q.limit : undefined);
  }

  async count(where?: Partial<T>) {
    const e = where ? Object.entries(where) : [];
    if (e.length === 1 && this.indexed(e[0][0]) && (typeof e[0][1] === "string" || typeof e[0][1] === "number"))
      return this.t().where(e[0][0]).equals(e[0][1] as string | number).count();
    return e.length ? (await this.list({ where })).length : this.t().count();
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
