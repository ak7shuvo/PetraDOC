"use client";
import { useEffect, useState } from "react";
import { Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
import { FREQUENCIES, medicineLabel, type Medicine, type RxTemplate } from "@/features/medicines/types";
import { newId } from "@/lib/repository";
import { medicineRepo, rxTemplateRepo } from "@/lib/repositories";
import { listForPatient } from "./service";
import type { Consultation, RxItem } from "./types";

const blank = (): RxItem => ({ id: newId(), name: "", strength: "", dose: "", frequency: "", route: "", duration: "", instructions: "" });
const fromMedicine = (m: Medicine): RxItem => ({ ...blank(), name: medicineLabel(m), strength: m.strength, route: m.route });
const clone = (items: RxItem[]) => items.map((i) => ({ ...i, id: newId() }));

export function PrescriptionEditor({ items, onChange, patientId, currentId }: {
  items: RxItem[]; onChange: (v: RxItem[]) => void; patientId: string; currentId: string;
}) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Medicine[]>([]);
  const [favs, setFavs] = useState<Medicine[]>([]);
  const [templates, setTemplates] = useState<RxTemplate[]>([]);
  const [previous, setPrevious] = useState<Consultation[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const toast = useToast();

  const loadTemplates = () => rxTemplateRepo.list().then(setTemplates);
  useEffect(() => { medicineRepo.list({ where: { favourite: true } }).then(setFavs); loadTemplates(); }, []);
  useEffect(() => {
    if (!patientId) return setPrevious([]);
    listForPatient(patientId).then((r) => setPrevious(r.filter((c) => c.id !== currentId && c.medicines.length > 0)));
  }, [patientId, currentId]);
  useEffect(() => {
    if (!q.trim()) return setFound([]);
    let live = true;
    medicineRepo.list({ search: q, limit: 6 }).then((r) => live && setFound(r));
    return () => { live = false; };
  }, [q]);

  const update = (id: string, k: keyof RxItem, v: string) => onChange(items.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  const add = (it: RxItem) => { onChange([...items, it]); setQ(""); };

  return (
    <Card title="Prescription">
      <div className="space-y-3">
        <div>
          <label htmlFor="medq" className="mb-1 block text-sm font-medium">Add from medicine list</label>
          <input id="medq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search generic or brand"
            className="block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
          {found.length > 0 && (
            <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
              {found.map((m) => (
                <li key={m.id}><button type="button" onClick={() => add(fromMedicine(m))} className="block min-h-[44px] w-full px-3 py-2 text-left text-sm hover:bg-surface-2">
                  {medicineLabel(m)} {m.strength}</button></li>
              ))}
            </ul>
          )}
        </div>
        {favs.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Favourite medicines">
            {favs.map((m) => <Button key={m.id} variant="secondary" onClick={() => add(fromMedicine(m))}>★ {m.brand || m.generic}</Button>)}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="secondary" onClick={() => add(blank())}>Add manually</Button>
          {templates.length > 0 && (
            <Select label="Apply template" options={templates.map((t) => t.name)} value=""
              onChange={(e) => { const t = templates.find((x) => x.name === e.target.value); if (t) { onChange([...items, ...clone(t.items)]); toast(`Template applied: ${t.name}`); } }} />
          )}
          {previous.length > 0 && (
            <Select label="Use previous prescription as new" options={previous.map((c) => `${c.date} · ${c.rxCode}`)} value=""
              onChange={(e) => { const c = previous.find((x) => `${x.date} · ${x.rxCode}` === e.target.value); if (c) { onChange([...items, ...clone(c.medicines)]); toast(`Copied from ${c.rxCode}`); } }} />
          )}
          {items.length > 0 && <Button variant="ghost" onClick={() => { setTplName(""); setSaveOpen(true); }}>Save as template</Button>}
        </div>
        <datalist id="freqs">{FREQUENCIES.map((f) => <option key={f} value={f} />)}</datalist>
        {items.length === 0 && <p className="text-sm text-muted">No medicines added.</p>}
        {items.map((it, n) => (
          <fieldset key={it.id} className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs text-muted">Medicine {n + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Medicine" value={it.name} onChange={(e) => update(it.id, "name", e.target.value)} />
              <Input label="Strength" value={it.strength} onChange={(e) => update(it.id, "strength", e.target.value)} />
              <Input label="Dose" placeholder="1 tablet" value={it.dose} onChange={(e) => update(it.id, "dose", e.target.value)} />
              <Input label="Frequency" list="freqs" value={it.frequency} onChange={(e) => update(it.id, "frequency", e.target.value)} />
              <Input label="Route" value={it.route} onChange={(e) => update(it.id, "route", e.target.value)} />
              <Input label="Duration" placeholder="7 days" value={it.duration} onChange={(e) => update(it.id, "duration", e.target.value)} />
            </div>
            <div className="mt-3"><Input label="Instructions" placeholder="After meals" value={it.instructions} onChange={(e) => update(it.id, "instructions", e.target.value)} /></div>
            <Button variant="ghost" className="mt-2 text-danger" onClick={() => onChange(items.filter((i) => i.id !== it.id))}>Remove medicine {n + 1}</Button>
          </fieldset>
        ))}
      </div>
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save as template">
        <div className="space-y-3">
          <Input label="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!tplName.trim()) return;
              await rxTemplateRepo.save({ id: newId(), name: tplName.trim(), items: clone(items) });
              setSaveOpen(false); loadTemplates(); toast("Template saved");
            }}>Save template</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
