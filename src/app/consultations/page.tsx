"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import Link from "next/link";
import { Button, Card, EmptyState, linkButtonClass } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { useConsultationList } from "@/features/consultation/useConsultationList";

function ConsultationsPage() {
  const { rows, more, showMore } = useConsultationList();
  const canWrite = useCan("consultation:write");
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
      {more && <div className="flex justify-center"><Button variant="secondary" onClick={showMore}>Show more</Button></div>}
    </div>
  );
}

export default function GuardedConsultationsPage() {
  return <RequirePermission permission="clinical:read"><ConsultationsPage /></RequirePermission>;
}
