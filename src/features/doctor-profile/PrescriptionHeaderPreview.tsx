import type { Chamber, DoctorProfile } from "./types";

/** Live preview of the prescription header, built only from profile + chamber data. */
export function PrescriptionHeaderPreview({ profile, chamber }: { profile: DoctorProfile; chamber?: Chamber }) {
  const degrees = profile.education.map((e) => e.degree).filter(Boolean).join(", ");
  const spec = [profile.specialty, profile.subSpecialty].filter(Boolean).join(" · ");
  return (
    <div className="rounded-lg border border-border bg-white p-4 text-sm" aria-label="Prescription header preview">
      <div className="flex items-start gap-3 border-b-2 border-primary pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {profile.photo && <img src={profile.photo} alt="" className="h-14 w-14 rounded-full object-cover" />}
        <div className="min-w-0">
          <div className="font-display text-lg font-bold text-primary-dark">
            {[profile.title, profile.name].filter(Boolean).join(" ") || "Doctor name"}
          </div>
          {degrees && <div>{degrees}</div>}
          {spec && <div className="text-muted">{spec}</div>}
          {profile.position && <div className="text-muted">{[profile.position, profile.department].filter(Boolean).join(", ")}</div>}
          {profile.bmdcNumber && <div className="text-xs text-muted">BMDC Reg. No: {profile.bmdcNumber}</div>}
        </div>
      </div>
      <div className="pt-3 text-xs text-muted">
        {chamber ? (
          <>
            <div className="font-medium text-ink">{chamber.name}</div>
            {chamber.address && <div>{chamber.address}</div>}
            {chamber.phone && <div>Phone: {chamber.phone}</div>}
            {chamber.visitingHours && <div>Visiting hours: {chamber.visitingHours}</div>}
          </>
        ) : (
          <div>No chamber selected</div>
        )}
        {(profile.phone || profile.email) && <div>{[profile.phone, profile.email].filter(Boolean).join(" · ")}</div>}
      </div>
    </div>
  );
}
