import { newId } from "@/lib/repository";
import { appointmentRepo, consultationRepo, patientRepo } from "@/lib/repositories";
import { emptyPatient, type Patient } from "./types";

async function nextCode(): Promise<string> {
  const all = await patientRepo.list();
  const max = all.reduce((m, p) => Math.max(m, parseInt(p.code.replace(/\D/g, ""), 10) || 0), 0);
  return `PD-${String(max + 1).padStart(6, "0")}`;
}

export type PatientInput = Omit<Patient, "id" | "code" | "createdAt" | "updatedAt">;

export function validatePatient(p: PatientInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.name.trim()) e.name = "Name is required";
  if (!p.mobile.trim()) e.mobile = "Mobile is required";
  else if (!/^[+\d][\d\s-]{6,17}$/.test(p.mobile.trim())) e.mobile = "Enter a valid mobile number";
  if (p.dob && new Date(p.dob) > new Date()) e.dob = "Date of birth cannot be in the future";
  if (p.approxAge && !/^\d{1,3}$/.test(p.approxAge)) e.approxAge = "Enter age in years";
  return e;
}

export async function savePatient(input: PatientInput, existing?: Patient): Promise<Patient> {
  if (existing) return patientRepo.save({ ...existing, ...input });
  return patientRepo.save({ ...emptyPatient(), ...input, id: newId(), code: await nextCode() });
}

/** Deletes the patient AND their consultations and appointments. Not undoable without a backup. */
export async function deletePatient(id: string) {
  for (const c of await consultationRepo.list({ where: { patientId: id } })) await consultationRepo.remove(c.id);
  for (const a of await appointmentRepo.list({ where: { patientId: id } })) await appointmentRepo.remove(a.id);
  await patientRepo.remove(id);
}
