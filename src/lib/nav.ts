export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", short: "Home", primary: true },
  { href: "/patients", label: "Patients", short: "Patients", primary: true },
  { href: "/consultations", label: "Consultations", short: "Consult", primary: true },
  { href: "/appointments", label: "Appointments", short: "Queue", primary: true },
  { href: "/profile", label: "Doctor Profile", short: "Profile", primary: true },
  { href: "/prescriptions", label: "Prescriptions", short: "Rx", primary: false },
  { href: "/medicines", label: "Medicines", short: "Medicines", primary: false },
  { href: "/investigations", label: "Investigations", short: "Tests", primary: false },
  { href: "/settings", label: "Settings", short: "Settings", primary: false },
] as const;
