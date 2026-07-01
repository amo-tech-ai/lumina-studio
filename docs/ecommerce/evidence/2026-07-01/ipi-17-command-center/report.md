# IPI-17 · Command Center workspace parity — verification evidence

**Date:** 2026-07-01  
**Branch:** `ipi/17-command-center`  
**Worktree:** `../wt-ipi-17-command-center`  
**Preview:** `infisical run --` + `app/.env.local` · `localhost:3005`

## Summary

Replaced legacy 5-card workspace grid with DC-aligned portfolio dashboard:

- Realtime status strip
- Portfolio hero + Production Planner greeting + quick action chips
- Recent work moodboard row (Supabase `shoot_portfolio_view`)
- Approval section (featured `ApprovalCard` or fallback count)
- State model: loading · empty · normal · populated · approval · error

## Automated verification

| Check | Result |
|-------|--------|
| `cd app && npm run lint` | ✅ pass (2026-07-01) |
| `cd app && npm test` | ✅ 503 passed (incl. `derive-view-state.test.ts` ×10) |
| `cd app && npx tsc --noEmit` | ✅ pass |
| `CI=true npm run build` | ✅ pass |

## Live Supabase smoke (`qa@ipix.test`)

**Env:** `cp app/.env.local` into worktree + `infisical run -- npx next dev -p 3005`

| Route | Result | Notes |
|-------|--------|-------|
| `/app` (authed) | ✅ | Hero **Maaji** · 91% DNA · shoot **Commit Verify Run** (planning, Jun 28) · recent-work row · quick-action chips |
| Live KPI snapshot | ✅ | `brandCount: 1` · `shootCount: 1` · `pendingApprovalCount: 0` · hero brand Maaji |
| `/app?skip=1` | ✅ | Nike dev fixture · 2 recent-work tiles · no error banner |
| Zero brands → onboarding | ✅ code | `page.tsx` redirects when `zeroBrands` → `/app/onboarding` (IPI-11) |
| Console errors | ✅ clean | No React overlay; no app-level console errors on `/app` or `?skip=1` |

### Approval-first state

| Check | Result |
|-------|--------|
| QA pending drafts | **0** — `brand_intake_drafts` empty for `qa@ipix.test` |
| Live UI | Populated view (not `wsApproval`); intel panel shows **Approvals → No pending brand drafts** |
| `derive-view-state` unit tests | ✅ `pendingApprovalCount > 0` → `approval` view + `showApprovalBlock` |

Remote DB has `pending` drafts on RLS test users only (not QA). Approval-first **live** screenshot deferred until QA seed or account with pending drafts.

## Screenshots

| File | Description |
|------|-------------|
| [screenshots/live-app-populated-desktop.png](./screenshots/live-app-populated-desktop.png) | Authed `/app` — Maaji hero + live KPIs |
| [screenshots/dev-preview-skip1-desktop.png](./screenshots/dev-preview-skip1-desktop.png) | `?skip=1` — Nike dev fixture + recent work |

## Remaining gaps (out of scope)

- Mobile bottom tabs + intel sheet (IPI-251)
- PersistentChatDock in center column (IPI-275)
- Full approval queue / large HITL DC card (IPI-244)
- Live Realtime strip subscription (UI states only today)
- Wire `shootCount` / KPI into `operator-panel` welcome context (optional follow-up)
- Live approval-first screenshot when QA has pending drafts
