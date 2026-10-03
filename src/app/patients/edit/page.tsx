"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PatientForm } from "@/features/patients/PatientForm";
import type { Patient } from "@/features/patients/types";
import { patientRepo } from "@/lib/repositories";

function Inner() {
  const id = useSearchParams().get("id");
  const [p, setP] = useState<Patient | null | undefined>(undefined);
  useEffect(() => { if (id) patientRepo.get(id).then(setP); else setP(null); }, [id]);
  if (p === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (p === null) return <p className="text-sm text-danger-fg">Patient not found.</p>;
  return <PatientForm patient={p} />;
}

export default function EditPatientPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Edit patient</h1>
      <Suspense fallback={null}><Inner /></Suspense>
    </div>
  );
}
