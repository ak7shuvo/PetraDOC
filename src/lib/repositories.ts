import { DexieRepository } from "./dexie-repository";
import type { Appointment } from "@/features/appointments/types";
import type { Consultation } from "@/features/consultation/types";
import type { Chamber, DoctorProfile } from "@/features/doctor-profile/types";
import type { Patient } from "@/features/patients/types";

/** The only place the app obtains storage. Swap implementations here later. */
export const doctorRepo = new DexieRepository<DoctorProfile>("doctors", (d) => d.name);
export const chamberRepo = new DexieRepository<Chamber>("chambers", (c) => c.name);
export const patientRepo = new DexieRepository<Patient>("patients", (p) => `${p.name} ${p.mobile} ${p.code}`);
export const consultationRepo = new DexieRepository<Consultation>("consultations");
export const appointmentRepo = new DexieRepository<Appointment>("appointments");
import type { AppSettings } from "@/features/settings/types";
export const settingsRepo = new DexieRepository<AppSettings>("settings");
import type { Medicine, RxTemplate } from "@/features/medicines/types";
export const medicineRepo = new DexieRepository<Medicine>("medicines", (m) => `${m.generic} ${m.brand} ${m.manufacturer}`);
export const rxTemplateRepo = new DexieRepository<RxTemplate>("rxTemplates", (t) => t.name);
