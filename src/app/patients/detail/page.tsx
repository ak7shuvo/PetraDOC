"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, EmptyState, Modal, linkButtonClass, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import type { Appointment } from "@/features/appointments/types";
import type { Consultation } from "@/features/consultation/types";
import { deletePatient } from "@/features/patients/service";
import { PatientAvatar } from "@/features/patients/PatientAvatar";
import { patientAge, type Patient } from "@/features/patients/types";
import { appointmentRepo, consultationRepo, patientRepo } from "@/lib/repositories";

const Row = ({ k, v }: { k: string; v?: string }) =>
  v ? <div><dt className="text-xs text-muted">{k}</dt><dd className="whitespace-pre-line text-sm">{v}</dd></div> : null;

function Inner() {
  const id = useSearchParams().get("id");
  const [p, setP] = useState<Patient | null | undefined>(undefined);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const canWrite = useCan("patient:write");
  const canConsult = useCan("consultation:write");
  const clinical = useCan("clinical:read");
  const canDelete = useCan("patient:delete");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!id) return setP(null);
    patientRepo.get(id).then(setP);
    appointmentRepo.list({ where: { patientId: id } }).then((a) => setAppts(a.filter((x) => x.status !== "done")));
    consultationRepo.list({ where: { patientId: id } }).then((c) => setHistory(c.sort((a, b) => b.date.localeCompare(a.date))));
  }, [id]);

  if (p === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (p === null) return <p className="text-sm text-danger-fg">Patient not found. <Link href="/patients" className="underline">Back to patients</Link></p>;

  const events = [
    ...(clinical ? history : []).map((c) => ({ key: c.id, date: c.date, sub: c.rxCode, title: c.diagnosis || c.chiefComplaint || "Consultation", href: `/prescriptions/view?id=${c.id}`, note: c.followUpDate ? `Follow-up: ${c.followUpDate}` : "" })),
    ...appts.map((a) => ({ key: a.id, date: a.date, sub: `Token ${a.token}`, title: `Appointment (${a.status.replace("_", " ")})`, href: "", note: a.notes })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <PatientAvatar name={p.name} photo={p.photo} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{p.name}</h1>
            <div className="text-sm text-muted">{[p.code, patientAge(p), p.gender, p.bloodGroup].filter(Boolean).join(" · ")}</div>
            {clinical && p.allergies && <div className="mt-1"><Badge tone="danger">Allergies: {p.allergies}</Badge></div>}
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
          {clinical && <><Row k="Medical history" v={p.medicalHistory} /><Row k="Notes" v={p.notes} /></>}
        </dl>
      </Card>
      <Card title="History timeline">
        {events.length === 0 ? (
          <EmptyState title="No history yet" hint="Consultations and appointments appear here." />
        ) : (
          <ol className="space-y-3 border-l-2 border-border pl-4">
            {events.map((e) => (
              <li key={e.key}>
                <div className="text-xs text-muted">{e.date}{e.sub && ` · ${e.sub}`}</div>
                {e.href ? <Link href={e.href} className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline">{e.title}</Link> : <div className="text-sm font-medium">{e.title}</div>}
                {e.note && <div className="text-xs text-muted">{e.note}</div>}
              </li>
            ))}
          </ol>
        )}
      </Card>
      {canDelete && (
        <div className="print:hidden"><Button variant="ghost" className="text-danger-fg" onClick={() => setConfirmDelete(true)}>Delete patient…</Button></div>
      )}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete patient?">
        <div className="space-y-3 text-sm">
          <p>This permanently deletes <b>{p.name}</b> ({p.code}) together with {history.length} consultation(s) and {appts.length + history.filter((h) => h.appointmentId).length} appointment(s).</p>
          <p className="font-medium text-danger-fg">Data is stored only in this browser. There is no recycle bin; the only way to undo this is to restore a backup file you exported earlier.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={async () => { await deletePatient(p.id); toast("Patient deleted"); router.push("/patients"); }}>Delete permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PatientDetailPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
