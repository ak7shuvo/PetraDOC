import { chamberRepo, doctorRepo } from "@/lib/repositories";
import { emptyProfile, PRIMARY_DOCTOR_ID, type Chamber, type DoctorProfile } from "./types";

export const loadProfile = async (): Promise<DoctorProfile> =>
  (await doctorRepo.get(PRIMARY_DOCTOR_ID)) ?? emptyProfile();

export const saveProfile = (p: DoctorProfile) => doctorRepo.save({ ...p, id: PRIMARY_DOCTOR_ID });

export const listChambers = () =>
  chamberRepo.list({ where: { doctorId: PRIMARY_DOCTOR_ID } }).then((c) =>
    c.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")),
  );

export const saveChamber = (c: Chamber) => chamberRepo.save({ ...c, doctorId: PRIMARY_DOCTOR_ID });
export const removeChamber = (id: string) => chamberRepo.remove(id);
