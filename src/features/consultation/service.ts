import { newId } from "@/lib/repository";
import { appointmentRepo, consultationRepo } from "@/lib/repositories";
import { localDate } from "@/lib/date";
import { computeBmi, validateVitals } from "./vitals";
import { emptyVitals, type Consultation } from "./types";

async function nextRxCode(): Promise<string> {
  const all = await consultationRepo.list();
  const max = all.reduce((m, c) => Math.max(m, parseInt(c.rxCode?.replace(/\D/g, "") ?? "", 10) || 0), 0);
  return `RX-${String(max + 1).padStart(6, "0")}`;
}

export const newConsultation = (patientId: string, doctorId: string, extra: Partial<Consultation> = {}): Consultation => ({
  id: newId(), rxCode: "", patientId, doctorId, chamberId: "", date: localDate(),
  chiefComplaint: "", history: "", vitals: emptyVitals(), examination: "", diagnosis: "",
  medicines: [], investigations: [], advice: "", followUpNotes: "", ...extra,
});

export function validateConsultation(c: Consultation): Record<string, string> {
  const e = validateVitals(c.vitals);
  if (!c.patientId) e.patient = "Select a patient";
  if (!c.date) e.date = "Date is required";
  if (c.followUpDate && c.followUpDate < c.date) e.followUpDate = "Follow-up cannot be before the visit date";
  return e;
}

export async function saveConsultation(c: Consultation): Promise<Consultation> {
  const existing = await consultationRepo.get(c.id);
  const saved = await consultationRepo.save({
    ...c,
    rxCode: existing?.rxCode || c.rxCode || (await nextRxCode()),
    vitals: { ...c.vitals, bmi: computeBmi(c.vitals.weight, c.vitals.height) },
  });
  if (saved.appointmentId) {
    const a = await appointmentRepo.get(saved.appointmentId);
    if (a && a.status !== "done") await appointmentRepo.save({ ...a, status: "done" });
  }
  return saved;
}

export const listForPatient = (patientId: string) =>
  consultationRepo.list({ where: { patientId } }).then((r) => r.sort((a, b) => b.date.localeCompare(a.date)));
