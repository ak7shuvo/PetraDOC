"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { patientRepo } from "@/lib/repositories";
import { patientAge, type Patient } from "./types";

export function PatientPicker({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Patient[]>([]);
  const [chosen, setChosen] = useState<Patient | null>(null);

  useEffect(() => { if (value) patientRepo.get(value).then(setChosen); else setChosen(null); }, [value]);
  useEffect(() => {
    if (!q.trim()) return setRows([]);
    let live = true;
    patientRepo.list({ search: q, limit: 6 }).then((r) => live && setRows(r));
    return () => { live = false; };
  }, [q]);

  if (chosen)
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 p-3 text-sm">
        <div><span className="font-medium">{chosen.name}</span> <span className="text-muted">· {[chosen.code, patientAge(chosen), chosen.gender].filter(Boolean).join(" · ")}</span></div>
        <Button variant="ghost" onClick={() => onChange("")}>Change</Button>
      </div>
    );
  return (
    <div>
      <label htmlFor="pp" className="mb-1 block text-sm font-medium">Patient *</label>
      <input id="pp" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, mobile or Patient ID"
        aria-invalid={error ? true : undefined}
        className={`block min-h-[44px] w-full rounded-lg border bg-surface px-3 text-sm ${error ? "border-danger" : "border-border"}`} />
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
      {rows.length > 0 && (
        <ul className="mt-1 divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { onChange(p.id); setQ(""); }} className="block min-h-[44px] w-full px-3 py-2 text-left text-sm hover:bg-surface-2">
                {p.name} <span className="text-muted">· {p.code} · {p.mobile}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
