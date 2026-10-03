"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, linkButtonClass } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import type { Consultation } from "@/features/consultation/types";
import { consultationRepo, patientRepo } from "@/lib/repositories";

export default function ConsultationsPage() {
  const [rows, setRows] = useState<(Consultation & { patientName: string })[] | null>(null);
  const canWrite = useCan("consultation:write");
  useEffect(() => {
    Promise.all([consultationRepo.list(), patientRepo.list()]).then(([c, p]) => {
      const names = new Map(p.map((x) => [x.id, x.name]));
      setRows(c.sort((a, b) => b.date.localeCompare(a.date)).map((x) => ({ ...x, patientName: names.get(x.patientId) ?? "Unknown patient" })));
    });
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Consultations</h1>
        {canWrite && <Link href="/consultations/new" className={linkButtonClass()}>New consultation</Link>}
      </div>
      {rows === null ? <p className="text-sm text-muted">Loading…</p> : rows.length === 0 ? (
        <EmptyState title="No consultations yet" hint="Start a consultation for a patient." action={canWrite ? <Link href="/consultations/new" className={linkButtonClass()}>New consultation</Link> : undefined} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/prescriptions/view?id=${c.id}`} className="block min-h-[56px] px-4 py-2 hover:bg-surface-2">
                  <div className="font-medium">{c.patientName}</div>
                  <div className="truncate text-xs text-muted">{[c.date, c.rxCode, c.diagnosis || c.chiefComplaint].filter(Boolean).join(" · ")}</div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
