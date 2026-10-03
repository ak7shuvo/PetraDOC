import type { BaseEntity } from "@/lib/repository";

export interface Education { id: string; degree: string; institution: string; passingYear: string; specialty: string }
export interface Training { id: string; training: string; institution: string; duration: string; year: string; certification: string }
export interface Experience { id: string; position: string; institution: string; department: string; from: string; to: string; description: string }

export interface DoctorProfile extends BaseEntity {
  // Personal
  name: string; photo?: string; gender: string; phone: string; email: string; address: string;
  // Professional. bmdcNumber and all qualifications are user-provided, NOT verified.
  title: string; specialty: string; subSpecialty: string; bmdcNumber: string;
  experienceYears: string; position: string; department: string; expertise: string; languages: string;
  education: Education[]; training: Training[]; experience: Experience[];
}

export interface Chamber extends BaseEntity {
  doctorId: string; name: string; address: string; phone: string; visitingHours: string; fee: string;
}

export const PRIMARY_DOCTOR_ID = "primary";

export const emptyProfile = (): DoctorProfile => ({
  id: PRIMARY_DOCTOR_ID, name: "", gender: "", phone: "", email: "", address: "",
  title: "", specialty: "", subSpecialty: "", bmdcNumber: "", experienceYears: "", position: "",
  department: "", expertise: "", languages: "", education: [], training: [], experience: [],
});
