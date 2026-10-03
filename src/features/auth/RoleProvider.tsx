"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/types/roles";
import { useLicense } from "@/features/licensing/LicenseProvider";
import { can, isWritePermission, ROLE_LABELS, type Permission } from "./permissions";

const KEY = "petradoc.activeRole";
const Ctx = createContext<{ role: Role; setRole: (r: Role) => void }>({ role: "DOCTOR", setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("DOCTOR");
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY) as Role | null;
      if (s && s in ROLE_LABELS) setRoleState(s);
    } catch {}
  }, []);
  const setRole = (r: Role) => {
    setRoleState(r);
    try { localStorage.setItem(KEY, r); } catch {}
  };
  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
/** Role permission AND, for data-changing permissions, a license that allows writing. */
export function useCan(p: Permission) {
  const { role } = useRole();
  const { canWrite } = useLicense();
  return can(role, p) && (!isWritePermission(p) || canWrite);
}

export function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { role } = useRole();
  if (!can(role, permission)) {
    return <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning-fg">The active role ({ROLE_LABELS[role]}) does not have access to this page.</p>;
  }
  return <>{children}</>;
}

/** Local-only role switcher. NOT a login: real authentication is pending. */
export function RoleSelector() {
  const { role, setRole } = useRole();
  return (
    <label className="block text-xs text-muted">
      Active role <span className="text-warning-fg">(local only, no login yet)</span>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="mt-1 block min-h-[44px] w-full rounded-lg border border-border bg-surface px-2 text-sm text-ink"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
    </label>
  );
}
