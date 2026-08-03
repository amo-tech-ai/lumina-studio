# Merge Record

**Task:** [IPI-925 · ONB2-AUTH-001 — Keep /onboarding open while Google sign-in cookies finish loading](https://linear.app/amo100/issue/IPI-925)
**PR:** [#785](https://github.com/amo-tech-ai/lumina-studio/pull/785) — IPI-925 · ONB2-AUTH-001 — Keep brand setup open while Google sign-in cookies finish loading
**Merge SHA:** `31cec6a499ba630e0ea79c03011784a6370f6bfd` (squash-merged to `main`)
**Merged:** 2026-08-03T16:00:10-04:00
**Recorded:** 2026-08-03

## Squashed commits (folded into merge)

- `fix(ipi-925): wait for auth hydrate before failing /onboarding` — wait for `SIGNED_IN` or a timed `getSession` re-check instead of trusting a null `INITIAL_SESSION`; show Sign in only when truly unauthenticated; stop `console.error` on the expected signed-out path.
- `fix(ipi-925): harden onboarding auth hydrate edge cases` — reject unvalidated hydrated users, route mid-flow auth loss to the Sign in gate, treat `getSession` refresh failures as retryable (`ONBOARDING_AUTH_TRANSIENT`) instead of signed-out.

## Purpose

Fixes an auth hydration race on Design V2 `/onboarding`: after Google sign-in, Supabase often emits a null `INITIAL_SESSION` before cookies finish hydrating, which was previously treated as signed-out and surfaced as a console crash (`Auth session missing!` / `ONBOARDING_AUTH_REQUIRED`) even though the sign-in had succeeded. Operators now see the flow keep loading through hydration and only land on a **Sign in** CTA when authentication is genuinely unavailable.

**Single concern:** `/onboarding` auth session hydrate race. Does not touch legacy `/app/onboarding`, CopilotKit org gates, or Brand DNA approval.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/lib/onboarding/resolve-onboarding-auth-user.ts` (new) | `resolveOnboardingAuthUser()` — waits for `SIGNED_IN`/`TOKEN_REFRESHED` or a timed `getSession` re-check before concluding signed-out; validates hydrated sessions via `getUser()`; exports `ONBOARDING_AUTH_REQUIRED` / `ONBOARDING_AUTH_TRANSIENT` |
| `app/src/lib/onboarding/onboarding-errors.ts` | Re-exports the two auth constants; adds `isOnboardingAuthError` / `isOnboardingAuthTransient`; maps auth-required to a Sign-in message, auth-transient to the existing retry message; suppresses dev `console.error` for the expected signed-out path |
| `app/src/lib/onboarding/use-onboarding-session.ts` | Bootstrap and `materialize()` now call `resolveOnboardingAuthUser` (configurable hydrate timeout); `SessionBootstrap` error state gained `authRequired?: boolean`; auth loss mid-materialize flips the gate to Sign in instead of a generic retry |
| `app/src/components/onboarding/onboarding-session-gate.tsx` | Renders a **Sign in** link (`/login?redirect=/onboarding`) instead of **Try again** when `session.authRequired` is true; heading changes to "Sign in to continue" |
| `app/src/lib/onboarding/onboarding-errors.test.ts` | New coverage for the auth-required vs auth-transient message/classifier split |
| `app/src/lib/onboarding/use-onboarding-session.test.ts` | New coverage: hydrate-timeout signed-out path, null `INITIAL_SESSION` not treated as final, `getUser` race recovery, rejection of unvalidated hydrated users, transient `getSession` refresh kept retryable, auth loss during `materialize()` flips to Sign in |

## Tests / CI at merge

- Author-reported at PR open: `cd app && npx vitest run src/lib/onboarding/use-onboarding-session.test.ts src/lib/onboarding/onboarding-errors.test.ts` — **14/14 PASS**
- Author-reported after the hardening commit (`819c2149` per PR comments): same suite — **18/18 PASS** (4 new cases: unvalidated hydrated user, mid-materialize auth loss, transient refresh, and the added classifier assertions)
- Pre-push fast gate: reported green by the author
- Manual verification:
  - ✅ Signed-out `/onboarding` → "Sign in to continue" + Sign in CTA, no `ONBOARDING_AUTH_REQUIRED` console.error
  - ✅ `qa@ipix.test` email login → `/onboarding#1` Step 1 / "Build your fashion brand with AI"
  - ⬜ **Not completed before merge:** Google sign-in → redirect `/onboarding` → Step 1 without "Auth session missing" (checkbox left unchecked in the PR test plan)

## Production impact

Client-side only (no migration, no RPC, no infra change). Changes the onboarding session hook's bootstrap/materialize auth path and the error panel of `OnboardingSessionGate`. Adds a fixed `AUTH_HYDRATE_MS` (2500ms) wait before concluding a user is signed out on `/onboarding`, and a corresponding `hydrateTimeoutMs: 0` pass at `materialize()` time (no wait — auth loss mid-flow fails immediately to the Sign in gate). Legacy `/app/onboarding`, CopilotKit org gates, and Brand DNA approval are explicitly untouched.

## Known limitations

- **Manual Google OAuth verification was not completed before merge** — the one test-plan item that exercises the actual race this PR fixes (`Google sign-in → redirect /onboarding → Step 1 without Auth session missing`) is unchecked in the PR description.
- The 2500ms `AUTH_HYDRATE_MS` default is a fixed timeout, not event-driven completion; slow cookie hydration beyond that window still routes to the Sign in gate rather than the ready flow.
- `isOnboardingAuthError` pattern-matches on `/auth session missing/i` and `/not authenticated/i` message text in addition to the `ONBOARDING_AUTH_REQUIRED` sentinel — any future GoTrue message wording changes could silently stop being classified as auth-required.

## Rollback / cleanup notes

No database objects or infra were touched — rollback is a plain revert of the merge commit `31cec6a499ba630e0ea79c03011784a6370f6bfd` (or the two squashed commits) on `main`. No follow-up data cleanup is required. Reverting restores the prior behavior of failing immediately on a null session and always showing **Try again**.

## Follow-ups

- Complete the outstanding manual Google sign-in verification against a real Supabase project (only test-plan item left unchecked at merge).
- No new Linear tickets were opened from this PR's comments; the hardening (getUser validation, mid-flow auth loss, transient-refresh handling) was folded into this same PR as a second commit rather than deferred.