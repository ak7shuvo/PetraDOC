import type { Permission } from "@/features/auth/permissions";

export const NAV_ITEMS: readonly { href: string; label: string; short: string; primary: boolean; perm?: Permission }[] = [
  { href: "/", label: "Dashboard", short: "Home", primary: true },
  { href: "/patients", label: "Patients", short: "Patients", primary: true },
  { href: "/consultations", label: "Consultations", short: "Consult", primary: true, perm: "clinical:read" },
  { href: "/appointments", label: "Appointments", short: "Queue", primary: true },
  { href: "/profile", label: "Doctor Profile", short: "Profile", primary: true },
  { href: "/prescriptions", label: "Prescriptions", short: "Rx", primary: false, perm: "clinical:read" },
  { href: "/medicines", label: "Medicines", short: "Medicines", primary: false, perm: "clinical:read" },
  { href: "/investigations", label: "Investigations", short: "Tests", primary: false, perm: "clinical:read" },
  { href: "/settings", label: "Settings", short: "Settings", primary: false },
];
