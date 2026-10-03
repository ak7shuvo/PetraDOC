"use client";
import { useEffect, useState } from "react";
import { consultationRepo, patientRepo } from "@/lib/repositories";
import type { Consultation } from "./types";

export type ConsultationRow = Consultation & { patientName: string };
export const LIST_PAGE = 50;

/** Newest-first consultations, one page at a time (indexed cursor), with patient names for the visible rows only. */
export function useConsultationList(opts: { search?: string; onlyWithMedicines?: boolean } = {}) {
  const [limit, setLimit] = useState(LIST_PAGE);
  const [rows, setRows] = useState<ConsultationRow[] | null>(null);
  const [more, setMore] = useState(false);
  const search = (opts.search ?? "").trim().toLowerCase();

  useEffect(() => { setLimit(LIST_PAGE); }, [search]);
  useEffect(() => {
    let live = true;
    (async () => {
      const matchIds = search ? new Set((await patientRepo.list({ search })).map((p) => p.id)) : null;
      const page = await consultationRepo.list({
        orderBy: "date", desc: true, limit: limit + 1,
        filter: (c) => (!opts.onlyWithMedicines || c.medicines.length > 0) && (!matchIds || matchIds.has(c.patientId) || c.rxCode.toLowerCase().includes(search)),
      });
      const ids = [...new Set(page.map((c) => c.patientId))];
      const names = new Map((await Promise.all(ids.map((id) => patientRepo.get(id)))).filter((p) => p).map((p) => [p!.id, p!.name]));
      if (!live) return;
      setMore(page.length > limit);
      setRows(page.slice(0, limit).map((c) => ({ ...c, patientName: names.get(c.patientId) ?? "Unknown patient" })));
    })();
    return () => { live = false; };
  }, [limit, search, opts.onlyWithMedicines]);

  return { rows, more, showMore: () => setLimit((l) => l + LIST_PAGE) };
}
