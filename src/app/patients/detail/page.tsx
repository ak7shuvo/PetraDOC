"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Card, EmptyState, linkButtonClass } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import type { Consultation } from "@/features/consultation/types";
import { PatientAvatar } from "@/features/patients/PatientAvatar";
import { patientAge, type Patient } from "@/features/patients/types";
import { consultationRepo, patientRepo } from "@/lib/repositories";

const Row = ({ k, v }: { k: string; v?: string }) =>
  v ? <div><dt className="text-xs text-muted">{k}</dt><dd className="whitespace-pre-line text-sm">{v}</dd></div> : null;

function Inner() {
  const id = useSearchParams().get("id");
  const [p, setP] = useState<Patient | null | undefined>(undefined);
  const [history, setHistory] = useState<Consultation[]>([]);
  const canWrite = useCan("patient:write");
  const canConsult = useCan("consultation:write");

  useEffect(() => {
    if (!id) return setP(null);
    patientRepo.get(id).then(setP);
    consultationRepo.list({ where: { patientId: id } }).then((c) => setHistory(c.sort((a, b) => b.date.localeCompare(a.date))));
  }, [id]);

  if (p === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (p === null) return <p className="text-sm text-danger">Patient not found. <Link href="/patients" className="underline">Back to patients</Link></p>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <PatientAvatar name={p.name} photo={p.photo} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{p.name}</h1>
            <div className="text-sm text-muted">{[p.code, patientAge(p), p.gender, p.bloodGroup].filter(Boolean).join(" · ")}</div>
            {p.allergies && <div className="mt-1"><Badge tone="danger">Allergies: {p.allergies}</Badge></div>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canConsult && <Link href={`/consultations/new?patientId=${p.id}`} className={linkButtonClass()}>New consultation</Link>}
            {canWrite && <Link href={`/patients/edit?id=${p.id}`} className={linkButtonClass("secondary")}>Edit</Link>}
          </div>
        </div>
      </Card>
      <Card title="Details">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row k="Mobile" v={p.mobile} /><Row k="Date of birth" v={p.dob} /><Row k="Occupation" v={p.occupation} />
          <Row k="Address" v={p.address} />
          <Row k="Emergency contact" v={[p.emergencyName, p.emergencyRelation && `(${p.emergencyRelation})`, p.emergencyPhone].filter(Boolean).join(" ")} />
          <Row k="Medical history" v={p.medicalHistory} /><Row k="Notes" v={p.notes} />
        </dl>
      </Card>
      <Card title="History timeline">
        {history.length === 0 ? (
          <EmptyState title="No consultations yet" hint="Visits appear here once consultations are recorded." />
        ) : (
          <ol className="space-y-3 border-l-2 border-border pl-4">
            {history.map((c) => (
              <li key={c.id}>
                <div className="text-xs text-muted">{c.date}{c.rxCode && ` · ${c.rxCode}`}</div>
                <Link href={`/prescriptions/view?id=${c.id}`} className="text-sm font-medium text-primary underline">{c.diagnosis || c.chiefComplaint || "Consultation"}</Link>
                {c.followUpDate && <div className="text-xs text-muted">Follow-up: {c.followUpDate}</div>}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

export default function PatientDetailPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
