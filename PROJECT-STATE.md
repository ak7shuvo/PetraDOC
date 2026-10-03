# PROJECT STATE

## Current phase
All planned phases (1-10) and the "final" hardening tasks (1-8) are complete. The web app is feature-complete against `docs/MASTER-PROMPT.md`. What remains is real-world verification (phone, printer, screen reader) and the future native/server work listed below.

## Completed
- **Phases 1-10** (foundation, doctor profile + chambers, patients, consultation + vitals, medicines + prescription, investigations, appointments/queue/follow-ups/multiple doctors, PDF/print/thermal seam, backup/licensing/roles, patient delete + docs).
- **Final 1: PDF.** Long prescriptions flow onto multiple A4 pages (cuts at blank gaps between entries, fixed 794px layout width regardless of screen). PDF stays raster: selectable text was evaluated and rejected (would need a second text layout engine + embedded Bengali font; documented).
- **Final 2: data safety.** `navigator.storage.persist()` requested at start with a visible status/usage in Settings; passphrase-encrypted backups (PBKDF2-SHA256 310k iterations, AES-256-GCM) with wrong-passphrase / corrupted / truncated detection; unencrypted export kept with a warning; dashboard reminder when no backup in 7 days.
- **Final 3: missing features.** Doctor delete (blocked with explanations when consultations/appointments exist or it is the last doctor); CSV/JSON import for medicines and tests (preview, duplicate skip/update, invalid-row report, sample download); opt-in starter lists labelled "Starter list, verify before use" (generic names only, no strengths/doses).
- **Final 4: mobile.** Web app manifest + icons (`scripts/make-icons.mjs`), no service worker, safe-area padding; all tap targets >= 44px at 360/390px on 13 pages; correct `type`/`inputmode`; no horizontal scroll.
- **Final 5: accessibility.** axe-core (WCAG 2 A/AA + best-practice) on 15 pages at 390 and 1280px plus an open dialog: no serious/critical issues. Fixed colour contrast with text-safe status colours (`*-fg` tokens) and a slightly darker `muted` than the brand spec (#5A6B82 vs #64748B, documented in `tailwind.config.ts`); added a skip link; native `<dialog>` keeps focus off the page behind it and restores it on close.
- **Final 6: scale.** Indexed/ordered Dexie queries (`where` uses indexes, `orderBy` cursors, schema v3 adds `consultations.followUpDate`), paginated lists (50 + "Show more"). At 2,000 patients / 5,000 consultations: all measured screens 79-280 ms (was up to 936 ms), 50 DOM rows instead of 2,000. Firefox/WebKit could not be installed (egress blocked).
- **Final 7: dependencies.** Next 14 -> 16.3.8, React 18 -> 19, ESLint 8 -> 9 (flat config; `next lint` no longer exists). `npm audit --omit=dev`: 0 vulnerabilities. Also hardened: role is read synchronously (no wrong-role flash) and writes are disallowed until the license status is known (was fail-open).
- **Final 8: docs.** README, this file, AUDIT.md, the three `docs/` build/integration files, and `docs/USER-GUIDE.md`.

## Not done / future
- Real authentication and server-side enforcement; PostgreSQL/Prisma wiring and multi-device sync; SQLite for native.
- Capacitor/Tauri builds, native thermal printing (Bluetooth/USB), Google Drive destination, license server + revocation feed.
- Tailwind 3 -> 4 (only dev-time audit advisories remain; needs config/CSS rewrite and visual checks).
- Selectable-text PDF; service worker/offline shell; encrypted storage at rest.
- Test on a real phone, real printers (A4 + thermal), a screen reader, Firefox and Safari.

## Known issues
See `AUDIT.md` > KNOWN LIMITS. Main ones: browser-local data (backup is the only safety net), no authentication (roles are UI-only), client-side-only licensing with a local resettable trial, raster PDFs, `react-hooks/set-state-in-effect` lint rule downgraded to a warning (14 warnings).

## Architecture decisions
- Web-first Dexie storage behind `Repository<T>`; `src/lib/repositories.ts` is the only place storage is obtained. `prisma/schema.prisma` is a future target, not wired.
- Features in `src/features/*`; native seams: `PrinterAdapter`, `BackupDestination`, `PlatformCapabilities`, `LicenseRepository/Validator`.
- Query-string routes (`/patients/detail?id=`) for static-export compatibility.
- Consultation embeds medicines and ordered tests; a prescription is a rendering of a consultation (Rx ID = `rxCode`).
- Licensing isolated from the Doctor Profile; ECDSA P-256 signatures against a build-time public key; no hardcoded key. Writes require TRIAL/ACTIVE; reads and backup export always work.
- No service worker (stale-cache risk); PWA manifest only.
- Brand colour tokens kept for fills; text uses AA-safe variants.
- BMDC number and qualifications are user-provided, not verified (labelled in the UI).

## Dependencies (and why)
Runtime: `next`, `react`, `react-dom`; `dexie` (IndexedDB repository); `jspdf` + `html2canvas` (real PDF files that render Bengali correctly, loaded only on "Download PDF"). Dev only: `tailwindcss`/`postcss`/`autoprefixer`, `eslint` + `eslint-config-next`, `typescript`, `playwright-core` (e2e/a11y/perf/icons scripts), `axe-core` (accessibility script), `prisma` (future server schema). No form/validation library: validation is small hand-written functions.

## How to run
`npm install && npm run dev` (http://localhost:3000); `npm run build`; `npm run typecheck`; `npm run lint`; dev-only: `npm run e2e`, `npm run e2e:license`, `npm run a11y`, `npm run perf` (see README).
