"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, linkButtonClass } from "@/components/ui";
import { localDate } from "@/lib/date";
import { appointmentRepo, consultationRepo, patientRepo } from "@/lib/repositories";
import type { Consultation } from "@/features/consultation/types";
import type { Patient } from "@/features/patients/types";

interface Stats {
  patients: number; today: number; followUps: number;
  recent: (Consultation & { patientName: string })[];
}

const todayStr = () => localDate();

async function load(): Promise<Stats> {
  const t = todayStr();
  const [patients, appts, consults] = await Promise.all([
    patientRepo.list(), appointmentRepo.list(), consultationRepo.list(),
  ]);
  const names = new Map<string, Patient>(patients.map((p) => [p.id, p]));
  return {
    patients: patients.length,
    today: appts.filter((a) => a.date === t && a.status !== "cancelled").length,
    followUps: consults.filter((c) => c.followUpDate && c.followUpDate >= t).length,
    recent: consults.slice(0, 5).map((c) => ({ ...c, patientName: names.get(c.patientId)?.name ?? "Unknown patient" })),
  };
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { load().then(setS).catch(() => setS({ patients: 0, today: 0, followUps: 0, recent: [] })); }, []);

  const cards: [string, number | undefined][] = [
    ["Today's appointments", s?.today], ["Patients", s?.patients],
    ["Recent consultations", s?.recent.length], ["Upcoming follow-ups", s?.followUps],
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, n]) => (
          <Card key={label}>
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-2xl font-bold">{n ?? "–"}</div>
          </Card>
        ))}
      </div>
      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Link href="/patients/new" className={linkButtonClass()}>New patient</Link>
          <Link href="/patients" className={linkButtonClass("secondary")}>Find patient</Link>
          <Link href="/profile" className={linkButtonClass("secondary")}>Doctor profile</Link>
          <Link href="/consultations/new" className={linkButtonClass("secondary")}>New consultation</Link>
        </div>
      </Card>
      <Card title="Recent consultations">
        {s && s.recent.length === 0 ? (
          <EmptyState title="No consultations yet" hint="Saved consultations appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {s?.recent.map((c) => (
              <li key={c.id}>
                <Link href={`/prescriptions/view?id=${c.id}`} className="block min-h-[44px] py-2 text-sm">
                  <span className="font-medium">{c.patientName}</span>{" "}
                  <span className="text-muted">· {c.date} · {c.diagnosis || c.chiefComplaint}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
