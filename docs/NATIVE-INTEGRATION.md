# Native integration

Status: the web app is complete; **nothing native is implemented**. This file lists the seams that exist in the code and what a native build must provide. See `ANDROID-APK-BUILD.md` and `WINDOWS-EXE-BUILD.md` for the wrappers.

## Seams that exist
| Concern | Interface (file) | Web implementation | Native work |
|---|---|---|---|
| Storage | `Repository<T>` (`src/lib/repository.ts`), obtained only via `src/lib/repositories.ts` | `DexieRepository` (IndexedDB) | SQLite implementation (Capacitor SQLite / Tauri SQL) with the same interface; swap in `repositories.ts`. |
| Printing | `PrinterAdapter` (`src/features/printing/types.ts`, `adapters.ts`) | `BrowserPrinterAdapter` (print dialog + `@page` size). Bluetooth/USB/LAN adapters are `UnavailablePrinterAdapter` (report unavailable, throw on print). | ESC/POS over Bluetooth (Android) / USB, serial, LAN (Windows). Register in `PRINTERS`; targets `A4`, `THERMAL_58`, `THERMAL_80` already drive layouts (`ThermalDocument`). |
| Files / sharing | `PlatformCapabilities` (`src/platform/types.ts`), not yet used | `downloadBlob()` in `printing/pdf.ts` (`<a download>`) | Implement `saveFile`/`share`, route backup export and PDF download through it (blob downloads fail in the Android WebView). |
| Backup destinations | `BackupDestination` (`src/features/backup/types.ts`) | Local file export/import only; Google Drive is `UnavailableDestination` | Drive OAuth + upload/list/download. Drive is a *destination*, never the primary DB. Encrypted backups already work, so uploads can be ciphertext. |
| Licensing | `LicenseRepository` / `LicenseValidator` (`src/features/licensing`) | Dexie repository; ECDSA P-256 validator with build-time public key | License server issuing signed keys and a revocation feed that sets `revokedAt`; secure storage for the license record. |
| Secure storage | none | Backup passphrases are never stored; license lives in IndexedDB | Keychain/Keystore (Android Keystore, Windows Credential Manager) for anything secret. |
| Notifications | none | none | Local notifications for pending follow-ups (data: `pendingFollowUps()` in `features/appointments/service.ts`). |

## Printing details
- `BrowserPrinterAdapter` injects `@page { size: A4 | 58mm auto | 80mm auto }`, calls `window.print()`, and removes the style on `afterprint`. Thermal widths therefore work with any OS thermal printer driver.
- PDF: `src/features/printing/pdf.ts` (html2canvas + jsPDF, dynamically imported). A4 output is multi-page with cuts on blank gaps; thermal output is one tall page. PDF content is raster (text not selectable): selectable text would need a separate text layout with an embedded Bengali font.

## Rules for native work
Keep business logic in `src/features`; native code only implements the interfaces above. Do not fork logic per platform. Do not fake a device (no mock printer or Drive that "succeeds").
