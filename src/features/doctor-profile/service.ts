import { newId } from "@/lib/repository";
import { appointmentRepo, chamberRepo, consultationRepo, doctorRepo } from "@/lib/repositories";
import { emptyProfile, PRIMARY_DOCTOR_ID, type Chamber, type DoctorProfile } from "./types";

export const loadProfile = async (id: string = PRIMARY_DOCTOR_ID): Promise<DoctorProfile> =>
  (await doctorRepo.get(id)) ?? emptyProfile(id);

export const saveProfile = (p: DoctorProfile) => doctorRepo.save(p);

export const listChambers = (doctorId: string = PRIMARY_DOCTOR_ID) =>
  chamberRepo.list({ where: { doctorId } }).then((c) =>
    c.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
  );

export const saveChamber = (c: Chamber) => chamberRepo.save(c);
export const removeChamber = (id: string) => chamberRepo.remove(id);

export const doctorLabel = (d: Pick<DoctorProfile, "title" | "name">) =>
  [d.title, d.name].filter(Boolean).join(" ") || "Unnamed doctor";

/** All doctors; creates the first (empty) record if none exists yet so ids stay stable. */
export async function listDoctors(): Promise<DoctorProfile[]> {
  const all = await doctorRepo.list();
  if (all.length === 0) return [await doctorRepo.save(emptyProfile())];
  return all.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

export const addDoctor = () => doctorRepo.save(emptyProfile(newId()));

/** Reasons a doctor cannot be deleted (empty = safe to delete). */
export async function doctorDeleteBlockers(id: string): Promise<string[]> {
  const [doctors, consultations, appointments] = await Promise.all([
    doctorRepo.count(), consultationRepo.count({ doctorId: id }), appointmentRepo.count({ doctorId: id }),
  ]);
  const out: string[] = [];
  if (doctors <= 1) out.push("At least one doctor profile must exist.");
  if (consultations) out.push(`${consultations} consultation(s) were recorded under this doctor. Deleting would orphan those prescriptions.`);
  if (appointments) out.push(`${appointments} appointment(s) are booked or recorded under this doctor.`);
  return out;
}

/** Deletes the doctor and their chambers. Refuses (returns reasons) if the doctor has any history. */
export async function deleteDoctor(id: string): Promise<string[]> {
  const blockers = await doctorDeleteBlockers(id);
  if (blockers.length) return blockers;
  for (const c of await chamberRepo.list({ where: { doctorId: id } })) await chamberRepo.remove(c.id);
  await doctorRepo.remove(id);
  return [];
}
