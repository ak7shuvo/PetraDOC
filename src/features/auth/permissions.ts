import type { Role } from "@/types/roles";

/**
 * Role -> permission matrix. This is UI-level gating only: there is NO
 * authentication yet, so it is not a security boundary. Real auth is pending.
 */
export type Permission =
  | "patient:read" | "patient:write"
  | "profile:edit"
  | "consultation:write" | "medicine:write" | "investigation:write" | "appointment:write"
  | "settings:manage";

const MATRIX: Record<Role, Permission[]> = {
  DOCTOR: ["patient:read", "patient:write", "profile:edit", "consultation:write", "medicine:write", "investigation:write", "appointment:write"],
  RECEPTIONIST: ["patient:read", "patient:write", "appointment:write"],
  ASSISTANT: ["patient:read", "patient:write", "appointment:write"],
  ADMIN: ["patient:read", "patient:write", "profile:edit", "medicine:write", "investigation:write", "appointment:write", "settings:manage"],
};

export const can = (role: Role, p: Permission) => MATRIX[role].includes(p);

export const ROLE_LABELS: Record<Role, string> = {
  DOCTOR: "Doctor", RECEPTIONIST: "Receptionist", ASSISTANT: "Assistant", ADMIN: "Admin",
};
