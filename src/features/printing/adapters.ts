import type { PrinterAdapter, PrintTarget } from "./types";

const PAGE_CSS: Record<PrintTarget, string> = {
  A4: "@page { size: A4; margin: 10mm; }",
  THERMAL_58: "@page { size: 58mm auto; margin: 2mm; }",
  THERMAL_80: "@page { size: 80mm auto; margin: 2mm; }",
};

/** Real: prints the on-screen document (#rx-print) through the browser's print dialog. */
export class BrowserPrinterAdapter implements PrinterAdapter {
  readonly name = "Browser print dialog";
  async isAvailable() { return typeof window !== "undefined" && typeof window.print === "function"; }
  async print(target: PrintTarget): Promise<void> {
    const style = document.createElement("style");
    style.textContent = PAGE_CSS[target];
    document.head.appendChild(style);
    const done = () => { style.remove(); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
  }
}

/** Placeholder for adapters that need the native app. Reports unavailable; never pretends to print. */
export class UnavailablePrinterAdapter implements PrinterAdapter {
  constructor(readonly name: string, private reason: string) {}
  async isAvailable() { return false; }
  async print(): Promise<void> { throw new Error(`${this.name}: ${this.reason}`); }
}

export const browserPrinter = new BrowserPrinterAdapter();

export const PRINTERS: PrinterAdapter[] = [
  browserPrinter,
  new UnavailablePrinterAdapter("Bluetooth thermal printer", "requires the Android (Capacitor) app; not implemented"),
  new UnavailablePrinterAdapter("USB thermal printer", "requires the native app; not implemented"),
  new UnavailablePrinterAdapter("Network (LAN) thermal printer", "requires the native app; not implemented"),
];
