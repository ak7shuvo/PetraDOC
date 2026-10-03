"use client";
import { useRef } from "react";
import { fileToPhotoDataUrl } from "@/lib/image";
import { Button } from "./Button";
import { useToast } from "./Toast";

/** Photo stored locally as a small data URL (no upload anywhere). */
export function PhotoField({ value, onChange, label = "Photo" }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 text-xs text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : "No photo"}
      </div>
      <div className="flex flex-wrap gap-2">
        <input ref={ref} type="file" accept="image/*" hidden aria-label={label}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try { onChange(await fileToPhotoDataUrl(f)); } catch { toast("Could not read that image", "error"); }
          }} />
        <Button variant="secondary" onClick={() => ref.current?.click()}>{value ? "Change photo" : "Add photo"}</Button>
        {value && <Button variant="ghost" onClick={() => onChange(undefined)}>Remove</Button>}
      </div>
    </div>
  );
}
