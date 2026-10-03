"use client";
import { useState } from "react";
import { Button, Card, EmptyState, Input, Modal, Textarea, useToast } from "@/components/ui";
import { newId } from "@/lib/repository";
import { PRIMARY_DOCTOR_ID, type Chamber } from "./types";
import { removeChamber, saveChamber } from "./service";

const blank = (): Chamber => ({ id: newId(), doctorId: PRIMARY_DOCTOR_ID, name: "", address: "", phone: "", visitingHours: "", fee: "" });

export function ChamberManager({ chambers, onChanged, canEdit }: { chambers: Chamber[]; onChanged: () => void; canEdit: boolean }) {
  const [editing, setEditing] = useState<Chamber | null>(null);
  const [err, setErr] = useState("");
  const toast = useToast();

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setErr("Chamber name is required");
    if (editing.fee && !/^\d+(\.\d{1,2})?$/.test(editing.fee)) return setErr("Fee must be a number");
    await saveChamber(editing);
    setEditing(null); setErr(""); onChanged(); toast("Chamber saved");
  };
  const set = (k: keyof Chamber, v: string) => setEditing((c) => (c ? { ...c, [k]: v } : c));

  return (
    <Card title="Chambers" action={canEdit && <Button onClick={() => { setErr(""); setEditing(blank()); }}>Add chamber</Button>}>
      {chambers.length === 0 ? (
        <EmptyState title="No chambers yet" hint="Add a chamber to show it on the prescription header." />
      ) : (
        <ul className="divide-y divide-border">
          {chambers.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 py-3 text-sm">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-muted">{[c.address, c.phone, c.visitingHours, c.fee && `Fee: ${c.fee}`].filter(Boolean).join(" · ")}</div>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" onClick={() => { setErr(""); setEditing(c); }}>Edit</Button>
                  <Button variant="ghost" className="text-danger" onClick={async () => {
                    if (confirm(`Delete chamber "${c.name}"?`)) { await removeChamber(c.id); onChanged(); toast("Chamber deleted"); }
                  }}>Delete</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Chamber">
        {editing && (
          <div className="space-y-3">
            <Input label="Name *" value={editing.name} error={err && err.includes("name") ? err : undefined} onChange={(e) => set("name", e.target.value)} />
            <Textarea label="Address" value={editing.address} onChange={(e) => set("address", e.target.value)} />
            <Input label="Phone" type="tel" value={editing.phone} onChange={(e) => set("phone", e.target.value)} />
            <Input label="Visiting hours" placeholder="e.g. Sat–Thu 5pm–9pm" value={editing.visitingHours} onChange={(e) => set("visitingHours", e.target.value)} />
            <Input label="Consultation fee" inputMode="decimal" value={editing.fee} error={err && err.includes("Fee") ? err : undefined} onChange={(e) => set("fee", e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save chamber</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
