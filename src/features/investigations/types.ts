import type { BaseEntity } from "@/lib/repository";

export interface TestDef extends BaseEntity { name: string; category: string }
/** Custom panel: a named group of test names (snapshot of names, so deleting a test never breaks a panel). */
export interface Panel extends BaseEntity { name: string; tests: string[] }

export const CATEGORY_SUGGESTIONS = ["Haematology", "Biochemistry", "Microbiology", "Imaging", "Cardiology", "Serology", "Urine/Stool", "Other"];
