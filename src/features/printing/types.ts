export type PrintTarget = "A4" | "THERMAL_58" | "THERMAL_80";

/** Implemented per platform later (browser print, Bluetooth, USB, network). */
export interface PrinterAdapter {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  print(target: PrintTarget, document: unknown): Promise<void>;
}
