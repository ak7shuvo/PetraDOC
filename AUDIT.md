# AUDIT

Date of all entries: 2026-10-03. "Smoke" = scripted headless Chromium at 390px width against a production build (scripts are not committed).

| Phase | Check | Result |
|-------|-------|--------|
| 0 | npm install / typecheck / build on scaffold | PASS |
| 1 | typecheck, build | PASS |
| 2 | Smoke: profile + education + chamber save, reload persists, header preview | PASS |
| 3 | Smoke: create patient (PD-000001), invalid mobile blocked, search name/mobile/ID, empty state | PASS |
| 4 | Smoke: consultation from patient page, BMI, Rx page, dashboard, timeline | PASS |
| 5 | Smoke: medicine + favourite, add by search / manual, template, copy previous Rx, footer, Rx list | PASS |
| 6 | Smoke: tests + categories, panel, order panel/search/manual, shown on Rx | PASS |
| 7 | Smoke: 2 doctors, tokens 1/2, check-in, start consultation → Done, overdue follow-up booked, dashboard counts, timeline | PASS |
| 8 | Smoke: PDF download (A4 + thermal, valid %PDF), 80 mm width, print media hides chrome; PDF page inspected visually (fixed list-marker overlap) | PASS |
| 9 | Smoke (build with test public key): read-only before trial, trial, garbage/forged/expired keys rejected, valid key → ACTIVE, backup export/restore/bad file, Receptionist restrictions | PASS |
| 10 | typecheck, `next lint` (clean), production build without license key | PASS |
| 10 | Regression: smoke scripts for phases 4-8 re-run on final build | PASS |
| 10 | Smoke: patient edit, delete with confirmation (cascade), Assistant cannot delete, signed license rejected on a build without key | PASS |
| 10 | `npm run dev` serves `/` and `/patients` (HTTP 200) | PASS |

## Not tested
- Real phones/tablets (touch, keyboard-only, soft keyboard), screen readers, WCAG contrast audit, Safari/Firefox.
- Real printers (A4 and thermal via OS drivers), PDF in external viewers.
- Photo upload through a real file picker (only code path reviewed), large datasets/performance.
- Cross-tab IndexedDB behaviour, storage quota exhaustion, browser data eviction.

## npm audit triage (10 advisories: 9 high, 1 critical)
`npm audit fix` applies nothing; every remaining fix is a major upgrade, deferred as a separate task:
- **next 14.2.35 (critical)**: advisories concern self-hosted server features (Image Optimizer, RSC/Server Components DoS, rewrites, image cache). The app uses none of them (client-side, no rewrites, no `next/image` optimizer, no server actions) and native builds will be static exports. Fix = Next 16 (major). Recommended before any public server deployment.
- **postcss (via next)**: same upgrade path.
- **tailwindcss → chokidar/braces/micromatch/fast-glob**: build-time only (glob DoS via crafted patterns); not shipped to users. Fix = Tailwind 4 (major, config rewrite).
- **eslint-config-next → @next/eslint-plugin-next → glob (CLI command injection)**: dev tooling only; the vulnerable `glob` CLI is not invoked. Fix = eslint-config-next 16 (major, tied to Next 16).

## Security notes
- No authentication; roles are a UI convenience (Receptionist/Admin cannot see clinical pages, but data is readable via browser devtools).
- IndexedDB and backup files are unencrypted. Photos are stored as data URLs.
- Licensing verified client-side only; trial is local.
- No external network calls are made by the app (fonts are fetched by `next/font` at build time).
