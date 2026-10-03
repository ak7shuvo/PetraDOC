"use client";
import { useEffect, useRef } from "react";
import { Button } from "./Button";

/** Native <dialog>: focus trap, Escape to close, backdrop handled by the browser. */
export function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">✕</Button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
