"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, PhotoField, Select, Textarea, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { savePatient, validatePatient, type PatientInput } from "./service";
import { BLOOD_GROUPS, emptyPatient, GENDERS, type Patient } from "./types";

export function PatientForm({ patient }: { patient?: Patient }) {
  const [v, setV] = useState<PatientInput>(patient ?? emptyPatient());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const canWrite = useCan("patient:write");
  const clinical = useCan("clinical:read");

  const set = (k: keyof PatientInput, val: string | undefined) => setV((s) => ({ ...s, [k]: val }));
  const t = (k: keyof PatientInput, label: string, extra: object = {}) => (
    <Input label={label} value={String(v[k] ?? "")} error={errors[k]} onChange={(e) => set(k, e.target.value)} {...extra} />
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePatient(v);
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields", "error");
    setBusy(true);
    try {
      const saved = await savePatient(v, patient);
      toast(patient ? "Patient updated" : `Patient created: ${saved.code}`);
      router.push(`/patients/detail?id=${saved.id}`);
    } catch {
      toast("Could not save patient", "error");
      setBusy(false);
    }
  };

  if (!canWrite) return <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning-fg">Editing is unavailable: your role or license does not allow it.</p>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {patient && <p className="text-sm text-muted">Patient ID: <span className="font-medium text-ink">{patient.code}</span></p>}
      <Card title="Basic information">
        <div className="space-y-3">
          <PhotoField value={v.photo} onChange={(p) => set("photo", p)} />
          <div className="grid gap-3 sm:grid-cols-2">
            {t("name", "Full name *", { autoComplete: "off" })}
            {t("mobile", "Mobile *", { type: "tel", inputMode: "tel" })}
            {t("dob", "Date of birth", { type: "date" })}
            {t("approxAge", "Age (years, if DOB unknown)", { inputMode: "numeric" })}
            <Select label="Gender" options={GENDERS} value={v.gender} onChange={(e) => set("gender", e.target.value)} />
            <Select label="Blood group" options={BLOOD_GROUPS} value={v.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} />
            {t("occupation", "Occupation")}
          </div>
          <Textarea label="Address" value={v.address} onChange={(e) => set("address", e.target.value)} />
        </div>
      </Card>
      <Card title="Emergency contact">
        <div className="grid gap-3 sm:grid-cols-3">
          {t("emergencyName", "Name")}
          {t("emergencyPhone", "Phone", { type: "tel", inputMode: "tel" })}
          {t("emergencyRelation", "Relation")}
        </div>
      </Card>
      {clinical && <Card title="Medical">
        <div className="space-y-3">
          <Textarea label="Allergies" value={v.allergies} onChange={(e) => set("allergies", e.target.value)} />
          <Textarea label="Medical history" value={v.medicalHistory} onChange={(e) => set("medicalHistory", e.target.value)} />
          <Textarea label="Notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </Card>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{patient ? "Save changes" : "Create patient"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
