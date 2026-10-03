"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { emptyMedicine, FORMS, medicineLabel, ROUTES, type Medicine } from "@/features/medicines/types";
import { newId } from "@/lib/repository";
import { medicineRepo } from "@/lib/repositories";

function MedicinesPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Medicine[] | null>(null);
  const [edit, setEdit] = useState<Medicine | null>(null);
  const [err, setErr] = useState("");
  const canWrite = useCan("medicine:write");
  const toast = useToast();

  const load = useCallback(() => medicineRepo.list({ search: q }).then((r) =>
    setRows(r.sort((a, b) => Number(b.favourite) - Number(a.favourite) || (a.brand || a.generic).localeCompare(b.brand || b.generic)))), [q]);
  useEffect(() => { const h = setTimeout(load, 150); return () => clearTimeout(h); }, [load]);

  const set = (k: keyof Medicine, v: string) => setEdit((m) => (m ? { ...m, [k]: v } : m));
  const save = async () => {
    if (!edit) return;
    if (!edit.generic.trim() && !edit.brand.trim()) return setErr("Enter a generic or brand name");
    await medicineRepo.save(edit); setEdit(null); setErr(""); load(); toast("Medicine saved");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Medicines</h1>
        {canWrite && <Button onClick={() => { setErr(""); setEdit({ ...emptyMedicine(), id: newId() }); }}>Add medicine</Button>}
      </div>
      <p className="text-xs text-muted">Your own medicine list. Nothing is pre-loaded; you can also type medicines manually inside a prescription.</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search medicines" placeholder="Search generic, brand or manufacturer"
        className="block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
      {rows === null ? <p className="text-sm text-muted">Loading…</p> : rows.length === 0 ? (
        <EmptyState title={q ? "No matching medicines" : "No medicines yet"} hint={q ? undefined : "Add the medicines you prescribe often."} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-4 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{medicineLabel(m)} {m.strength}</div>
                  <div className="text-xs text-muted">{[m.route, m.manufacturer].filter(Boolean).join(" · ")}</div>
                </div>
                {m.favourite && <Badge tone="warning">Favourite</Badge>}
                {canWrite && (
                  <>
                    <Button variant="ghost" aria-label={m.favourite ? "Remove favourite" : "Mark favourite"} onClick={async () => { await medicineRepo.save({ ...m, favourite: !m.favourite }); load(); }}>
                      {m.favourite ? "★" : "☆"}
                    </Button>
                    <Button variant="ghost" onClick={() => { setErr(""); setEdit(m); }}>Edit</Button>
                    <Button variant="ghost" className="text-danger" onClick={async () => { if (confirm(`Delete ${m.brand || m.generic}?`)) { await medicineRepo.remove(m.id); load(); } }}>Delete</Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Medicine">
        {edit && (
          <div className="space-y-3">
            <Input label="Generic name" value={edit.generic} error={err} onChange={(e) => set("generic", e.target.value)} />
            <Input label="Brand name" value={edit.brand} onChange={(e) => set("brand", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Strength" placeholder="500 mg" value={edit.strength} onChange={(e) => set("strength", e.target.value)} />
              <Select label="Dosage form" options={FORMS} value={edit.form} onChange={(e) => set("form", e.target.value)} />
              <Select label="Route" options={ROUTES} value={edit.route} onChange={(e) => set("route", e.target.value)} />
              <Input label="Manufacturer" value={edit.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save medicine</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function GuardedMedicinesPage() {
  return <RequirePermission permission="clinical:read"><MedicinesPage /></RequirePermission>;
}
