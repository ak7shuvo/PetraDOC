import { newId } from "@/lib/repository";
import { appointmentRepo, consultationRepo } from "@/lib/repositories";
import { localDate } from "@/lib/date";
import type { Consultation } from "@/features/consultation/types";
import type { Appointment, AppointmentStatus } from "./types";

export async function bookAppointment(a: {
  patientId: string; doctorId: string; chamberId: string; date: string; notes?: string; fromConsultationId?: string;
}): Promise<Appointment> {
  const same = await appointmentRepo.list({ where: { doctorId: a.doctorId, date: a.date } });
  const token = same.filter((x) => x.chamberId === a.chamberId).reduce((m, x) => Math.max(m, x.token), 0) + 1;
  const saved = await appointmentRepo.save({ id: newId(), status: "scheduled", notes: "", ...a, token });
  if (a.fromConsultationId) {
    const c = await consultationRepo.get(a.fromConsultationId);
    if (c) await consultationRepo.save({ ...c, followUpAppointmentId: saved.id });
  }
  return saved;
}

export const setStatus = async (a: Appointment, status: AppointmentStatus) => appointmentRepo.save({ ...a, status });

/** Follow-ups that have a date but no appointment booked yet (overdue + upcoming). */
export async function pendingFollowUps(doctorId?: string): Promise<Consultation[]> {
  const all = await consultationRepo.list(doctorId ? { where: { doctorId } } : {});
  return all.filter((c) => c.followUpDate && !c.followUpAppointmentId).sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!));
}

export const isOverdue = (c: Consultation) => !!c.followUpDate && c.followUpDate < localDate();
