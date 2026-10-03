import { chamberRepo, consultationRepo, patientRepo } from "@/lib/repositories";
import { loadProfile } from "@/features/doctor-profile/service";
import { getSettings } from "@/features/settings/service";
import type { PrescriptionData } from "./PrescriptionDocument";

export async function loadPrescription(id: string): Promise<PrescriptionData | null> {
  const consultation = await consultationRepo.get(id);
  if (!consultation) return null;
  const patient = await patientRepo.get(consultation.patientId);
  if (!patient) return null;
  const [doctor, chamber, settings] = await Promise.all([
    loadProfile(consultation.doctorId),
    consultation.chamberId ? chamberRepo.get(consultation.chamberId) : null,
    getSettings(),
  ]);
  return { consultation, patient, doctor, chamber: chamber ?? undefined, footer: settings.prescriptionFooter };
}
