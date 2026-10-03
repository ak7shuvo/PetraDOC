# PROJECT STATE

## Current phase
Phase 1 — Foundation (scaffold only, not yet verified with npm install/build)

## Completed
- Project structure, config (Next.js, TS, Tailwind with design tokens)
- Prisma schema draft
- App shell (sidebar + mobile bottom nav), dashboard skeleton, placeholder routes
- Architecture seams: Repository, licensing, printing, backup, platform types

## Remaining
- Phases 1 (finish) – 10 per master prompt

## Known issues
- Not yet run: `npm install`, `npm run build` (must verify first in the next session)

## Architecture decisions
- Features live in `src/features/*`; storage via `Repository<T>` interface
- Native capabilities behind `src/platform` (web fallback first)

## Next steps
1. Run `npm install && npm run build`, fix errors
2. Finish Phase 1 dashboard, then Phase 2 (Doctor Profile + Chambers)
