"use client";
import { newId } from "@/lib/repository";
import { Button } from "./Button";
import { Input } from "./Field";

export interface FieldDef<T> { key: keyof T & string; label: string; placeholder?: string }

/** Unlimited add/remove entries, each with simple text fields. */
export function RepeatableList<T extends { id: string }>({
  items, onChange, fields, empty, addLabel, itemLabel,
}: {
  items: T[]; onChange: (items: T[]) => void; fields: FieldDef<T>[];
  empty: () => Omit<T, "id">; addLabel: string; itemLabel: string;
}) {
  const update = (id: string, k: string, v: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted">No entries yet.</p>}
      {items.map((it, n) => (
        <fieldset key={it.id} className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs text-muted">{itemLabel} {n + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Input key={f.key} label={f.label} placeholder={f.placeholder}
                value={String(it[f.key] ?? "")} onChange={(e) => update(it.id, f.key, e.target.value)} />
            ))}
          </div>
          <Button variant="ghost" className="mt-2 text-danger-fg" onClick={() => onChange(items.filter((i) => i.id !== it.id))}>
            Remove {itemLabel.toLowerCase()} {n + 1}
          </Button>
        </fieldset>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { ...empty(), id: newId() } as T])}>{addLabel}</Button>
    </div>
  );
}
