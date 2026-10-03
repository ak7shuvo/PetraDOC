"use client";
import { useRef, useState } from "react";
import { Badge, Button, Modal, Select, useToast } from "@/components/ui";
import { downloadBlob } from "@/features/printing/pdf";
import { parseTable } from "./csv";

export const MAX_IMPORT_ROWS = 10000;
const MAX_BYTES = 5 * 1024 * 1024;

/** `item` is the importable data (without id). `existing` is set when `update` mode may overwrite. */
export interface ImportKind<T extends { id: string }> {
  title: string;               // e.g. "Import medicines"
  listKey: string;             // JSON key, e.g. "medicines"
  sampleName: string;          // sample file name
  sampleCsv: string;
  describe: (item: Omit<T, "id">) => string;
  /** Map one normalised row to an item, or an error message. */
  toItem: (row: Record<string, string>) => { item: Omit<T, "id"> } | { error: string };
  keyOf: (item: Omit<T, "id">) => string;
  loadExisting: () => Promise<T[]>;
  /** Merge an imported item over an existing one (update mode). */
  merge: (existing: T, item: Omit<T, "id">) => T;
  create: (item: Omit<T, "id">) => T;
  saveAll: (items: T[]) => Promise<void>;
}

interface Row<T> { n: number; status: "new" | "duplicate" | "invalid"; label: string; error?: string; item?: Omit<T, "id">; existing?: T }

export function BulkImport<T extends { id: string }>({ kind, onDone }: { kind: ImportKind<T>; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row<T>[] | null>(null);
  const [fileErr, setFileErr] = useState("");
  const [mode, setMode] = useState("Skip duplicates");
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const reset = () => { setRows(null); setFileErr(""); setMode("Skip duplicates"); };
  const close = () => { setOpen(false); reset(); };

  const load = async (f: File) => {
    reset();
    if (f.size > MAX_BYTES) return setFileErr("File is larger than 5 MB.");
    try {
      const table = parseTable(await f.text(), f.name, kind.listKey);
      if (table.length > MAX_IMPORT_ROWS) return setFileErr(`Too many rows (max ${MAX_IMPORT_ROWS}).`);
      if (table.length === 0) return setFileErr("No data rows found.");
      const existing = new Map((await kind.loadExisting()).map((e) => [kind.keyOf(e as unknown as Omit<T, "id">), e]));
      const seen = new Set<string>();
      setRows(table.map((r, i) => {
        const res = kind.toItem(r);
        if ("error" in res) return { n: i + 2, status: "invalid" as const, label: Object.values(r).filter(Boolean).join(" ") || "(empty)", error: res.error };
        const k = kind.keyOf(res.item);
        const dup = seen.has(k) || existing.has(k);
        const row: Row<T> = { n: i + 2, status: dup ? "duplicate" : "new", label: kind.describe(res.item), item: res.item, existing: seen.has(k) ? undefined : existing.get(k) };
        seen.add(k);
        return row;
      }));
    } catch (e) { setFileErr(e instanceof Error ? e.message : "Could not read the file."); }
  };

  const count = (s: Row<T>["status"]) => rows?.filter((r) => r.status === s).length ?? 0;
  const update = mode === "Update existing";
  const toSave = rows?.filter((r) => r.status === "new" || (update && r.status === "duplicate" && r.existing)) ?? [];

  const save = async () => {
    const items = toSave.map((r) => (r.status === "new" ? kind.create(r.item!) : kind.merge(r.existing!, r.item!)));
    await kind.saveAll(items);
    toast(`Imported ${items.length} item(s)`); close(); onDone();
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Import…</Button>
      <Modal open={open} onClose={close} title={kind.title}>
        <div className="space-y-3 text-sm">
          <p>Choose a CSV or JSON file. You can review everything before anything is saved.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => input.current?.click()}>Choose file…</Button>
            <Button variant="ghost" onClick={() => downloadBlob(new Blob([kind.sampleCsv], { type: "text/csv" }), kind.sampleName)}>Download sample CSV</Button>
            <input ref={input} type="file" accept=".csv,.json,text/csv,application/json" hidden aria-label="Import file"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) load(f); }} />
          </div>
          {fileErr && <p role="alert" className="text-danger-fg">{fileErr}</p>}
          {rows && (
            <>
              <div className="flex flex-wrap gap-2" aria-label="Import summary">
                <Badge tone="success">{count("new")} new</Badge><Badge tone="warning">{count("duplicate")} duplicate</Badge><Badge tone="danger">{count("invalid")} invalid</Badge>
              </div>
              <Select label="Duplicates" options={["Skip duplicates", "Update existing"]} placeholder="Duplicates" value={mode} onChange={(e) => e.target.value && setMode(e.target.value)} />
              <ul className="max-h-56 divide-y divide-border overflow-auto rounded-lg border border-border" aria-label="Import preview">
                {rows.slice(0, 200).map((r) => (
                  <li key={r.n} className="flex items-start gap-2 px-2 py-1 text-xs">
                    <span className="w-8 shrink-0 text-muted">{r.n}</span>
                    <span className="min-w-0 flex-1 break-words">{r.label}{r.error && <span className="text-danger-fg"> · {r.error}</span>}</span>
                    <Badge tone={r.status === "new" ? "success" : r.status === "duplicate" ? "warning" : "danger"}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
              {rows.length > 200 && <p className="text-xs text-muted">Showing the first 200 of {rows.length} rows.</p>}
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button disabled={!toSave.length} onClick={save}>Import {toSave.length} item(s)</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
