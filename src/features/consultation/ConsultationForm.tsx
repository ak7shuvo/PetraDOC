"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Input, Select, Textarea, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { listChambers } from "@/features/doctor-profile/service";
import type { Chamber } from "@/features/doctor-profile/types";
import { PatientPicker } from "@/features/patients/PatientPicker";
import { PrescriptionEditor } from "./PrescriptionEditor";
import { saveConsultation, validateConsultation } from "./service";
import type { Consultation, Vitals } from "./types";
import { computeBmi } from "./vitals";

const VITALS: [keyof Vitals, string, object][] = [
  ["bp", "BP (mmHg)", { placeholder: "120/80" }],
  ["pulse", "Pulse (/min)", { inputMode: "numeric" }],
  ["temperature", "Temp (°F)", { inputMode: "decimal" }],
  ["spo2", "SpO₂ (%)", { inputMode: "numeric" }],
  ["respiratoryRate", "Resp. rate (/min)", { inputMode: "numeric" }],
  ["weight", "Weight (kg)", { inputMode: "decimal" }],
  ["height", "Height (cm)", { inputMode: "decimal" }],
];

export function ConsultationForm({ initial }: { initial: Consultation }) {
  const [c, setC] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const canWrite = useCan("consultation:write");

  useEffect(() => { listChambers(c.doctorId).then(setChambers); }, [c.doctorId]);

  const set = <K extends keyof Consultation>(k: K, v: Consultation[K]) => setC((s) => ({ ...s, [k]: v }));
  const setVital = (k: keyof Vitals, v: string) => setC((s) => ({ ...s, vitals: { ...s.vitals, [k]: v } }));
  const area = (k: "chiefComplaint" | "history" | "examination" | "diagnosis" | "advice", label: string) => (
    <Textarea label={label} value={c[k]} onChange={(e) => set(k, e.target.value)} />
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateConsultation(c);
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields", "error");
    setBusy(true);
    try {
      const saved = await saveConsultation(c);
      toast(`Consultation saved (${saved.rxCode})`);
      router.push(`/prescriptions/view?id=${saved.id}`);
    } catch { toast("Could not save consultation", "error"); setBusy(false); }
  };

  if (!canWrite) return <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning">The active role cannot record consultations.</p>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Card title="Visit">
        <div className="space-y-3">
          <PatientPicker value={c.patientId} onChange={(id) => set("patientId", id)} error={errors.patient} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Visit date *" type="date" value={c.date} error={errors.date} onChange={(e) => set("date", e.target.value)} />
            <Select label="Chamber" placeholder="No chamber" options={chambers.map((x) => x.name)}
              value={chambers.find((x) => x.id === c.chamberId)?.name ?? ""}
              onChange={(e) => set("chamberId", chambers.find((x) => x.name === e.target.value)?.id ?? "")} />
          </div>
          {c.rxCode && <p className="text-xs text-muted">Prescription ID: {c.rxCode}</p>}
        </div>
      </Card>
      <Card title="Complaint & history">
        <div className="space-y-3">{area("chiefComplaint", "Chief complaint")}{area("history", "History")}</div>
      </Card>
      <Card title="Vitals">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VITALS.map(([k, label, extra]) => (
            <Input key={k} label={label} value={c.vitals[k]} error={errors[k]} onChange={(e) => setVital(k, e.target.value)} {...extra} />
          ))}
          <div>
            <div className="mb-1 text-sm font-medium">BMI</div>
            <div className="flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-3 text-sm" aria-live="polite">
              {computeBmi(c.vitals.weight, c.vitals.height) || "–"}
            </div>
          </div>
        </div>
      </Card>
      <Card title="Examination & diagnosis">
        <div className="space-y-3">{area("examination", "Examination")}{area("diagnosis", "Diagnosis / clinical impression")}</div>
      </Card>
      <PrescriptionEditor items={c.medicines} onChange={(v) => set("medicines", v)} patientId={c.patientId} currentId={c.id} />
      <Card title="Advice & follow-up">
        <div className="space-y-3">
          {area("advice", "Advice")}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Follow-up date" type="date" value={c.followUpDate ?? ""} error={errors.followUpDate}
              onChange={(e) => set("followUpDate", e.target.value || undefined)} />
            <Input label="Follow-up notes" value={c.followUpNotes} onChange={(e) => set("followUpNotes", e.target.value)} />
          </div>
        </div>
      </Card>
      <div className="sticky bottom-16 flex gap-2 md:bottom-0">
        <Button type="submit" disabled={busy}>Save consultation</Button>
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
