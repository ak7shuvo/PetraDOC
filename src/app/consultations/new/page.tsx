"use client";
import { RequirePermission } from "@/features/auth/RoleProvider";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConsultationForm } from "@/features/consultation/ConsultationForm";
import { newConsultation } from "@/features/consultation/service";
import { PRIMARY_DOCTOR_ID } from "@/features/doctor-profile/types";
import { useState } from "react";

function Inner() {
  const sp = useSearchParams();
  const [initial] = useState(() => newConsultation(sp.get("patientId") ?? "", sp.get("doctorId") ?? PRIMARY_DOCTOR_ID, {
    appointmentId: sp.get("appointmentId") ?? undefined, chamberId: sp.get("chamberId") ?? "",
  }));
  return <ConsultationForm initial={initial} />;
}

function NewConsultationPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">New consultation</h1>
      <Suspense fallback={null}><Inner /></Suspense>
    </div>
  );
}

export default function GuardedNewConsultationPage() {
  return <RequirePermission permission="clinical:read"><NewConsultationPage /></RequirePermission>;
}
