# Merge Record

**Task:** [IPI-903 · ONB2-INT-001b1 — Make Onboarding Materialization Safe Before Analysis and Deep Links](https://linear.app/amo100/issue/IPI-903) (slice B1)
**PR:** [#751](https://github.com/amo-tech-ai/lumina-studio/pull/751) — IPI-903 · ONB2-INT-001b1 — Make Onboarding Materialization Safe Before Analysis and Deep Links
**Merge SHA:** `d6825f209c85d05050fb1d322590b039e180e20b` (squash, `main`)
**Merged:** 2026-08-02T01:09:27-04:00
**Recorded:** 2026-08-02

## Squashed commits (folded into merge)

- `fix(ipi-903): make onboarding materialize safe before analysis deep links`
- `fix(ipi-903): harden commit guards, focus, and client reuse`
- `fix(ipi-903): persist analysis screen in materialize RPC`
- `test(ipi-903): cover materialize screen heal, failure, and tenant deny`
- `fix(ipi-903): route createClient failures into bootstrap retry`

## Purpose

Operators finishing public onboarding (brand name → Continue → analysis loader → DNA payoff)
were one failed RPC or a `#12` bookmark away from a stuck analysis screen with no brand, or
saw raw database constraint text in the UI. This PR keeps the `/onboarding` happy path honest:
no analysis theater without a real brand row, and a clear retry when session load or setup
fails.

**Single concern:** onboarding materialization safety. Does **not** ship Realtime crawl
progress on screen 12 (sibling **IPI-835 · ONB2-INT-001 — Realtime progress on screen 12**,
PR #750) and does not harden autosave ordering, pagehide flush, screen-13 server persistence,
or localStorage fallbacks (deferred to a follow-up).

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/components/onboarding/flow-footer.tsx` | Adds `navigationDisabled` prop; Back/Skip get native `disabled` + styling while a commit is in flight |
| `app/src/components/onboarding/onboarding-flow.tsx` | Adds `initialBrandId`; bounces deep-linked screen ≥12 without a brand back to the pre-analysis screen; ignores stale materialize results after navigation; rejects missing brand ids; formats failures via `toUserFacingOnboardingError`; blocks Continue on empty brand name; disables Skip/footer nav while committing |
| `app/src/components/onboarding/onboarding-session-gate.tsx` | Focuses the error panel on bootstrap failure; adds a "Try again" button wired to `session.retry`; passes `session.brandId` as `initialBrandId` |
| `app/src/lib/onboarding/onboarding-errors.ts` *(new)* | `ONBOARDING_BRAND_NAME_REQUIRED` constant and `toUserFacingOnboardingError(err, kind)` — dev-logs raw errors, maps missing-brand-name to actionable copy, otherwise returns a safe session/setup retry message |
| `app/src/lib/onboarding/use-onboarding-session.ts` | Adds `retry()`; reuses one Supabase browser client across retries (client creation moved inside the bootstrap try/catch); rejects blank `brandName` before any RPC call; flushes only draft answers pre-materialize (no longer force-writes `current_screen = 12` before the RPC succeeds); skips draft autosave once a session is `materialized` |
| `supabase/migrations/20260802043000_ipi903_materialize_persist_analysis_screen.sql` *(new)* | Replaces `materialize_onboarding_session(text, text, text)`: sets `current_screen = 12` atomically with `status`/org/brand IDs on first materialize; replay path heals legacy materialized sessions stuck below screen 12 |
| `supabase/tests/database/008_onboarding_sessions.sql` | pgTAP plan 17 → 22: adds persisted-screen assertion on success, atomic-failure screen assertion, replay-heal assertion, and a stranger-cannot-heal tenant-isolation assertion |
| `app/src/components/onboarding/onboarding-flow.test.tsx` / `onboarding-history.test.tsx` / `app/src/lib/onboarding/use-onboarding-session.test.ts` / `onboarding-errors.test.ts` *(new)* | Test coverage for the above (see Tests below) |

## Tests / CI at merge

- Focused vitest — **54 tests green** (per PR test plan):
  `src/lib/onboarding/use-onboarding-session.test.ts`,
  `src/lib/onboarding/onboarding-errors.test.ts`,
  `src/components/onboarding/onboarding-flow.test.tsx`,
  `src/components/onboarding/onboarding-history.test.tsx`
- `npm run lint` / `npm run typecheck` / `npm run build` — green (per PR test plan)
- pgTAP `supabase/tests/database/008_onboarding_sessions.sql` — plan raised **17 → 22**
  asserts (persisted-screen, atomic-fail screen, replay-heal, stranger-heal-deny)
- Manual checks left unchecked in the PR description at merge time (not independently
  re-verified by this record):
  - Deep-link `/onboarding#12` with draft-only session lands on screen 11
  - Continue with empty/skipped brand name is safely rejected, stays off analysis
  - Bootstrap error → Try again recovers
  - No Slice C Realtime / crawl-kickoff changes in the diff

## Production impact

- New migration `20260802043000_ipi903_materialize_persist_analysis_screen.sql` replaces
  `public.materialize_onboarding_session(text, text, text)` — same signature, additive
  behavior (persists `current_screen = 12` on materialize; heals legacy rows on replay).
  No application code path changes required beyond what ships in this PR.
- Client behavior: deep links to `/onboarding#12` or `#13` without a materialized brand no
  longer render the analysis timer or DNA payoff — they redirect to the pre-analysis screen
  (11) until Continue successfully materializes a brand.
- Error copy: session-load and setup failures now show a generic safe message
  (`onboarding-errors.ts`) instead of raw Supabase/RPC text; raw errors still log to the
  console in development only.
- Bootstrap failures now expose a visible "Try again" action (`onboarding-session-retry`)
  that reuses the existing Supabase browser client rather than constructing a second one.

## Known limitations

- Realtime crawl progress on screen 12 is out of scope — sibling
  **IPI-835 · ONB2-INT-001 — Realtime progress on screen 12** (PR #750).
- Autosave ordering, `pagehide` flush, screen-13 server-side persistence, and localStorage
  fallbacks are explicitly deferred to a follow-up PR.
- Screen 13 (payoff) remains local-only state; only screen 12 is persisted atomically by the
  materialize RPC.
- Manual verification steps in the PR test plan were unchecked at merge time; this record
  does not assert independent re-execution of those manual checks.

## Rollback / cleanup notes

- App code (`flow-footer.tsx`, `onboarding-flow.tsx`, `onboarding-session-gate.tsx`,
  `onboarding-errors.ts`, `use-onboarding-session.ts`) is a straight `git revert d6825f2` if
  needed — no schema dependency in that direction.
- Migration rollback: recreate `materialize_onboarding_session` from the prior definition in
  `20260801051934_onboarding_sessions_and_materialize_rpc.sql` (the version that omits
  `current_screen` from the `UPDATE`), per the rollback note embedded in
  `20260802043000_ipi903_materialize_persist_analysis_screen.sql`. Do this only after
  reverting the app code that now depends on `current_screen` being set post-materialize.
- No secrets, feature flags, or out-of-band deployments introduced.

## Follow-up tasks

- **IPI-835 · ONB2-INT-001 — Realtime progress on screen 12** (PR #750) — Slice C Realtime
  crawl progress, sibling to this PR.
- Harden autosave ordering, `pagehide` flush, screen-13 server persistence, and localStorage
  fallbacks (explicitly deferred by this PR's description).
- Independently execute the four unchecked manual verification steps from the PR test plan
  (deep-link `#12` draft-only, empty brand-name rejection, bootstrap Try-again recovery, and
  confirming no Slice C changes leaked into this diff).