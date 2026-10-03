import type { BaseEntity } from "@/lib/repository";

export interface Vitals {
  bp: string; pulse: string; temperature: string; spo2: string;
  respiratoryRate: string; weight: string; height: string; bmi: string;
}

/** One prescribed medicine line. Free text so manual entry and database entry share one shape. */
export interface RxItem {
  id: string; name: string; strength: string; dose: string; frequency: string;
  route: string; duration: string; instructions: string;
}

export interface OrderedTest { id: string; name: string; notes: string }

export interface Consultation extends BaseEntity {
  rxCode: string; // Prescription ID, e.g. RX-000001
  patientId: string; doctorId: string; chamberId: string; appointmentId?: string;
  date: string; // local YYYY-MM-DD
  chiefComplaint: string; history: string; vitals: Vitals; examination: string;
  diagnosis: string; medicines: RxItem[]; investigations: OrderedTest[];
  advice: string; followUpDate?: string; followUpNotes: string;
  followUpAppointmentId?: string;
}

export const emptyVitals = (): Vitals => ({
  bp: "", pulse: "", temperature: "", spo2: "", respiratoryRate: "", weight: "", height: "", bmi: "",
});
