import type { Vitals } from "./types";

/** BMI = kg / m². Height in cm. Returns "" when inputs are missing/invalid. */
export function computeBmi(weightKg: string, heightCm: string): string {
  const w = parseFloat(weightKg), h = parseFloat(heightCm) / 100;
  return w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : "";
}

const num = (s: string) => s === "" || (!isNaN(Number(s)) && Number(s) >= 0);

export function validateVitals(v: Vitals): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.bp && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(v.bp.trim())) e.bp = "Use format 120/80";
  for (const k of ["pulse", "temperature", "spo2", "respiratoryRate", "weight", "height"] as const)
    if (!num(v[k])) e[k] = "Enter a number";
  if (!e.spo2 && v.spo2 && Number(v.spo2) > 100) e.spo2 = "Cannot exceed 100";
  return e;
}
