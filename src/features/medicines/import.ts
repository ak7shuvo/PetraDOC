import type { ImportKind } from "@/features/import/BulkImport";
import { newId } from "@/lib/repository";
import { medicineRepo } from "@/lib/repositories";
import { FORMS, ROUTES, type Medicine } from "./types";

const pick = (list: string[], v: string) => list.find((x) => x.toLowerCase() === v.toLowerCase()) ?? v;
const get = (r: Record<string, string>, ...keys: string[]) => keys.map((k) => r[k]).find((v) => v) ?? "";

export const medicineKey = (m: Pick<Medicine, "generic" | "brand" | "strength" | "form">) =>
  [m.generic, m.brand, m.strength, m.form].map((s) => s.trim().toLowerCase()).join("|");

export const medicineImport: ImportKind<Medicine> = {
  title: "Import medicines", listKey: "medicines", sampleName: "petradoc-medicines-sample.csv",
  sampleCsv: "generic,brand,strength,form,route,manufacturer,favourite\nExample Generic,Example Brand,500 mg,Tablet,Oral,Example Pharma,no\nSecond Generic,,10 mg/5 mL,Syrup,Oral,,yes\n",
  describe: (m) => [m.brand || m.generic, m.brand && m.generic && `(${m.generic})`, m.strength, m.form].filter(Boolean).join(" "),
  toItem: (r) => {
    const generic = get(r, "generic", "genericname"), brand = get(r, "brand", "brandname");
    if (!generic && !brand) return { error: "needs a generic or brand name" };
    return { item: {
      generic, brand, strength: get(r, "strength"), form: pick(FORMS, get(r, "form", "dosageform")), route: pick(ROUTES, get(r, "route")),
      manufacturer: get(r, "manufacturer", "company"), favourite: /^(1|y|yes|true)$/i.test(get(r, "favourite", "favorite")),
    } };
  },
  keyOf: medicineKey,
  loadExisting: () => medicineRepo.list(),
  merge: (e, item) => ({ ...e, ...item, favourite: e.favourite || item.favourite }),
  create: (item) => ({ ...item, id: newId() }),
  saveAll: async (items) => { for (const m of items) await medicineRepo.save(m); },
};
