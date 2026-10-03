# PROJECT CONTRACT — PetraDOC

Source of truth for scope: the master build prompt (keep a copy in `docs/MASTER-PROMPT.md`).

## Non-negotiables
- Web/npm only now. No APK/EXE builds yet.
- Next.js + TypeScript + Tailwind + Prisma/PostgreSQL architecture.
- No fake APIs, auth, sync, printers, payments or verification.
- BMDC/qualification info = user-provided, not verified.
- Any future AI feature: documentation/formatting/summarization only; never diagnose or prescribe.
- Licensing is separate from Doctor Profile; no hardcoded permanent key.
- Google Drive = backup destination, not primary DB.
- After each phase: update PROJECT-STATE.md and AUDIT.md, keep old features working, commit.
- Must always run: `npm install`, `npm run dev`, `npm run build`.
- Never weaken licensing, role or backup safeguards to make a test pass. Writes stay disallowed until the license status is known (fail closed).
- Keep `npm run e2e` (and `e2e:license`, `a11y`) green before committing; add a test for every new feature.
- Backups with patient data must offer encryption; unencrypted export must keep its warning.
- No service worker unless it is proven not to risk stale caches.
