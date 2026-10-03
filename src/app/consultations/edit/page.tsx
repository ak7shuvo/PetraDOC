"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConsultationForm } from "@/features/consultation/ConsultationForm";
import type { Consultation } from "@/features/consultation/types";
import { consultationRepo } from "@/lib/repositories";

function Inner() {
  const id = useSearchParams().get("id");
  const [c, setC] = useState<Consultation | null | undefined>(undefined);
  useEffect(() => { if (id) consultationRepo.get(id).then(setC); else setC(null); }, [id]);
  if (c === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (c === null) return <p className="text-sm text-danger">Consultation not found.</p>;
  return <ConsultationForm initial={c} />;
}

function EditConsultationPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Edit consultation</h1>
      <Suspense fallback={null}><Inner /></Suspense>
    </div>
  );
}

export default function GuardedEditConsultationPage() {
  return <RequirePermission permission="clinical:read"><EditConsultationPage /></RequirePermission>;
}
