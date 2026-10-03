"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, linkButtonClass, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { bookAppointment, isOverdue, pendingFollowUps, setStatus } from "@/features/appointments/service";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";
import type { Consultation } from "@/features/consultation/types";
import { doctorLabel, listChambers, listDoctors } from "@/features/doctor-profile/service";
import type { Chamber, DoctorProfile } from "@/features/doctor-profile/types";
import { PatientPicker } from "@/features/patients/PatientPicker";
import { localDate } from "@/lib/date";
import { appointmentRepo, chamberRepo, patientRepo } from "@/lib/repositories";

const TONE: Record<AppointmentStatus, "neutral" | "primary" | "warning" | "success" | "danger"> = {
  scheduled: "neutral", waiting: "warning", in_consultation: "primary", done: "success", cancelled: "danger",
};
const LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled", waiting: "Waiting", in_consultation: "In consultation", done: "Done", cancelled: "Cancelled",
};

interface Booking { patientId: string; doctorId: string; chamberId: string; date: string; notes: string; fromConsultationId?: string }

export default function AppointmentsPage() {
  const [date, setDate] = useState(localDate());
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [rows, setRows] = useState<(Appointment & { patientName: string })[]>([]);
  const [followUps, setFollowUps] = useState<(Consultation & { patientName: string })[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingChambers, setBookingChambers] = useState<Chamber[]>([]);
  const [err, setErr] = useState("");
  const canWrite = useCan("appointment:write");
  const toast = useToast();

  const load = useCallback(async () => {
    const [d, ch, a, p, f] = await Promise.all([listDoctors(), chamberRepo.list(), appointmentRepo.list({ where: { date } }), patientRepo.list(), pendingFollowUps()]);
    const names = new Map(p.map((x) => [x.id, x.name]));
    setDoctors(d); setChambers(ch);
    setRows(a.sort((x, y) => x.doctorId.localeCompare(y.doctorId) || x.token - y.token).map((x) => ({ ...x, patientName: names.get(x.patientId) ?? "Unknown patient" })));
    setFollowUps(f.map((x) => ({ ...x, patientName: names.get(x.patientId) ?? "Unknown patient" })));
  }, [date]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (booking?.doctorId) listChambers(booking.doctorId).then(setBookingChambers); }, [booking?.doctorId]);

  const dName = (id: string) => doctorLabel(doctors.find((d) => d.id === id) ?? { title: "", name: "" });
  const cName = (id: string) => chambers.find((c) => c.id === id)?.name;
  const shown = rows.filter((r) => !doctorId || r.doctorId === doctorId);
  const shownFollowUps = followUps.filter((f) => !doctorId || f.doctorId === doctorId);
  const openBooking = (b: Partial<Booking> = {}) => { setErr(""); setBooking({ patientId: "", doctorId: doctors[0]?.id ?? "", chamberId: "", date, notes: "", ...b }); };

  const submit = async () => {
    if (!booking) return;
    if (!booking.patientId) return setErr("Select a patient");
    if (!booking.date) return setErr("Select a date");
    const a = await bookAppointment(booking);
    toast(`Booked. Token ${a.token}`); setBooking(null);
    if (a.date === date) load(); else setDate(a.date);
  };
  const change = async (a: Appointment, s: AppointmentStatus) => { await setStatus(a, s); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Appointments & queue</h1>
        {canWrite && <Button onClick={() => openBooking()}>Book appointment</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Select label="Doctor" placeholder="All doctors" options={doctors.map(doctorLabel)} value={doctorId ? dName(doctorId) : ""}
          onChange={(e) => setDoctorId(doctors.find((d) => doctorLabel(d) === e.target.value)?.id ?? "")} />
      </div>
      {shown.length === 0 ? <EmptyState title="No appointments for this day" hint="Book an appointment to start a queue." /> : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {shown.map((a) => (
              <li key={a.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-primary-dark" aria-label={`Token ${a.token}`}>{a.token}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/patients/detail?id=${a.patientId}`} className="inline-flex min-h-[44px] items-center font-medium">{a.patientName}</Link>
                    <div className="truncate text-xs text-muted">{[dName(a.doctorId), cName(a.chamberId), a.notes].filter(Boolean).join(" · ")}</div>
                  </div>
                  <Badge tone={TONE[a.status]}>{LABEL[a.status]}</Badge>
                </div>
                {canWrite && (a.status === "scheduled" || a.status === "waiting" || a.status === "in_consultation") && (
                  <div className="flex flex-wrap gap-2">
                    {a.status === "scheduled" && <Button variant="secondary" onClick={() => change(a, "waiting")}>Check in</Button>}
                    <Link onClick={() => setStatus(a, "in_consultation")} className={linkButtonClass()}
                      href={`/consultations/new?patientId=${a.patientId}&appointmentId=${a.id}&doctorId=${a.doctorId}&chamberId=${a.chamberId}`}>
                      {a.status === "in_consultation" ? "Continue consultation" : "Start consultation"}
                    </Link>
                    <Button variant="ghost" className="text-danger-fg" onClick={() => change(a, "cancelled")}>Cancel</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Follow-ups to book">
        {shownFollowUps.length === 0 ? <EmptyState title="No pending follow-ups" hint="Follow-up dates set in consultations appear here until an appointment is booked." /> : (
          <ul className="divide-y divide-border">
            {shownFollowUps.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <span className="font-medium">{f.patientName}</span> <span className="text-muted">· {f.followUpDate}</span>{" "}
                  {isOverdue(f) && <Badge tone="danger">Overdue</Badge>}
                  {f.followUpNotes && <div className="text-xs text-muted">{f.followUpNotes}</div>}
                </div>
                {canWrite && <Button variant="secondary" onClick={() => openBooking({ patientId: f.patientId, doctorId: f.doctorId, chamberId: f.chamberId, date: f.followUpDate! < localDate() ? localDate() : f.followUpDate!, notes: "Follow-up", fromConsultationId: f.id })}>Book</Button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={!!booking} onClose={() => setBooking(null)} title="Book appointment">
        {booking && (
          <div className="space-y-3">
            <PatientPicker value={booking.patientId} onChange={(id) => setBooking({ ...booking, patientId: id })} error={err.includes("patient") ? err : undefined} />
            <Select label="Doctor" options={doctors.map(doctorLabel)} placeholder="Choose doctor" value={dName(booking.doctorId)}
              onChange={(e) => setBooking({ ...booking, doctorId: doctors.find((d) => doctorLabel(d) === e.target.value)?.id ?? "", chamberId: "" })} />
            <Select label="Chamber" placeholder="No chamber" options={bookingChambers.map((c) => c.name)} value={bookingChambers.find((c) => c.id === booking.chamberId)?.name ?? ""}
              onChange={(e) => setBooking({ ...booking, chamberId: bookingChambers.find((c) => c.name === e.target.value)?.id ?? "" })} />
            <Input label="Date" type="date" value={booking.date} error={err.includes("date") ? err : undefined} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
            <Input label="Notes" value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} />
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setBooking(null)}>Cancel</Button><Button onClick={submit}>Book</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
