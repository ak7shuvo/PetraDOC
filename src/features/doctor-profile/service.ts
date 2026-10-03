import { newId } from "@/lib/repository";
import { chamberRepo, doctorRepo } from "@/lib/repositories";
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
