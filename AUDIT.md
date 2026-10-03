# AUDIT

| Date | Phase | Check | Result |
|------|-------|-------|--------|
| 2026-10-03 | 0 | npm install / typecheck / build on scaffold | PASS |
| 2026-10-03 | 1 | typecheck, build | PASS |
| 2026-10-03 | 2 | typecheck, build | PASS |
| 2026-10-03 | 2 | Headless Chromium smoke (390px): save profile + education + chamber, reload persists, preview renders | PASS |
| 2026-10-03 | 3 | typecheck, build | PASS |
| 2026-10-03 | 3 | Headless smoke: create patient (PD-000001), invalid-mobile blocked, search by name/mobile/ID, empty state, dashboard count | PASS |
| 2026-10-03 | 4 | typecheck, build | PASS |
| 2026-10-03 | 4 | Headless smoke: create consultation from patient page, BMI 22.9, Rx page renders, dashboard counts + patient timeline update | PASS |
| 2026-10-03 | 5 | typecheck, build | PASS |
| 2026-10-03 | 5 | Headless smoke: add medicine+favourite, add via search, manual item, save template, Rx renders w/ footer, copy previous Rx, apply template, Rx list | PASS |
| 2026-10-03 | 6 | typecheck, build | PASS |
| 2026-10-03 | 6 | Headless smoke: add tests+category grouping, panel, order panel+search+manual in consultation, appear on Rx | PASS |
| 2026-10-03 | 7 | typecheck, build | PASS |
| 2026-10-03 | 7 | Headless smoke: 2 doctors, 2 bookings (tokens 1,2), check-in, start consultation → appointment Done, overdue follow-up listed then booked (token 3), dashboard counts, patient timeline | PASS |
| 2026-10-03 | 8 | typecheck, build | PASS |
| 2026-10-03 | 8 | Headless smoke: PDF download (A4 + thermal 80, valid %PDF), thermal width 302px (80mm), print media hides nav/toolbar, PDF page visually inspected | PASS |
| 2026-10-03 | 8 | Real printers (A4/thermal via OS drivers), PDF in Acrobat/phone viewers | NOT RUN |
| 2026-10-03 | 1-3 | Real-device touch/keyboard/a11y review, photo upload via file picker, Android/iOS browsers | NOT RUN |

## Known issues
- Role gating is UI-only; no authentication (by design until real auth exists).
- `npm audit` reports advisories in the Next 14 / transitive deps; not triaged yet.
