# Native Integration (FUTURE)
Planned: Bluetooth/USB thermal printer, filesystem, local backup, Google Drive, secure storage, notifications, sharing. Behind src/platform and src/features/printing|backup.

## Printing seam (implemented in the web app)
- `src/features/printing/types.ts` defines `PrinterAdapter` and `PrintTarget` (`A4`, `THERMAL_58`, `THERMAL_80`).
- `BrowserPrinterAdapter` (real) prints the on-screen prescription (`#rx-print`) via the browser print dialog with a matching `@page` size. Thermal widths therefore work with any OS-installed thermal printer driver.
- `UnavailablePrinterAdapter` entries (Bluetooth, USB, LAN) report `isAvailable() === false` and throw on `print()`. Native work = replace these with Capacitor/Tauri implementations that send ESC/POS bytes, and register them in `PRINTERS` (`adapters.ts`). No UI changes needed.
- PDF: `src/features/printing/pdf.ts` (html2canvas + jsPDF, dynamically imported). Output is raster; selectable-text PDF would need a text-based generator plus an embedded Bengali font.
