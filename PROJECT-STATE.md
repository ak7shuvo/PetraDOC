# PROJECT STATE

## Current phase
Phase 1 complete (foundation, UI kit, shell, dashboard). Phases 2-3 in progress this session.

## Completed
- Scaffold verified: `npm install`, `npm run typecheck`, `npm run build` all pass.
- Storage: `Repository<T>` (src/lib/repository.ts) + Dexie/IndexedDB implementation (src/lib/dexie-repository.ts). App works with no server. `src/lib/repositories.ts` is the single place storage is obtained; UI/services never import Dexie.
- Auth seam: role permission matrix + local "Active role" selector (src/features/auth). **No login/authentication exists; real auth is pending.** Role gating is UI-only, not a security boundary.
- UI kit (src/components/ui): Button, Input, Select, Textarea, Card, Modal (native `<dialog>`), Badge, EmptyState, Toast.
- Responsive shell: sidebar (desktop), bottom nav + "More" (mobile), 44px targets.
- Dashboard: real counts from repositories, recent consultations, quick actions, empty states.

## Remaining
- Phase 2 (Doctor Profile + Chambers), Phase 3 (Patients), then Phases 4-10 per master prompt.

## Known issues
- Dashboard "Today's appointments"/"Follow-ups"/"Recent consultations" read real repos but stay 0 until Phases 4/7 create data.
- IndexedDB is per-browser/device; no backup yet (Phase 9).

## Architecture decisions
- Web-first Dexie storage; prisma/schema.prisma kept as future server target, NOT wired.
- Features in `src/features/*`; native capabilities behind `src/platform`.
- Detail/edit pages use query params (`/patients/detail?id=`) rather than dynamic segments, keeping static-export (Capacitor/Tauri) compatibility.

## Dependencies added
- `dexie` — IndexedDB wrapper for the web repository implementation (local-first, no server needed). No form/validation library: validation is small hand-written functions.

## Next steps
1. Phase 2, 3, then Phase 4 (Consultation + vitals).
