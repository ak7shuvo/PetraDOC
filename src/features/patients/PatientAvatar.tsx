/* eslint-disable @next/next/no-img-element */
export function PatientAvatar({ name, photo, size = 40 }: { name: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-sm font-medium text-muted">
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : name.trim().charAt(0).toUpperCase()}
    </div>
  );
}
