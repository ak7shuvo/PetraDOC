import type { BaseEntity } from "@/lib/repository";

export type AppointmentStatus = "scheduled" | "waiting" | "in_consultation" | "done" | "cancelled";

export interface Appointment extends BaseEntity {
  patientId: string; doctorId: string; chamberId: string;
  date: string; // local YYYY-MM-DD
  token: number; // per doctor + chamber + date
  status: AppointmentStatus; notes: string;
  fromConsultationId?: string; // set when booked from a follow-up
}
