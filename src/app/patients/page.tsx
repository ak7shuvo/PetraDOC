"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, linkButtonClass } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { PatientAvatar } from "@/features/patients/PatientAvatar";
import { patientAge, type Patient } from "@/features/patients/types";
import { patientRepo } from "@/lib/repositories";

export default function PatientsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Patient[] | null>(null);
  const canWrite = useCan("patient:write");

  useEffect(() => {
    let live = true;
    const h = setTimeout(() => patientRepo.list({ search: q }).then((r) => live && setRows(r)), 150);
    return () => { live = false; clearTimeout(h); };
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Patients</h1>
        {canWrite && <Link href="/patients/new" className={linkButtonClass()}>New patient</Link>}
      </div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients"
        placeholder="Search by name, mobile or Patient ID"
        className="block min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 text-sm" />
      {rows === null ? <p className="text-sm text-muted">Loading…</p> : rows.length === 0 ? (
        <EmptyState title={q ? "No matching patients" : "No patients yet"}
          hint={q ? "Try a different name, mobile number or ID." : "Create the first patient record."}
          action={!q && canWrite ? <Link href="/patients/new" className={linkButtonClass()}>New patient</Link> : undefined} />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id}>
                <Link href={`/patients/detail?id=${p.id}`} className="flex min-h-[56px] items-center gap-3 px-4 py-2 hover:bg-surface-2">
                  <PatientAvatar name={p.name} photo={p.photo} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted">{[p.code, p.mobile, patientAge(p), p.gender].filter(Boolean).join(" · ")}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
