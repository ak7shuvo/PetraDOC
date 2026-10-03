import type { Role } from "@/types/roles";

/**
 * Role -> permission matrix. This is UI-level gating only: there is NO
 * authentication yet, so it is not a security boundary. Real auth is pending.
 */
export type Permission =
  | "patient:read" | "patient:write" | "patient:delete"
  | "clinical:read"          // diagnoses, prescriptions, medical history, allergies
  | "consultation:write" | "medicine:write" | "investigation:write" | "appointment:write"
  | "profile:edit" | "backup:manage" | "license:manage";

const MATRIX: Record<Role, Permission[]> = {
  DOCTOR: ["patient:read", "patient:write", "patient:delete", "clinical:read", "consultation:write", "medicine:write",
    "investigation:write", "appointment:write", "profile:edit", "backup:manage", "license:manage"],
  RECEPTIONIST: ["patient:read", "patient:write", "appointment:write"],
  ASSISTANT: ["patient:read", "patient:write", "clinical:read", "appointment:write"],
  ADMIN: ["patient:read", "patient:write", "patient:delete", "appointment:write", "profile:edit", "backup:manage", "license:manage"],
};

export const can = (role: Role, p: Permission) => MATRIX[role].includes(p);

/** Permissions that change data. These are additionally blocked when the license does not allow writing. */
export const isWritePermission = (p: Permission) => p.endsWith(":write") || p === "profile:edit" || p === "patient:delete";

export const ROLE_LABELS: Record<Role, string> = {
  DOCTOR: "Doctor", RECEPTIONIST: "Receptionist", ASSISTANT: "Assistant", ADMIN: "Admin",
};
