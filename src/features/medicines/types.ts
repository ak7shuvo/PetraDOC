import type { BaseEntity } from "@/lib/repository";
import type { RxItem } from "@/features/consultation/types";

export interface Medicine extends BaseEntity {
  generic: string; brand: string; strength: string; form: string; route: string; manufacturer: string;
  favourite: boolean;
}
export interface RxTemplate extends BaseEntity { name: string; items: RxItem[] }

export const FORMS = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Drops", "Cream", "Ointment", "Inhaler", "Sachet", "Other"];
export const ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhalation", "Eye", "Ear", "Nasal", "Rectal", "Sublingual", "Other"];
export const FREQUENCIES = ["1+0+1", "1+1+1", "0+0+1", "1+0+0", "0+1+0", "Once daily", "Twice daily", "Thrice daily", "Every 8 hours", "As needed (SOS)"];

export const emptyMedicine = (): Omit<Medicine, "id"> => ({
  generic: "", brand: "", strength: "", form: "", route: "", manufacturer: "", favourite: false,
});

export const medicineLabel = (m: Pick<Medicine, "brand" | "generic" | "form">) =>
  [m.form, m.brand || m.generic].filter(Boolean).join(" ") + (m.brand && m.generic ? ` (${m.generic})` : "");
