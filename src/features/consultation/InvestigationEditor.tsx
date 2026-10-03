"use client";
import { useEffect, useState } from "react";
import { Button, Card, Input, Select } from "@/components/ui";
import type { Panel } from "@/features/investigations/types";
import { newId } from "@/lib/repository";
import { panelRepo, testRepo } from "@/lib/repositories";
import type { OrderedTest } from "./types";

export function InvestigationEditor({ items, onChange }: { items: OrderedTest[]; onChange: (v: OrderedTest[]) => void }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [manual, setManual] = useState("");

  useEffect(() => { panelRepo.list().then(setPanels); }, []);
  useEffect(() => {
    if (!q.trim()) return setFound([]);
    let live = true;
    testRepo.list({ search: q, limit: 6 }).then((r) => live && setFound(r.map((t) => t.name)));
    return () => { live = false; };
  }, [q]);

  const addNames = (names: string[]) => {
    const have = new Set(items.map((i) => i.name.toLowerCase()));
    const fresh = names.filter((n) => n.trim() && !have.has(n.trim().toLowerCase()));
    onChange([...items, ...fresh.map((name) => ({ id: newId(), name: name.trim(), notes: "" }))]);
  };

  return (
    <Card title="Investigations">
      <div className="space-y-3">
        <div>
          <label htmlFor="testq" className="mb-1 block text-sm font-medium">Add from test list</label>
          <input id="testq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tests"
            className="block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
          {found.length > 0 && (
            <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
              {found.map((n) => <li key={n}><button type="button" onClick={() => { addNames([n]); setQ(""); }} className="block min-h-[44px] w-full px-3 py-2 text-left text-sm hover:bg-surface-2">{n}</button></li>)}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {panels.length > 0 && (
            <Select label="Add panel" options={panels.map((p) => p.name)} value=""
              onChange={(e) => { const p = panels.find((x) => x.name === e.target.value); if (p) addNames(p.tests); }} />
          )}
          <div className="min-w-[200px] flex-1"><Input label="Add manually" value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNames([manual]); setManual(""); } }} /></div>
          <Button variant="secondary" onClick={() => { addNames([manual]); setManual(""); }}>Add</Button>
        </div>
        {items.length === 0 && <p className="text-sm text-muted">No investigations ordered.</p>}
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.id} className="flex items-end gap-2">
              <div className="flex-1"><Input label={t.name} placeholder="Notes (optional)" value={t.notes}
                onChange={(e) => onChange(items.map((i) => (i.id === t.id ? { ...i, notes: e.target.value } : i)))} /></div>
              <Button variant="ghost" className="text-danger" aria-label={`Remove ${t.name}`} onClick={() => onChange(items.filter((i) => i.id !== t.id))}>✕</Button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
