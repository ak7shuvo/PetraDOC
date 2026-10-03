"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState } from "@/components/ui";
import type { Consultation } from "@/features/consultation/types";
import { consultationRepo, patientRepo } from "@/lib/repositories";

function PrescriptionsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<(Consultation & { patientName: string })[] | null>(null);
  useEffect(() => {
    Promise.all([consultationRepo.list(), patientRepo.list()]).then(([c, p]) => {
      const names = new Map(p.map((x) => [x.id, x.name]));
      setRows(c.filter((x) => x.medicines.length > 0).sort((a, b) => b.date.localeCompare(a.date))
        .map((x) => ({ ...x, patientName: names.get(x.patientId) ?? "Unknown patient" })));
    });
  }, []);
  const shown = rows?.filter((r) => `${r.patientName} ${r.rxCode}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Prescriptions</h1>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search prescriptions" placeholder="Search by patient or Rx ID"
        className="block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
      {!shown ? <p className="text-sm text-muted">Loading…</p> : shown.length === 0 ? (
        <EmptyState title="No prescriptions yet" hint="Prescriptions with medicines appear here after a consultation is saved." />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {shown.map((c) => (
              <li key={c.id}>
                <Link href={`/prescriptions/view?id=${c.id}`} className="block min-h-[56px] px-4 py-2 hover:bg-surface-2">
                  <div className="font-medium">{c.patientName}</div>
                  <div className="truncate text-xs text-muted">{[c.date, c.rxCode, `${c.medicines.length} medicine(s)`].join(" · ")}</div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function GuardedPrescriptionsPage() {
  return <RequirePermission permission="clinical:read"><PrescriptionsPage /></RequirePermission>;
}
