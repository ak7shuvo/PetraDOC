# PetraDOC

Doctor practice, patient record, consultation, prescription and follow-up management. A web app
(Next.js 16 + React 19 + TypeScript + Tailwind 3) that keeps all data **locally in the browser** (IndexedDB via Dexie), so it works
without a database server. Android (Capacitor) and Windows (Tauri) wrappers are planned and documented in `docs/` but **not built**.

> **Your data lives only in the browser on this device.** Export (encrypted) backups regularly: see `docs/USER-GUIDE.md`.

## Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run lint
```
Node 20.9+ (tested on 22). No environment variables are required.

Dev-only checks (not shipped; need `npm run build` first and a Chromium that Playwright can find):
```bash
npm run e2e          # ~95 browser checks across all features (E2E_BROWSER=firefox|webkit also supported if installed)
npm run e2e:license  # builds a copy with a test license public key and tests real signed-key activation
npm run a11y         # axe-core on every page at 390px and 1280px (fails on serious/critical)
npm run perf         # 2,000 patients / 5,000 consultations timing run
```

## Features
- **Dashboard**: real counts, today's queue, recent consultations, pending follow-ups, quick actions, per-doctor filter, backup reminder.
- **Doctor profile**: personal/professional details, unlimited education/training/experience, multiple doctors (delete blocked when they have history), multiple chambers, live prescription header preview.
- **Patients**: auto Patient ID, full demographic/medical fields, local photo, search by name/mobile/ID, history timeline, delete with confirmation.
- **Consultation**: complaint, history, vitals (auto BMI), examination, diagnosis, medicines, investigations, advice, follow-up.
- **Medicines & prescriptions**: your own list with favourites, manual entry, templates, "use previous prescription as new", CSV/JSON import (preview, duplicate handling, sample file), opt-in starter list.
- **Investigations**: test list with categories, custom panels, manual entry, CSV/JSON import, opt-in starter list.
- **Appointments**: per-doctor/chamber/day tokens, queue statuses, follow-up booking.
- **Output**: A4 print, multi-page PDF download, 58 mm / 80 mm thermal layouts (through the browser print dialog).
- **Backup & restore**: passphrase-encrypted (AES-256-GCM / PBKDF2) or plain JSON file; wrong-passphrase and corruption detection; persistent-storage request and status; 7-day reminder. Google Drive is a documented future destination only.
- **Licensing**: Unactivated / Trial / Active / Expired / Revoked / Invalid; signed-key verification (ECDSA P-256, build-time public key); read-only enforcement; separate from the Doctor Profile.
- **Roles**: Doctor, Receptionist, Assistant, Admin permissions (UI-level only).
- **Mobile**: responsive, 44px touch targets, correct mobile keyboards, web app manifest + icons (add to home screen).

## Architecture
- `src/lib/repository.ts` defines `Repository<T>`; `src/lib/dexie-repository.ts` implements it (indexed + ordered cursor queries); `src/lib/repositories.ts` is the only place storage is obtained. UI/features never import Dexie. Schema versions are in `src/lib/db.ts`.
- `src/features/*` hold domain code. Native seams: `PrinterAdapter`, `BackupDestination`, `PlatformCapabilities`, `LicenseRepository/Validator` (see `docs/NATIVE-INTEGRATION.md`).
- `prisma/schema.prisma` is the future PostgreSQL server target; it is **not wired** to the app.
- Detail/edit pages use query strings (`/patients/detail?id=`) so the app can be statically exported for Capacitor/Tauri.
- No service worker: avoids stale-cache risk. "Add to home screen" works; launching fully offline needs the app to be cached by the browser or wrapped natively.

## Licensing
No license key is hardcoded and no license server exists. Signed keys (`base64url(payload).base64url(signature)`) are verified on-device against a vendor public key set at build time in `NEXT_PUBLIC_LICENSE_PUBLIC_KEY`; without it every signed key is rejected. Vendor tool: `node scripts/license-tool.mjs keygen|sign` (keep the private key out of the repo). A 30-day local trial exists and is not tamper-proof. When the license is Unactivated, Expired, Revoked or Invalid the app is read-only; data and backup export remain available.

## Known limitations
See `AUDIT.md` (VERIFIED / UNVERIFIED / KNOWN LIMITS). Highlights:
- Data is browser-local and unencrypted at rest; use encrypted backups. No multi-device sync.
- **No authentication**: the role selector only changes the UI and is not a security boundary. Licensing is client-side only.
- PDFs are images (text not selectable). Direct Bluetooth/USB/LAN thermal printing needs a native app.
- Not yet tested on a real phone, a real printer, a screen reader, Firefox or Safari.

## Docs
`docs/USER-GUIDE.md` (for doctors), `PROJECT-CONTRACT.md`, `PROJECT-STATE.md`, `AUDIT.md`, `docs/MASTER-PROMPT.md`, `docs/ANDROID-APK-BUILD.md`, `docs/WINDOWS-EXE-BUILD.md`, `docs/NATIVE-INTEGRATION.md`.
