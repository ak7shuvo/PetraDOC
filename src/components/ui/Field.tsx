import { useId } from "react";

const CONTROL =
  "block min-h-[44px] w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:bg-surface-2";

type Common = { label: string; error?: string; hint?: string };

function Wrap({ id, label, error, hint, children }: Common & { id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-danger-fg">{error}</p>}
    </div>
  );
}

const props = (id: string, error?: string, extra = "") => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-err` : undefined,
  className: `${CONTROL} ${error ? "border-danger" : "border-border"} ${extra}`,
});

export function Input({ label, error, hint, ...p }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return <Wrap id={id} {...{ label, error, hint }}><input {...p} {...props(id, error)} /></Wrap>;
}

export function Select({
  label, error, hint, options, placeholder = "Select…", ...p
}: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string }) {
  const id = useId();
  return (
    <Wrap id={id} {...{ label, error, hint }}>
      <select {...p} {...props(id, error)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Wrap>
  );
}

export function Textarea({ label, error, hint, ...p }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return <Wrap id={id} {...{ label, error, hint }}><textarea rows={3} {...p} {...props(id, error)} /></Wrap>;
}
