import type { BaseEntity } from "@/lib/repository";

export interface Patient extends BaseEntity {
  code: string; // auto Patient ID, e.g. PD-000001
  name: string; photo?: string; dob: string; approxAge: string; gender: string;
  mobile: string; address: string; bloodGroup: string; occupation: string;
  emergencyName: string; emergencyPhone: string; emergencyRelation: string;
  allergies: string; medicalHistory: string; notes: string;
}

export const GENDERS = ["Male", "Female", "Other"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const emptyPatient = (): Omit<Patient, "id" | "code"> => ({
  name: "", dob: "", approxAge: "", gender: "", mobile: "", address: "", bloodGroup: "", occupation: "",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "", allergies: "", medicalHistory: "", notes: "",
});

export function patientAge(p: Pick<Patient, "dob" | "approxAge">): string {
  if (p.dob) {
    const d = new Date(p.dob);
    if (!isNaN(d.getTime())) {
      const n = new Date();
      let a = n.getFullYear() - d.getFullYear();
      if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
      return `${Math.max(a, 0)} y`;
    }
  }
  return p.approxAge ? `${p.approxAge} y` : "";
}
