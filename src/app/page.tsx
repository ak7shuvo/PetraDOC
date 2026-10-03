"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, Select, linkButtonClass } from "@/components/ui";
import { pendingFollowUps } from "@/features/appointments/service";
import type { Appointment } from "@/features/appointments/types";
import type { Consultation } from "@/features/consultation/types";
import { doctorLabel, listDoctors } from "@/features/doctor-profile/service";
import type { DoctorProfile } from "@/features/doctor-profile/types";
import { useCan } from "@/features/auth/RoleProvider";
import { getSettings } from "@/features/settings/service";
import { localDate } from "@/lib/date";
import { appointmentRepo, consultationRepo, patientRepo } from "@/lib/repositories";

interface Stats {
  patients: number; today: Appointment[]; followUps: number;
  recent: (Consultation & { patientName: string })[]; names: Map<string, string>;
}

async function load(doctorId: string): Promise<Stats> {
  const where = doctorId ? { doctorId } : {};
  const [patients, appts, consults, fu] = await Promise.all([
    patientRepo.list(), appointmentRepo.list({ where: { ...where, date: localDate() } }),
    consultationRepo.list({ where }), pendingFollowUps(doctorId || undefined),
  ]);
  const names = new Map(patients.map((p) => [p.id, p.name]));
  return {
    patients: patients.length,
    today: appts.filter((a) => a.status !== "cancelled").sort((a, b) => a.token - b.token),
    followUps: fu.length, names,
    recent: consults.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((c) => ({ ...c, patientName: names.get(c.patientId) ?? "Unknown patient" })),
  };
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const clinical = useCan("clinical:read");
  // undefined = loading, null = never backed up, number = days since last backup (0 = within 7 days, no reminder)
  const [backupAge, setBackupAge] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    getSettings().then((x) => {
      if (!x.lastBackupAt) return setBackupAge(null);
      const days = Math.floor((Date.now() - new Date(x.lastBackupAt).getTime()) / 86400000);
      setBackupAge(days >= 7 ? days : 0);
    });
  }, []);
  useEffect(() => { listDoctors().then(setDoctors); }, []);
  useEffect(() => { load(doctorId).then(setS).catch(() => setS(null)); }, [doctorId]);

  const waiting = s?.today.filter((a) => a.status === "scheduled" || a.status === "waiting" || a.status === "in_consultation") ?? [];
  const cards: [string, number | undefined][] = [
    ["Today's appointments", s?.today.length], ["Patients", s?.patients],
    ["Recent consultations", s?.recent.length], ["Pending follow-ups", s?.followUps],
  ].filter(([l]) => clinical || l !== "Recent consultations") as [string, number | undefined][];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        {doctors.length > 1 && (
          <Select label="Doctor" placeholder="All doctors" options={doctors.map(doctorLabel)} value={doctors.find((d) => d.id === doctorId) ? doctorLabel(doctors.find((d) => d.id === doctorId)!) : ""}
            onChange={(e) => setDoctorId(doctors.find((d) => doctorLabel(d) === e.target.value)?.id ?? "")} />
        )}
      </div>
      {backupAge !== undefined && backupAge !== 0 && s && s.patients > 0 && (
        <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-warning-fg">
          Your data is stored only in this browser and {backupAge === null ? "has never been backed up" : `was last backed up ${backupAge} days ago`}.{" "}
          <Link href="/settings" className="inline-flex min-h-[44px] items-center font-medium underline">Export a backup</Link>.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, n]) => (
          <Card key={label}><div className="text-sm text-muted">{label}</div><div className="mt-1 text-2xl font-bold">{n ?? "–"}</div></Card>
        ))}
      </div>
      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Link href="/patients/new" className={linkButtonClass()}>New patient</Link>
          {clinical && <Link href="/consultations/new" className={linkButtonClass("secondary")}>New consultation</Link>}
          <Link href="/appointments" className={linkButtonClass("secondary")}>Book appointment</Link>
          <Link href="/patients" className={linkButtonClass("secondary")}>Find patient</Link>
        </div>
      </Card>
      <Card title="Today's queue" action={<Link href="/appointments" className="inline-flex min-h-[44px] items-center text-sm text-primary underline">Open queue</Link>}>
        {waiting.length === 0 ? <EmptyState title="No one in the queue" hint="Appointments booked for today appear here." /> : (
          <ul className="divide-y divide-border">
            {waiting.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 font-bold text-primary-dark">{a.token}</span>
                <span className="flex-1 font-medium">{s?.names.get(a.patientId) ?? "Unknown patient"}</span>
                <Badge tone={a.status === "in_consultation" ? "primary" : a.status === "waiting" ? "warning" : "neutral"}>{a.status.replace("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {clinical && <Card title="Recent consultations">
        {s && s.recent.length === 0 ? <EmptyState title="No consultations yet" hint="Saved consultations appear here." /> : (
          <ul className="divide-y divide-border">
            {s?.recent.map((c) => (
              <li key={c.id}>
                <Link href={`/prescriptions/view?id=${c.id}`} className="block min-h-[44px] py-2 text-sm">
                  <span className="font-medium">{c.patientName}</span> <span className="text-muted">· {c.date} · {c.diagnosis || c.chiefComplaint}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>}
    </div>
  );
}
