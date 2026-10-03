"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error";
const Ctx = createContext<(msg: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: Tone }[]>([]);
  const push = useCallback((msg: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg, tone }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 md:bottom-6">
        {items.map((i) => (
          <div key={i.id} className={`rounded-lg px-4 py-3 text-sm text-white ${i.tone === "error" ? "bg-danger" : "bg-ink"}`}>
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
