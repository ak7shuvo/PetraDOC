import type { BaseEntity } from "@/lib/repository";

/** Minimal shape for Phase 1-3 (dashboard counts). Extended in Phase 7. */
export interface Appointment extends BaseEntity {
  patientId: string; date: string; token?: number; status: "scheduled" | "done" | "cancelled";
}
