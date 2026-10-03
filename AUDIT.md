# AUDIT

Last full run: 2026-10-03, Chromium (headless, Playwright 1.56.1) against production builds of Next 16.3.8 / React 19.
Scripts live in `scripts/` (`npm run e2e`, `e2e:license`, `a11y`, `perf`) so every VERIFIED line can be reproduced.

## VERIFIED (automated test passed)
| Area | Evidence |
|---|---|
| Build / types / lint | `npm run typecheck`, `npm run build` pass; `eslint .` = 0 errors, 14 warnings (`react-hooks/set-state-in-effect`, see Known limits) |
| Patients | auto ID, validation, search by name/mobile/ID, edit, delete with browser-only-data warning, cascade delete (e2e) |
| Doctors/chambers | profile persists, header preview, second doctor, doctor delete blocked with reason (history / last doctor), unused doctor deletable (e2e) |
| Consultation / Rx | BMI, medicines from list/favourite/manual, template, "use previous prescription as new", panels/tests on Rx, footer, Rx IDs (e2e) |
| Appointments | tokens per doctor/day, check-in, start consultation marks Done, overdue follow-up -> booked, dashboard counts, patient timeline (e2e) |
| Output | A4 PDF and 80 mm PDF download are valid PDFs; 40-medicine prescription becomes >= 2 A4 pages; page 1 inspected visually: cut falls between entries; print media hides app chrome; 80 mm layout width = 302px (e2e) |
| Backup | plain export/restore replaces data; invalid file rejected; encrypted export has no readable data; short/mismatched passphrase rejected; wrong passphrase, corrupted ciphertext and truncated file rejected; correct passphrase restores; license excluded from backups; 7-day reminder (never / fresh / 10 days) (e2e) |
| Persistence | storage-protection status rendered in Settings (granted/not-granted/unsupported text); headless Chromium reports not-granted, so the "granted" path is UNVERIFIED |
| Import / starter | CSV (quotes, commas, case/synonym headers) and JSON; preview counts; duplicates skipped or updated; invalid rows reported; invalid JSON message; sample download; starter lists empty by default, opt-in, labelled, idempotent, no dosing data (e2e) |
| Licensing | read-only before trial; garbage/unsigned keys never activate (default build); expired trial, revoked and invalid states are read-only but keep data and backup export; with a test public key: forged-signature, tampered-payload and expired keys rejected, valid key activates, persists, writes allowed (e2e + e2e:license) |
| Roles | Receptionist: no clinical nav/pages/medical history; Assistant cannot delete patients; role read synchronously (no wrong-role flash) (e2e) |
| Mobile | 360 and 390px: no horizontal scroll (11 pages), all interactive elements >= 44px (13 pages), `type`/`inputmode` for tel/date/numeric/decimal/email, no page errors (e2e) |
| Accessibility | axe-core WCAG 2 A/AA + best-practice: 0 serious/critical on 15 pages x {390px, 1280px} + open dialog; skip link is first Tab stop; modal keeps focus off the page and Escape restores focus; invalid fields are `aria-invalid` with linked messages (a11y + e2e) |
| Scale (2,000 patients / 5,000 consultations, restored through the real restore flow) | initial patient list 134 ms, name search 226 ms, mobile search 79 ms, ID search 209 ms, dashboard 208 ms, patient timeline 107 ms, consultations list 141 ms, prescriptions list 159 ms, appointments 280 ms; lists render 50 rows. Before optimisation: consultations 765 ms, prescriptions 936 ms, name search 656 ms, 2,000 DOM rows. Restore of that dataset: 2.9 s |
| Dependencies | `npm audit --omit=dev`: 0 vulnerabilities. Full audit: 7 high, all dev-tool only (see below) |
| Dev server | `next dev` serves pages (checked in Phase 10 before the Next 16 upgrade; the production build and all e2e run on Next 16) |

## UNVERIFIED (needs a real device, printer or assistive tech)
- **Real phone/tablet**: touch feel, on-screen keyboards, camera/photo picker, add-to-home-screen install and standalone mode, safe-area insets (iOS), performance on low-end hardware.
- **Real printers**: A4 via OS drivers, 58/80 mm thermal paper sizes and margins via the browser dialog, PDF in external viewers (Acrobat, phone viewers).
- **Screen readers** (NVDA, VoiceOver, TalkBack): only automated axe checks and keyboard tests were run; reading order and announcements are untested. WCAG needs manual review beyond automation.
- **Other browsers**: Firefox and WebKit/Safari. They could not be installed here (the network blocks the Playwright CDN, 2 attempts). `E2E_BROWSER=firefox|webkit npm run e2e` is supported; run it where the browsers are available. Safari/iOS IndexedDB eviction behaviour is unknown.
- Persistent-storage "granted" path; behaviour when the browser quota is exhausted or data is evicted.
- Multi-tab concurrent edits; very large photos; long-running sessions.
- Real license issuing flow (no license server exists), revocation source, clock tampering.

## KNOWN LIMITS (by design or deferred)
- **Data is browser-local and unencrypted at rest.** Clearing site data, uninstalling the browser or losing the device loses it; encrypted backups are the only safety net. No sync between devices.
- **No authentication.** The role selector only hides/disables UI; anyone at the device can switch roles or read data via devtools. Real auth + server-side checks are future work.
- **Licensing is client-side only**: bypassable by a determined user; the trial is local and resettable by clearing data; no revocation feed exists (`revokedAt` is a seam for a future server). No key is hardcoded; builds without `NEXT_PUBLIC_LICENSE_PUBLIC_KEY` reject all signed keys.
- **PDF is raster** (text not selectable/searchable); cuts are on blank gaps, so one very tall unbroken block could still be split. Selectable text would need a second text layout engine and an embedded Bengali font.
- **Thermal printing** only via the OS print dialog; Bluetooth/USB/LAN adapters are explicit "unavailable" placeholders.
- Passphrase-forgotten encrypted backups are unrecoverable (no reset by design). Unencrypted export remains available (with warning).
- Restore is validated before it starts but not atomic across tables (a crash mid-restore could leave partial data; keep the previous backup).
- IDs (Patient ID, Rx ID, tokens) use max+1 locally; they will collide across devices once sync exists.
- No service worker: launching offline relies on the browser cache; first load needs the network.
- `muted` text colour is #5A6B82 (brand spec #64748B failed AA on tinted surfaces); status colours have `*-fg` text variants.
- Lint: `react-hooks/set-state-in-effect` (new in eslint-config-next 16) is a warning (14 spots); the effects are standard async data loading.
- Starter medicine/test lists are convenience names only, not clinical content; doctors must verify everything.
- Delete of patients/doctors is permanent without a backup.

## npm audit (full: 7 high; production-only: 0)
Next 16.3.8 cleared the critical advisories (self-hosted server features: Image Optimizer, RSC DoS, rewrites). Remaining, all devDependencies and not shipped: `tailwindcss` 3 -> `chokidar`/`braces`/`micromatch`/`fast-glob` (glob pattern DoS in the build tool) and `eslint-config-next` -> `@next/eslint-plugin-next` (dev tooling). The fix is Tailwind 4, which was **not attempted**: it needs a config/CSS migration with visual-regression risk for dev-time-only advisories.

## History of checks (condensed)
Phases 1-10 each had a scripted smoke test (all PASS); the Final tasks replaced them with the committed suite. Notable findings fixed along the way: PDF list-marker overlap; PDF page cut through a text line (DOM measurement unreliable inside html2canvas -> pixel-gap cutting); wrong-role flash and fail-open license loading; colour-contrast failures; four sub-44px links; a flaky test race (selector resolved before a dialog rendered).
