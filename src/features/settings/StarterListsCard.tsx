"use client";
import { Button, Card, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { medicineKey } from "@/features/medicines/import";
import { emptyMedicine } from "@/features/medicines/types";
import { newId } from "@/lib/repository";
import { medicineRepo, testRepo } from "@/lib/repositories";
import { STARTER_MEDICINES, STARTER_TESTS } from "./starter-data";

export function StarterListsCard() {
  const canWrite = useCan("medicine:write");
  const toast = useToast();

  const addMedicines = async () => {
    if (!confirm(`Add ${STARTER_MEDICINES.length} starter medicine names? Existing entries are kept; duplicates are skipped.`)) return;
    const have = new Set((await medicineRepo.list()).map((m) => m.generic.trim().toLowerCase()));
    let n = 0;
    for (const s of STARTER_MEDICINES) {
      if (have.has(s.generic.toLowerCase())) continue;
      await medicineRepo.save({ ...emptyMedicine(), ...s, id: newId() }); n++;
    }
    toast(`Added ${n} starter medicine(s)`);
  };
  const addTests = async () => {
    if (!confirm(`Add ${STARTER_TESTS.length} starter test names? Existing entries are kept; duplicates are skipped.`)) return;
    const have = new Set((await testRepo.list()).map((t) => t.name.trim().toLowerCase()));
    let n = 0;
    for (const s of STARTER_TESTS) {
      if (have.has(s.name.toLowerCase())) continue;
      await testRepo.save({ ...s, id: newId() }); n++;
    }
    toast(`Added ${n} starter test(s)`);
  };

  return (
    <Card title="Starter lists (optional)">
      <fieldset disabled={!canWrite} className="space-y-3 text-sm">
        <p className="rounded-lg bg-amber-50 p-3 text-warning-fg"><b>Starter list, verify before use.</b> Common generic medicine and test names only: no strengths, doses or clinical advice. You can edit or delete any entry.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addMedicines}>Add starter medicines ({STARTER_MEDICINES.length})</Button>
          <Button variant="secondary" onClick={addTests}>Add starter tests ({STARTER_TESTS.length})</Button>
        </div>
        <p className="text-xs text-muted">Nothing is added unless you press a button. You can also import your own lists from the Medicines and Investigations pages.</p>
      </fieldset>
    </Card>
  );
}
