import { patientAge } from "@/features/patients/types";
import type { PrescriptionData } from "./PrescriptionDocument";

/** Compact text layout for 58mm / 80mm thermal paper. */
export function ThermalDocument({ data, widthMm }: { data: PrescriptionData; widthMm: 58 | 80 }) {
  const { consultation: c, patient: p, doctor: d, chamber, footer } = data;
  const degrees = d.education.map((e) => e.degree).filter(Boolean).join(", ");
  const H = ({ children }: { children: React.ReactNode }) => <div className="mt-2 border-b border-black text-[10px] font-bold uppercase">{children}</div>;
  return (
    <div id="rx-print" className="mx-auto bg-white p-1 text-[11px] leading-snug text-black" style={{ width: `${widthMm}mm` }}>
      <div className="text-center">
        <div className="text-sm font-bold">{[d.title, d.name].filter(Boolean).join(" ") || "Doctor"}</div>
        {degrees && <div>{degrees}</div>}
        {d.specialty && <div>{d.specialty}</div>}
        {d.bmdcNumber && <div>BMDC: {d.bmdcNumber}</div>}
        {chamber && <div className="mt-1">{chamber.name}{chamber.phone && ` · ${chamber.phone}`}</div>}
      </div>
      <div className="mt-2 border-t border-dashed border-black pt-1">
        <div><b>{p.name}</b> {[patientAge(p), p.gender].filter(Boolean).join(", ")}</div>
        <div>{p.code} · {c.date} · {c.rxCode}</div>
        {p.allergies && <div>Allergy: {p.allergies}</div>}
      </div>
      {c.diagnosis && <><H>Diagnosis</H><div className="whitespace-pre-line">{c.diagnosis}</div></>}
      {c.medicines.length > 0 && (
        <><H>Rx</H>
          {c.medicines.map((m, i) => (
            <div key={m.id} className="mt-1"><b>{i + 1}. {m.name} {m.strength}</b><div>{[m.dose, m.frequency, m.route, m.duration].filter(Boolean).join(" · ")}{m.instructions && ` — ${m.instructions}`}</div></div>
          ))}</>
      )}
      {c.investigations.length > 0 && <><H>Tests</H>{c.investigations.map((t) => <div key={t.id}>• {t.name}</div>)}</>}
      {c.advice && <><H>Advice</H><div className="whitespace-pre-line">{c.advice}</div></>}
      {c.followUpDate && <><H>Follow-up</H><div>{c.followUpDate} {c.followUpNotes}</div></>}
      {footer && <div className="mt-2 border-t border-dashed border-black pt-1 text-center whitespace-pre-line">{footer}</div>}
    </div>
  );
}
