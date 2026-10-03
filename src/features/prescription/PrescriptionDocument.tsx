import type { Consultation } from "@/features/consultation/types";
import { PrescriptionHeaderPreview } from "@/features/doctor-profile/PrescriptionHeaderPreview";
import type { Chamber, DoctorProfile } from "@/features/doctor-profile/types";
import { patientAge, type Patient } from "@/features/patients/types";
import type { PrintTarget } from "@/features/printing/types";
import { ThermalDocument } from "./ThermalDocument";

export interface PrescriptionData {
  consultation: Consultation; patient: Patient; doctor: DoctorProfile; chamber?: Chamber; footer: string;
}

const V_LABEL: [keyof Consultation["vitals"], string][] = [
  ["bp", "BP"], ["pulse", "Pulse"], ["temperature", "Temp"], ["spo2", "SpO₂"], ["respiratoryRate", "RR"],
  ["weight", "Wt"], ["height", "Ht"], ["bmi", "BMI"],
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-primary-dark">{title}</h3>{children}</section>
);

/** Printable A4 prescription. The element with id="rx-print" is what print/PDF captures. */
export function PrescriptionDocument({ data, layout = "A4" }: { data: PrescriptionData; layout?: PrintTarget }) {
  if (layout === "THERMAL_58") return <ThermalDocument data={data} widthMm={58} />;
  if (layout === "THERMAL_80") return <ThermalDocument data={data} widthMm={80} />;
  const { consultation: c, patient: p, doctor, chamber, footer } = data;
  const vitals = V_LABEL.filter(([k]) => c.vitals[k]).map(([k, l]) => `${l}: ${c.vitals[k]}`).join("  ·  ");
  return (
    <div id="rx-print" className="rx-a4 mx-auto w-full max-w-[794px] bg-white p-6 text-sm text-black">
      <PrescriptionHeaderPreview profile={doctor} chamber={chamber} />
      <div className="mt-3 flex flex-wrap justify-between gap-2 border-b border-border pb-2 text-xs">
        <div>
          <div><b>{p.name}</b> · {[patientAge(p), p.gender].filter(Boolean).join(", ")}</div>
          <div>ID: {p.code} · {p.mobile}</div>
        </div>
        <div className="text-right"><div>Date: {c.date}</div><div>Rx ID: {c.rxCode}</div></div>
      </div>
      {p.allergies && <p className="mt-2 text-xs"><b>Allergies:</b> {p.allergies}</p>}
      {c.chiefComplaint && <Section title="Chief complaint"><p className="whitespace-pre-line">{c.chiefComplaint}</p></Section>}
      {vitals && <Section title="Vitals"><p>{vitals}</p></Section>}
      {c.examination && <Section title="Examination"><p className="whitespace-pre-line">{c.examination}</p></Section>}
      {c.diagnosis && <Section title="Diagnosis"><p className="whitespace-pre-line">{c.diagnosis}</p></Section>}
      {c.medicines.length > 0 && (
        <Section title="℞ Medicines">
          <div className="mt-1 space-y-1">
            {c.medicines.map((m, i) => (
              <div key={m.id} className="flex gap-2">
                <span className="w-5 shrink-0 text-right">{i + 1}.</span>
                <div>
                  <b>{m.name}</b> {m.strength}
                  <div className="text-xs">{[m.dose, m.frequency, m.route, m.duration].filter(Boolean).join(" · ")}{m.instructions && ` — ${m.instructions}`}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {c.investigations.length > 0 && (
        <Section title="Investigations">
          <div className="mt-1">{c.investigations.map((t) => <div key={t.id}>• {t.name}{t.notes && ` (${t.notes})`}</div>)}</div>
        </Section>
      )}
      {c.advice && <Section title="Advice"><p className="whitespace-pre-line">{c.advice}</p></Section>}
      {(c.followUpDate || c.followUpNotes) && (
        <Section title="Follow-up"><p>{[c.followUpDate, c.followUpNotes].filter(Boolean).join(" — ")}</p></Section>
      )}
      <div className="mt-10 flex justify-end">
        <div className="w-48 border-t border-black pt-1 text-center text-xs">{[doctor.title, doctor.name].filter(Boolean).join(" ")}<br />Signature</div>
      </div>
      {footer && <p className="mt-4 whitespace-pre-line border-t border-border pt-2 text-center text-xs text-muted">{footer}</p>}
    </div>
  );
}
