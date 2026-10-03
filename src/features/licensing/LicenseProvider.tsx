"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getLicenseStatus, startTrial, type LicenseStatus } from "./service";

// Fail closed: until the license status is known, writing is not allowed (UI shows nothing instead of flashing).
const Ctx = createContext<{ status: LicenseStatus | null; loading: boolean; canWrite: boolean; refresh: () => Promise<void> }>({
  status: null, loading: true, canWrite: false, refresh: async () => {},
});
export const useLicense = () => useContext(Ctx);

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const refresh = useCallback(async () => setStatus(await getLicenseStatus()), []);
  useEffect(() => { refresh().catch(() => {}); }, [refresh]);
  return <Ctx.Provider value={{ status, loading: status === null, canWrite: status ? status.canWrite : false, refresh }}>{children}</Ctx.Provider>;
}

export function LicenseBanner() {
  const { status, refresh } = useLicense();
  if (!status || status.state === "ACTIVE") return null;
  const s = status.state;
  const tone = s === "TRIAL" ? "bg-teal-50 text-primary-dark" : "bg-amber-50 text-warning-fg";
  return (
    <div role="status" className={`flex flex-wrap items-center gap-2 px-4 py-2 text-sm print:hidden ${tone}`}>
      {s === "TRIAL" && <span>Trial: {status.trialDaysLeft} day(s) left. Local trial only.</span>}
      {s === "UNACTIVATED" && <span>No license yet: the app is read-only until you start the 30-day trial or activate a license.</span>}
      {(s === "EXPIRED" || s === "REVOKED" || s === "INVALID") && <span>Read-only: {status.reason} Existing data and backups remain available.</span>}
      {s === "UNACTIVATED" && <button className="min-h-[44px] rounded-lg bg-primary px-3 text-white" onClick={async () => { await startTrial(); await refresh(); }}>Start 30-day trial</button>}
      <a href="/settings" className="min-h-[44px] content-center underline">License settings</a>
    </div>
  );
}
