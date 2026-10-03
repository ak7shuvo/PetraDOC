import Dexie from "dexie";

/** Internal: only dexie-repository.ts may import this. */
export const db = new Dexie("petradoc");
db.version(1).stores({
  doctors: "id",
  chambers: "id, doctorId",
  patients: "id, code, mobile, name, updatedAt",
  consultations: "id, patientId, date",
  appointments: "id, patientId, date",
});
