"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { linkButtonClass } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { PrescriptionDocument, type PrescriptionData } from "@/features/prescription/PrescriptionDocument";
import { loadPrescription } from "@/features/prescription/service";

function Inner() {
  const id = useSearchParams().get("id");
  const [d, setD] = useState<PrescriptionData | null | undefined>(undefined);
  const canWrite = useCan("consultation:write");
  useEffect(() => { if (id) loadPrescription(id).then(setD); else setD(null); }, [id]);
  if (d === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (d === null) return <p className="text-sm text-danger">Prescription not found.</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Prescription {d.consultation.rxCode}</h1>
        <div className="flex gap-2">
          {canWrite && <Link href={`/consultations/edit?id=${d.consultation.id}`} className={linkButtonClass("secondary")}>Edit</Link>}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2"><PrescriptionDocument data={d} /></div>
    </div>
  );
}

export default function PrescriptionViewPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
