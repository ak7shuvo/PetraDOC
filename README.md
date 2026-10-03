# PetraDOC

Doctor practice, patient record, consultation, prescription and follow-up management. Web app first
(Next.js + React + TypeScript + Tailwind); data is stored locally in the browser (IndexedDB via Dexie),
so it works fully offline and without a database server. Android (Capacitor) and Windows (Tauri) builds are
planned, see `docs/`, but **not built yet**.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run lint
```
Node 20+ recommended. No environment variables are required.

## Features
- **Dashboard**: real counts, today's queue, recent consultations, pending follow-ups, quick actions, per-doctor filter.
- **Doctor profile**: personal/professional details, unlimited education/training/experience, multiple doctors,
  multiple chambers per doctor, live prescription header preview.
- **Patients**: auto Patient ID (`PD-000001`), full demographic/medical fields, local photo, search by name/mobile/ID,
  history timeline (consultations + appointments), delete with confirmation.
- **Consultation**: complaint, history, vitals (auto BMI), examination, diagnosis, medicines, investigations, advice, follow-up.
- **Medicines & prescription**: your own medicine list (favourites), manual entry, templates, "use previous prescription as new".
- **Investigations**: test list with categories, custom panels, manual entry.
- **Appointments**: per-doctor/chamber/day tokens, queue statuses, start consultation from queue, follow-up booking.
- **Output**: A4 print (browser), PDF download, 58 mm / 80 mm thermal layouts (via browser print dialog).
- **Backup/restore**: export/import a JSON file. Google Drive is a documented future destination only.
- **Licensing**: Unactivated / Trial / Active / Expired / Revoked / Invalid with signed-key verification (see below).
- **Roles**: Doctor, Receptionist, Assistant, Admin permissions (UI-level, see limitations).

## Architecture
- `src/lib/repository.ts` defines `Repository<T>`; `src/lib/dexie-repository.ts` implements it with Dexie;
  `src/lib/repositories.ts` is the only place storage is obtained. UI/features never import Dexie.
- `src/features/*` hold domain code (types, services, components). `src/platform` and `src/features/printing|backup|licensing`
  are the seams for native work (`docs/NATIVE-INTEGRATION.md`).
- `prisma/schema.prisma` is the future PostgreSQL server target; it is **not wired** to the app.
- Detail/edit pages use query strings (`/patients/detail?id=`) to stay compatible with static export for Capacitor/Tauri.

## Licensing
No license key is hardcoded and no license server exists. Signed keys (`base64url(payload).base64url(signature)`,
ECDSA P-256) are verified on-device against a vendor public key supplied at build time in
`NEXT_PUBLIC_LICENSE_PUBLIC_KEY`. Without that key every signed license is rejected. Vendor tooling:
`node scripts/license-tool.mjs keygen|sign` (keep the private key out of the repo).
A 30-day local trial is available; it is not tamper-proof. Expired/revoked/invalid/unactivated states make the app read-only
(data and backup export stay available).

## Known limitations
- **Data lives only in this browser.** Clearing site data or losing the device loses it. Export backups regularly.
  Backup files are not encrypted.
- **No authentication.** The "Active role" selector is local and only hides/disables UI; it is not a security boundary.
  Real auth (and server-side enforcement) is pending. IndexedDB is not encrypted at rest.
- Licensing is client-side only (no server, no revocation feed); a determined user can bypass it.
- PDFs are raster images (text not selectable); long A4 prescriptions are split at a fixed page height.
- Direct Bluetooth/USB/LAN thermal printing is not implemented (needs native app); thermal output goes through the OS print dialog.
- Doctors and medicines/tests cannot be bulk-imported; doctors cannot be deleted.
- Not tested on real phones, screen readers, or real printers. Multi-device sync does not exist.
- `npm audit` reports advisories that need major upgrades (Next 16, Tailwind 4); see `AUDIT.md`.

## Docs
`PROJECT-CONTRACT.md`, `PROJECT-STATE.md`, `AUDIT.md`, `docs/MASTER-PROMPT.md`, `docs/ANDROID-APK-BUILD.md`,
`docs/WINDOWS-EXE-BUILD.md`, `docs/NATIVE-INTEGRATION.md`.
