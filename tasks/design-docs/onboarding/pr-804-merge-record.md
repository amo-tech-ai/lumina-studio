# Merge Record

**Task:** [IPI-945 · ONB2-ROUTE-001 — Send first-time users to the new onboarding (not the old wizard)](https://linear.app/amo100/issue/IPI-945)
**PR:** #804 — IPI-945 · ONB2-ROUTE-001 — Send first-time users to the new onboarding (not the old wizard)
**Merge SHA:** `cf9b0e9d5a7376663b0ff887cad9354fedbea731` (squash, `main`)
**Merged:** 2026-08-03 22:33:45 -0400
**Recorded:** 2026-08-04

## Squashed commits (folded into merge)

- `fix(ipi-945): cut over zero-brand entry to standalone /onboarding`
- `test(copilotkit): clear MASTRA_DATABASE_URL in storage_unavailable case`
- `chore(pr-804): drop MASTRA storage-test stub owned by IPI-946`
- `fix(pr-804): address review — fresh Add brand, legacy migrate, sign-out`

## Purpose

First-time, zero-brand operators were still routed to the legacy `/app/onboarding` 3-step wizard inside the operator shell (sidebar + Copilot "Complete onboarding" bar). This PR cuts that path over to the standalone Zeely v2 flow at `/onboarding` and scopes the browser onboarding idempotency token per signed-in user, so switching accounts can no longer resume another user's local draft key.

**Single concern (per AGENTS.md #1):** `/app/onboarding` → `/onboarding` cutover + user-scoped idempotency key. The pre-push `MASTRA_DATABASE_URL` test stub (same env flake as sibling #803) rode along as the PR's declared 2nd commit; CopilotKit dual-auth work is explicitly out of scope (tracked separately as IPI-944).

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/middleware.ts` | Redirects legacy `/app/onboarding` (and subpaths) to `/onboarding` before the auth gate, preserving refreshed session cookies |
| `app/src/app/(operator)/app/onboarding/page.tsx` | Legacy 3-step wizard (271 lines) replaced with a server-side `redirect("/onboarding")` |
| `app/src/app/(operator)/app/page.tsx` | Zero-brand redirect target changed from `/app/onboarding` to `/onboarding` |
| `app/src/app/(onboarding)/onboarding/page.tsx`, `onboarding-sign-out.tsx` (new), `onboarding.css` | Added `OnboardingSignOut` control for the standalone route (outside `(operator)` chrome) |
| `app/src/lib/onboarding/idempotency-key.ts`, `use-onboarding-session.ts` | Idempotency key now scoped per `userId`; legacy browser-global key migrated then cleared; added `rotateOnboardingIdempotencyKey`, `wantsFreshOnboardingSession`, `stripFreshOnboardingQueryFromUrl` for `?new=1` Add-brand flow |
| `app/src/components/brand-hub/brand-list-workspace.tsx`, `command-center/command-center-empty.tsx`, `intelligence-panel/intelligence-panel.tsx` | CTAs updated to `/onboarding` (zero-brand) or `/onboarding?new=1` (existing brands) |
| `app/src/lib/route-agent-map.ts` | Added standalone `/onboarding` → `brand-intelligence` mapping alongside the existing `/app/onboarding` entry |
| `app/src/lib/onboarding/idempotency-key.test.ts`, `route-agent-map.test.ts`, `middleware-auth-gate.test.ts`, `middleware.ts`, `test/onboarding-orchestration.test.ts`, `test/onboarding.test.ts`, `test/operator-middleware-contract.test.ts` | Test coverage for redirect, user-scoped key isolation/migration, route mapping, and middleware contract |

No Supabase schema/data changes, no crawl/DNA analysis changes, no CopilotKit dual-auth changes.

## Tests / CI at merge

- Focused Vitest — idempotency key, middleware gate, middleware contract, onboarding orchestration/route map: **78 tests** (per PR description)
- Full pre-push suite green after the `MASTRA_DATABASE_URL` stub fix
- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `curl -sI /app/onboarding` → `307` + `Location: /onboarding` — verified
- Chrome manual check: `/app/onboarding` → `/onboarding` renders `data-testid="onboarding-shell"` with no operator chat chrome — verified
- **Unchecked at merge (manual, pending):**
  - Brand-new / zero-brand account sees Step 1; user with brands stays on `/app` Command Center
  - Sign out → `/onboarding` → `/login` when auth gate is on

## Production impact

- All `/app/onboarding` traffic (bookmarks, Brand Hub/Command Center/Intelligence Panel CTAs) now 307-redirects to `/onboarding` at the middleware layer, before the auth gate — affects every environment where the middleware runs.
- Onboarding idempotency draft keys stored in `localStorage` are migrated from the single legacy browser-global key into a per-`userId` key on next load; the legacy key is cleared afterward. Existing in-progress drafts are preserved for the first user who loads them post-deploy.
- No database writes, migrations, or RLS changes — UI/routing layer only.

## Known limitations

- Does not wipe existing onboarding rows in Supabase.
- Does not change crawl or brand-DNA analysis behavior.
- Does not complete the full Slice-E end-to-end proof for every onboarding screen.
- Does not touch CopilotKit dual-auth (tracked separately as IPI-944).
- Two manual verification checkboxes were still open at merge time (zero-brand Step 1 display / existing-brand routing; sign-out → `/login` when the auth gate is on) — not independently re-verified for this record.

## Rollback / cleanup notes

- Revertable as a single PR (`git revert cf9b0e9`) — no migrations, feature flags, or secrets to unwind.
- Reverting restores the legacy `/app/onboarding` 3-step wizard and the browser-global (non-user-scoped) idempotency key; any drafts created under the new per-user key scheme after this merge would need to be re-migrated back if a revert is done after users have onboarded under the new scheme.

## Follow-up tasks

- Complete the two pending manual verification checks (zero-brand Step 1 / existing-brand routing; sign-out → `/login` gate behavior).
- Sibling #803 — Copilot: strip operator Bearer from model headers (AI dual-auth, IPI-944) — separate PR, not included here.
- IPI-946 owns the MASTRA storage-test stub that was deliberately dropped from this PR's head per commit `chore(pr-804): drop MASTRA storage-test stub owned by IPI-946`.
- Resolve remaining CodeRabbit review threads noted as outstanding on the PR's final head (author reported 3 threads pending resolution before merge).