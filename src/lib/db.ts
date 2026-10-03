import Dexie from "dexie";

/** Internal: only dexie-repository.ts may import this. Add a new version() for schema changes. */
export const db = new Dexie("petradoc");
db.version(1).stores({
  doctors: "id",
  chambers: "id, doctorId",
  patients: "id, code, mobile, name, updatedAt",
  consultations: "id, patientId, date",
  appointments: "id, patientId, date",
});
db.version(2).stores({
  consultations: "id, patientId, date, doctorId",
  appointments: "id, patientId, date, doctorId",
  medicines: "id, generic, brand",
  rxTemplates: "id",
  tests: "id, category",
  panels: "id",
  settings: "id",
  licenses: "id",
});
db.version(3).stores({
  consultations: "id, patientId, date, doctorId, followUpDate",
});
