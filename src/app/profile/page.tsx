"use client";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Modal, PhotoField, RepeatableList, Select, Textarea, useToast } from "@/components/ui";
import { useCan } from "@/features/auth/RoleProvider";
import { ChamberManager } from "@/features/doctor-profile/ChamberManager";
import { PrescriptionHeaderPreview } from "@/features/doctor-profile/PrescriptionHeaderPreview";
import { addDoctor, deleteDoctor, doctorDeleteBlockers, doctorLabel, listChambers, listDoctors, loadProfile, saveProfile } from "@/features/doctor-profile/service";
import { emptyProfile, type Chamber, type DoctorProfile } from "@/features/doctor-profile/types";

export default function ProfilePage() {
  const [p, setP] = useState<DoctorProfile>(emptyProfile());
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [chamberId, setChamberId] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const canEdit = useCan("profile:edit");
  const toast = useToast();

  const refreshChambers = useCallback(async () => setChambers(await listChambers(doctorId)), [doctorId]);
  useEffect(() => { listDoctors().then((d) => { setDoctors(d); setDoctorId((id) => id || d[0].id); }); }, []);
  useEffect(() => {
    if (!doctorId) return;
    Promise.all([loadProfile(doctorId), listChambers(doctorId)]).then(([pr, ch]) => { setP(pr); setChambers(ch); setChamberId(""); setLoaded(true); });
  }, [doctorId]);

  const set = <K extends keyof DoctorProfile>(k: K, v: DoctorProfile[K]) => setP((s) => ({ ...s, [k]: v }));
  const text = (k: keyof DoctorProfile, label: string, extra: object = {}) => (
    <Input label={label} value={String(p[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} {...extra} />
  );
  const chamber = chambers.find((c) => c.id === chamberId) ?? chambers[0];

  const save = async () => {
    if (!p.name.trim()) return setError("Name is required");
    setError("");
    setP(await saveProfile(p));
    setDoctors(await listDoctors());
    toast("Profile saved");
  };

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Doctor Profile</h1>
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Doctor" placeholder="Choose doctor" options={doctors.map((d) => doctorLabel(d))}
          value={doctors.find((d) => d.id === doctorId) ? doctorLabel(doctors.find((d) => d.id === doctorId)!) : ""}
          onChange={(e) => { const d = doctors.find((x) => doctorLabel(x) === e.target.value); if (d) setDoctorId(d.id); }} />
        {canEdit && <Button variant="ghost" className="text-danger-fg" onClick={async () => setDeleting(await doctorDeleteBlockers(doctorId))}>Delete doctor…</Button>}
        {canEdit && <Button variant="secondary" onClick={async () => { const d = await addDoctor(); setDoctors(await listDoctors()); setDoctorId(d.id); toast("Doctor added. Fill in the profile and save."); }}>Add doctor</Button>}
      </div>
      {!canEdit && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning-fg">Read-only for the active role. Switch to Doctor or Admin to edit.</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
          <Card title="Personal">
            <div className="space-y-3">
              <PhotoField value={p.photo} onChange={(v) => set("photo", v)} />
              <div className="grid gap-3 sm:grid-cols-2">
                {text("name", "Full name *", { error })}
                <Select label="Gender" options={["Male", "Female", "Other"]} value={p.gender} onChange={(e) => set("gender", e.target.value)} />
                {text("phone", "Phone", { type: "tel" })}
                {text("email", "Email", { type: "email" })}
              </div>
              <Textarea label="Address" value={p.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </Card>
          <Card title="Professional">
            <p className="mb-3 text-xs text-muted">BMDC number and qualifications are user-provided, not verified.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {text("title", "Professional title", { placeholder: "Dr." })}
              {text("specialty", "Specialty")}
              {text("subSpecialty", "Sub-specialty")}
              {text("bmdcNumber", "BMDC registration no. (user-provided)")}
              {text("experienceYears", "Years of experience", { inputMode: "numeric" })}
              {text("position", "Position")}
              {text("department", "Department")}
              {text("languages", "Languages", { placeholder: "Bangla, English" })}
            </div>
            <div className="mt-3"><Textarea label="Expertise" value={p.expertise} onChange={(e) => set("expertise", e.target.value)} /></div>
          </Card>
          <Card title="Education (user-provided, not verified)">
            <RepeatableList items={p.education} onChange={(v) => set("education", v)} itemLabel="Degree" addLabel="Add education"
              empty={() => ({ degree: "", institution: "", passingYear: "", specialty: "" })}
              fields={[{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "passingYear", label: "Passing year" }, { key: "specialty", label: "Specialty" }]} />
          </Card>
          <Card title="Training / Certification">
            <RepeatableList items={p.training} onChange={(v) => set("training", v)} itemLabel="Training" addLabel="Add training"
              empty={() => ({ training: "", institution: "", duration: "", year: "", certification: "" })}
              fields={[{ key: "training", label: "Training" }, { key: "institution", label: "Institution" }, { key: "duration", label: "Duration" }, { key: "year", label: "Year" }, { key: "certification", label: "Certification" }]} />
          </Card>
          <Card title="Experience">
            <RepeatableList items={p.experience} onChange={(v) => set("experience", v)} itemLabel="Experience" addLabel="Add experience"
              empty={() => ({ position: "", institution: "", department: "", from: "", to: "", description: "" })}
              fields={[{ key: "position", label: "Position" }, { key: "institution", label: "Hospital / institution" }, { key: "department", label: "Department" }, { key: "from", label: "From", placeholder: "e.g. 2015" }, { key: "to", label: "To", placeholder: "e.g. 2020 or Present" }, { key: "description", label: "Description" }]} />
          </Card>
          <div className="sticky bottom-16 md:bottom-0">
            <Button onClick={save} className="w-full sm:w-auto">Save profile</Button>
          </div>
        </fieldset>
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card title="Prescription header preview">
            {chambers.length > 0 && (
              <div className="mb-3">
                <Select label="Chamber" placeholder="Choose chamber" options={chambers.map((c) => c.name)}
                  value={chamber?.name ?? ""} onChange={(e) => setChamberId(chambers.find((c) => c.name === e.target.value)?.id ?? "")} />
              </div>
            )}
            <PrescriptionHeaderPreview profile={p} chamber={chamber} />
          </Card>
        </div>
      </div>
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete doctor?">
        {deleting && (
          <div className="space-y-3 text-sm">
            {deleting.length > 0 ? (
              <>
                <p className="font-medium text-danger-fg">This doctor cannot be deleted:</p>
                <ul className="list-disc space-y-1 pl-5">{deleting.map((r) => <li key={r}>{r}</li>)}</ul>
              </>
            ) : (
              <p>This permanently deletes <b>{doctorLabel(p)}</b> and their chambers. This cannot be undone without a backup.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>{deleting.length ? "Close" : "Cancel"}</Button>
              {deleting.length === 0 && <Button variant="danger" onClick={async () => {
                if ((await deleteDoctor(doctorId)).length) return;
                const d = await listDoctors(); setDoctors(d); setDoctorId(d[0].id); setDeleting(null); toast("Doctor deleted");
              }}>Delete permanently</Button>}
            </div>
          </div>
        )}
      </Modal>
      <ChamberManager doctorId={doctorId} chambers={chambers} onChanged={refreshChambers} canEdit={canEdit} />
    </div>
  );
}
