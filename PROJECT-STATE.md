# PROJECT STATE

## Current phase
Phases 1-10 complete (this session). Project is runnable and feature-complete against `docs/MASTER-PROMPT.md` for the web app. Next work: real authentication/server sync, native builds (Capacitor/Tauri), dependency major upgrades, device/accessibility testing.

## Completed
- Phase 1: Dexie `Repository<T>` storage (no server needed), UI kit (Button, Input, Select, Textarea, Card, Modal, Badge, EmptyState, Toast), responsive shell, dashboard with real counts, role helper.
- Phase 2: Doctor profile (unlimited education/training/experience), multiple chambers, live prescription header preview.
- Phase 3: Patients (auto ID, all fields, local photo, search by name/mobile/ID, detail + timeline).
- Phase 4: Consultation (complaint, history, vitals with BMI, examination, diagnosis, advice, follow-up), auto Rx ID.
- Phase 5: Medicine database (+favourites), prescription editor (search, manual, templates, "use previous prescription as new"), prescriptions list, footer setting.
- Phase 6: Investigation database, categories, custom panels, ordering in consultations.
- Phase 7: Appointments with tokens/queue, follow-up tracking/booking, multiple doctors + per-doctor chambers, dashboard/timeline wiring.
- Phase 8: A4 print, PDF download, 58/80 mm thermal layouts, `PrinterAdapter` (browser adapter real; Bluetooth/USB/LAN explicitly unavailable).
- Phase 9: Backup/restore (JSON file), licensing (signed-key verification, trial, states, read-only enforcement), role/permission matrix with clinical-data separation.
- Phase 10: Patient delete (cascades to consultations/appointments, confirmation), browser-only-data warnings, ESLint config, npm audit triage, README.

## Remaining / future
- Real authentication + server-side enforcement; PostgreSQL/Prisma wiring and sync; SQLite for native.
- Capacitor/Tauri builds, native thermal printing (Bluetooth/USB), Google Drive backup destination, license server + revocation feed.
- Upgrade Next 14 → current and Tailwind 3 → 4 (clears audit advisories).
- Doctor delete, bulk import of medicines/tests, encrypted backups, selectable-text PDF.

## Known issues
- Data is only in the browser's IndexedDB (unencrypted). Backups are unencrypted JSON.
- No authentication; role gating is UI-only, not a security boundary.
- Licensing is client-side; the trial is local and resettable; no revocation source exists.
- PDF is raster; long A4 prescriptions are split at a fixed page height (can cut a line).
- Patient ID / Rx ID / token use max+1 locally: will need rework for multi-device sync.
- Restore is not atomic across tables (input is validated first).
- `npm audit`: 10 advisories (9 high, 1 critical), all require major upgrades (see AUDIT.md).
- Not tested: real phones/tablets, screen readers, real printers, Safari/Firefox, large datasets (search is in-memory).

## Architecture decisions
- Web-first Dexie storage behind `Repository<T>`; `src/lib/repositories.ts` is the only place storage is obtained. `prisma/schema.prisma` is a future target, not wired.
- Features in `src/features/*`; native seams: `PrinterAdapter`, `BackupDestination`, `PlatformCapabilities`.
- Detail/edit pages use query params (`/patients/detail?id=`) for static-export (Capacitor/Tauri) compatibility.
- Consultation embeds medicines and ordered tests; the prescription is a rendering of a consultation (Rx ID = `rxCode`).
- Licensing is isolated from the Doctor Profile and verifies ECDSA P-256 signatures against a build-time public key; no hardcoded key.
- BMDC number and qualifications are user-provided, not verified (labelled in the UI).

## Dependencies added (and why)
- `dexie`: IndexedDB wrapper for the local-first repository implementation.
- `jspdf` + `html2canvas`: generate a real PDF file in-browser that renders Bengali/any web font correctly (dynamically imported only on "Download PDF"). Vector PDF libraries would need Bengali fonts bundled and shaped manually.
- No form/validation library: validation is small hand-written functions.

## How to run
`npm install && npm run dev` (http://localhost:3000); `npm run build`; `npm run typecheck`; `npm run lint`.
