# PROJECT STATE

## Current phase
Phases 1-9 complete. Phase 10 (final integration, audit triage, patient delete, README) is next.

## Completed
- Scaffold verified: `npm install`, `npm run typecheck`, `npm run build` all pass.
- Storage: `Repository<T>` (src/lib/repository.ts) + Dexie/IndexedDB implementation (src/lib/dexie-repository.ts). App works with no server. `src/lib/repositories.ts` is the single place storage is obtained; UI/services never import Dexie.
- Auth seam: role permission matrix + local "Active role" selector (src/features/auth). **No login/authentication exists; real auth is pending.** Role gating is UI-only, not a security boundary.
- UI kit (src/components/ui): Button, Input, Select, Textarea, Card, Modal (native `<dialog>`), Badge, EmptyState, Toast.
- Responsive shell: sidebar (desktop), bottom nav + "More" (mobile), 44px targets.
- Dashboard: real counts from repositories, recent consultations, quick actions, empty states.

- Phase 2: Doctor Profile (personal, professional, unlimited education/training/experience), multiple Chambers (CRUD), live prescription header preview (profile + selected chamber), photo stored locally. Editing gated to Doctor/Admin roles (UI-only). Single local doctor record (id `primary`); multi-doctor deferred to Phase 7.

- Phase 3: Patients. Create/edit, auto Patient ID (`PD-000001`, max+1), all master-prompt fields, local photo (resized JPEG data URL), search by name/mobile/ID, detail page with history timeline (empty until consultations exist). Pages: `/patients`, `/patients/new`, `/patients/edit?id=`, `/patients/detail?id=`.
- Phase 4: Consultation (complaint, history, vitals incl. auto BMI, examination, diagnosis, advice, follow-up), auto Prescription ID (RX-000001), local-date handling, prescription view page (A4 document component), patient timeline links to visits. Full `Consultation` model and all Dexie tables (v2) defined up front.
- Phase 5: Medicine database (generic/brand/strength/form/route/manufacturer, favourites; empty by default, nothing pre-seeded), prescription editor in consultations (search DB, favourites, manual entry, templates, 'Use previous prescription as new'), prescriptions list, prescription footer setting.
- Phase 6: Investigation database with categories, custom panels, ordering in consultations (search, panel, manual entry, notes), shown on prescription. Empty by default.
- Phase 7: Appointments with per-doctor/chamber/day token, queue statuses (scheduled → waiting → in consultation → done / cancelled), start-consultation from queue (auto-marks done on save), follow-up tracking (overdue/upcoming, book from follow-up), multiple doctors (profile switcher, per-doctor chambers, doctor filter on dashboard/queue), dashboard counts and patient timeline now include appointments and consultations. Doctors cannot yet be deleted.
- Phase 8: Prescription output: A4 browser print (print CSS hides app chrome), real PDF download, 58mm/80mm thermal layouts, `PrinterAdapter` seam with a real BrowserPrinterAdapter and explicitly-unavailable Bluetooth/USB/LAN adapters (documented in docs/NATIVE-INTEGRATION.md). Dependencies added: `jspdf` + `html2canvas` (both dynamically imported only on 'Download PDF'): needed to produce a real PDF file in-browser that renders Bengali/any web font correctly; the alternative (vector PDF libraries) requires bundling and shaping Bengali fonts manually.
- Phase 9: **Backup/restore** (versioned JSON export/import through repositories, validated before replacing data, license excluded, warning that data lives only in this browser + last-backup date; Google Drive is an explicit unavailable destination). **Licensing** (UNACTIVATED/TRIAL/ACTIVE/EXPIRED/REVOKED/INVALID; `LicenseRepository` (Dexie), `LicenseValidator` (ECDSA P-256 signature verification with a build-time public key from `NEXT_PUBLIC_LICENSE_PUBLIC_KEY`, no hardcoded key), service, banner, Settings card; separate from Doctor Profile; writes are blocked unless TRIAL/ACTIVE; vendor tool `scripts/license-tool.mjs`). **Roles**: matrix extended (clinical:read, backup/license manage, patient:delete); Receptionist/Admin cannot see clinical pages/data; nav filtered; UI-only gating.

## Remaining
- Phases 4-10 per master prompt.

## Known issues
- Dashboard "Today's appointments"/"Follow-ups"/"Recent consultations" read real repos but stay 0 until Phases 4/7 create data.
- IndexedDB is per-browser/device; no backup yet (Phase 9).

- Patient delete is intentionally not implemented (no requirement; avoids orphaned history). Patient ID uses max+1 locally; will need revisiting for multi-device sync.
- Patient photos are stored inside IndexedDB records; included in future backups.

- PDF is raster (html2canvas image inside jsPDF): text is not selectable, and an A4 prescription longer than one page is split at a fixed height (may cut a line). Typical one-page prescriptions are fine.

## Architecture decisions
- Web-first Dexie storage; prisma/schema.prisma kept as future server target, NOT wired.
- Features in `src/features/*`; native capabilities behind `src/platform`.
- Detail/edit pages use query params (`/patients/detail?id=`) rather than dynamic segments, keeping static-export (Capacitor/Tauri) compatibility.

## Dependencies added
- `dexie` — IndexedDB wrapper for the web repository implementation (local-first, no server needed). No form/validation library: validation is small hand-written functions.

## Next steps
1. Phase 4 (Consultation + vitals); extend `Consultation` type and make the timeline/dashboard show real data.
