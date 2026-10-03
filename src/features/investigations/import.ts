import type { ImportKind } from "@/features/import/BulkImport";
import { newId } from "@/lib/repository";
import { testRepo } from "@/lib/repositories";
import type { TestDef } from "./types";

const get = (r: Record<string, string>, ...keys: string[]) => keys.map((k) => r[k]).find((v) => v) ?? "";

export const testImport: ImportKind<TestDef> = {
  title: "Import tests", listKey: "tests", sampleName: "petradoc-tests-sample.csv",
  sampleCsv: "name,category\nExample Test,Haematology\nAnother Example Test,Biochemistry\n",
  describe: (t) => [t.name, t.category && `(${t.category})`].filter(Boolean).join(" "),
  toItem: (r) => {
    const name = get(r, "name", "test", "testname");
    return name ? { item: { name, category: get(r, "category", "group") } } : { error: "needs a test name" };
  },
  keyOf: (t) => t.name.trim().toLowerCase(),
  loadExisting: () => testRepo.list(),
  merge: (e, item) => ({ ...e, ...item }),
  create: (item) => ({ ...item, id: newId() }),
  saveAll: async (items) => { for (const t of items) await testRepo.save(t); },
};
