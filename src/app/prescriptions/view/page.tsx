"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Select, linkButtonClass, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { browserPrinter, PRINTERS } from "@/features/printing/adapters";
import { downloadBlob, elementToPdf } from "@/features/printing/pdf";
import type { PrintTarget } from "@/features/printing/types";
import { PrescriptionDocument, type PrescriptionData } from "@/features/prescription/PrescriptionDocument";
import { loadPrescription } from "@/features/prescription/service";

const PAPERS: Record<string, PrintTarget> = { "A4": "A4", "Thermal 58 mm": "THERMAL_58", "Thermal 80 mm": "THERMAL_80" };

function Inner() {
  const id = useSearchParams().get("id");
  const [d, setD] = useState<PrescriptionData | null | undefined>(undefined);
  const [paper, setPaper] = useState("A4");
  const [busy, setBusy] = useState(false);
  const canWrite = useCan("consultation:write");
  const toast = useToast();
  const target = PAPERS[paper];
  useEffect(() => { if (id) loadPrescription(id).then(setD); else setD(null); }, [id]);
  if (d === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (d === null) return <p className="text-sm text-danger">Prescription not found.</p>;

  const pdf = async () => {
    const el = document.getElementById("rx-print");
    if (!el) return;
    setBusy(true);
    try {
      const blob = await elementToPdf(el, target);
      downloadBlob(blob, `${d.consultation.rxCode}_${d.patient.name.replace(/[^\w-]+/g, "_")}.pdf`);
    } catch { toast("Could not create PDF", "error"); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="font-display text-2xl font-bold">Prescription {d.consultation.rxCode}</h1>
        {canWrite && <Link href={`/consultations/edit?id=${d.consultation.id}`} className={linkButtonClass("secondary")}>Edit</Link>}
      </div>
      <div className="flex flex-wrap items-end gap-2 print:hidden">
        <Select label="Paper" options={Object.keys(PAPERS)} placeholder="Paper" value={paper} onChange={(e) => e.target.value && setPaper(e.target.value)} />
        <Button onClick={() => browserPrinter.print(target)}>Print</Button>
        <Button variant="secondary" onClick={pdf} disabled={busy}>{busy ? "Creating PDF…" : "Download PDF"}</Button>
      </div>
      <p className="text-xs text-muted print:hidden">
        Thermal sizes use your browser's print dialog with that paper size. Direct Bluetooth/USB/network thermal printing is not available in the web app
        ({PRINTERS.slice(1).map((p) => p.name).join(", ")} need the native app).
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-2 print:overflow-visible print:border-0 print:bg-white print:p-0">
        <PrescriptionDocument data={d} layout={target} />
      </div>
    </div>
  );
}

export default function PrescriptionViewPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
