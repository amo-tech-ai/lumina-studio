# IPI-17 · Command Center workspace parity — verification evidence

**Date:** 2026-07-01  
**Branch:** `ipi/17-command-center`  
**Worktree:** `../wt-ipi-17-command-center`

## Summary

Replaced legacy 5-card workspace grid with DC-aligned portfolio dashboard:

- Realtime status strip
- Portfolio hero + Production Planner greeting + quick action chips
- Recent work moodboard row (Supabase `shoot_portfolio_view`)
- Approval section (featured `ApprovalCard` or fallback count)
- State model: loading · empty · normal · populated · approval · error

## Verification

| Check | Result |
|-------|--------|
| `cd app && npm run lint` | ✅ pass |
| `cd app && npm test` | ✅ 503 passed (incl. `derive-view-state.test.ts`) |
| `cd app && npx tsc --noEmit` | ✅ pass |
| `npm run build` | ⚠️ fails at page-data collect without `DATABASE_URL` (pre-existing Mastra env; TS compile green) |

## Manual browser smoke (2026-07-01, localhost:3003)

| Route | Result | Notes |
|-------|--------|-------|
| `/app?skip=1` | ✅ | Hero “You're working with Nike.”, Recent work row (2 tiles), quick-action chips, Production Planner greeting, nav + intel panel; no error banner |
| `/app` (no session) | ✅ expected | Error banner + Retry (KPI fetch requires auth) |
| `/app` (QA authed) | ⚠️ blocked | Login failed — worktree dev on :3003 missing Infisical-injected Supabase env; not a CC regression |
| Zero brands → onboarding | ✅ code | `page.tsx` redirects when `zeroBrands` → `/app/onboarding` (IPI-11) |
| Console errors | ✅ none observed | CDP/a11y snapshot on `?skip=1`; no React error overlay |

Mobile 375px layout not smoke-tested (IPI-251 out of scope).

## Screenshots

Deferred — browser screenshot capture returned blank in automation; a11y snapshot + CDP DOM checks used instead.

## Remaining gaps

- Mobile bottom tabs + intel sheet (IPI-251)
- PersistentChatDock in center column (IPI-275)
- Full approval queue / large HITL DC card (IPI-244)
- Live Realtime strip wiring (UI states only today)
- Wire `shootCount` / KPI into `operator-panel` welcome context (optional follow-up)
