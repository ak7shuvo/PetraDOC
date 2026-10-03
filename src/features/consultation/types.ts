import type { BaseEntity } from "@/lib/repository";

/** Minimal shape for Phase 1-3 (counts, timeline). Extended in Phase 4. */
export interface Consultation extends BaseEntity {
  patientId: string; date: string; chiefComplaint: string; diagnosis: string; followUpDate?: string;
}
