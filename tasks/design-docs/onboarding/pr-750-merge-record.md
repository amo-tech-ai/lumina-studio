# Merge Record

**Task:** [IPI-835 · ONB2-INT-001 — Realtime progress on onboarding screen 12](https://linear.app/amo100/issue/IPI-835) (slice C)
**PR:** [#750](https://github.com/amo-tech-ai/lumina-studio/pull/750) — IPI-835 · ONB2-INT-001 — Realtime progress on onboarding screen 12
**Merge SHA:** `81a1aa885973b5deb3f1fcab176e048ec145e295` (merged to `main`)
**Merged:** 2026-08-02T02:10:58-04:00
**Recorded:** 2026-08-02

## Squashed commits (folded into merge)

- `feat(ipi-835): drive onboarding screen 12 from Realtime crawl progress (C)`
- `fix(ipi-835): drop unknown eslint-disable directives in screen 12`
- `fix(ipi-835): blank website skip, BI claim CAS, screen 12 tests`
- `fix(ipi-835): failed listen-only, website recovery, kickoff settle race`

## Purpose

On `/onboarding` screen 12, replaces the client-side `setInterval` progress bar (which could hit 100% while Firecrawl/Gemini were still running, or fail silently) with server-driven progress. After the brand is materialized, the screen starts or reuses a real crawl, shows live page counts from `brand_crawls`, and advances to DNA review only when the server reports the analysis is reviewable (`scores_complete` / `draft_ready` / `ready`). Connection loss is presented distinctly from a terminal server `failed` state; client-side kickoff failures keep a Retry control, while a server-side `failed` status is listen-only and points operators to Brand Hub.

**Single concern:** `/onboarding` screen 12 Realtime + crawl kickoff (IPI-835 · C). No DNA approval / promote-to-ready (slice D), no retirement of `/app/onboarding` (slice E, after IPI-836), and no Brand Hub banner changes beyond reusing the existing shared progress hook.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/components/onboarding/analysis-progress-screen.tsx` | Replaced the timer placeholder with `useBrandAnalysisProgress`-driven progress; added props `brandId`, `answers`, `onEditWebsite`, `quietGapMs`; added `isAnalysisReviewable` gate, crawl page-count label, distinct `connection_lost` / server `failed` UI, blank-website recovery UI, and Retry for client kickoff failures |
| `app/src/lib/onboarding/kickoff-onboarding-analysis.ts` (new) | `isAnalysisReviewable`, `kickoffOnboardingCrawl` (idempotent crawl start keyed by `onboarding-${brandId}`, reuses in-flight crawls, listens-only on `analysis_running`/`failed`), `startOnboardingBrandIntelligence` (compare-and-swap claim of `intake_status = analysis_running` before invoking BI, with claim release on invoke failure) |
| `app/src/components/onboarding/onboarding-flow.tsx` | Passes `brandId` and `answers` into `AnalysisProgressScreen`; screen 12 still mounted via `replaceScreen`, not `push` |
| `app/src/app/(onboarding)/onboarding/page.tsx` | Doc-comment update noting slice B+C landed, slice D next |
| `app/src/components/onboarding/analysis-progress-screen.test.tsx` (new) | Vitest/jsdom coverage: missing brand, kickoff + page counts, reconnect, server failure, `scores_complete` completion, BI start (success/failure/deferred), blank-URL recovery, and confirms no client interval decides success |
| `app/src/lib/onboarding/kickoff-onboarding-analysis.test.ts` (new) | Vitest coverage: reviewable/listen-only classification, needs-website, idempotent crawl start/reuse, crawl-failure fallthrough to BI, CAS claim + release on BI failure |
| `app/src/components/onboarding/onboarding-flow.test.tsx`, `onboarding-history.test.tsx` | Mock `AnalysisProgressScreen` (real component is unit-tested separately); auto-complete 20ms after `brandId` is set, replacing the old `40 * 110ms` timer-advance assertions |

## Tests / CI at merge

- Focused Vitest: kickoff + `analysis-progress-screen` + `onboarding-flow` / `onboarding-history` + Brand Hub progress helpers — reported passing (91 tests per PR objectives)
- `cd app && npx tsc --noEmit` — clean
- CI: `app-build`, `supabase-web015`, `cloudflare-worker-tests`, `supabase-verify-rls` (+ e2e gates) — green
- Vercel preview deploy — completed
- Manual verification (optional, left unchecked on the PR): materialize → screen 12 shows crawl counts; kill network → connection-lost ≠ failed; resume mid-crawl does not double-start

## Production impact

Client/UI + lib change only — no migrations, no new edge functions. `kickoffOnboardingCrawl` and `startOnboardingBrandIntelligence` call the existing `invokeStartBrandCrawl` / `invokeBrandIntelligence` helpers already used elsewhere (e.g. Brand Hub), scoped with an onboarding-specific idempotency key (`onboarding-${brandId}`). Depends on the `brands` Realtime publication shipped in slice A ([#718](https://github.com/amo-tech-ai/lumina-studio/pull/718), `10db146d`) via the shared `useBrandAnalysisProgress` hook from slice B0 ([#730](https://github.com/amo-tech-ai/lumina-studio/pull/730)).

## Known limitations

- DNA approval / promote-to-ready (slice D) is not implemented — reviewable analysis just hands off to the payoff screen
- Legacy `/app/onboarding` is unchanged and not retired (slice E, after IPI-836)
- Brand Hub banner behavior is unchanged beyond reusing the shared progress hook
- Optional manual verification (live crawl counts, offline handling, no double-start on resume) was not checked off on the PR before merge

## Rollback / cleanup notes

No schema or edge-function changes shipped in this PR, so rollback is a plain revert of merge commit `81a1aa885973b5deb3f1fcab176e048ec145e295` (or redeploy of the prior build) with no DDL or data cleanup required. Reverting restores the client-timer placeholder on screen 12; any crawls already started via `kickoffOnboardingCrawl` continue server-side unaffected, since crawl/BI kickoff reuses the pre-existing `start-brand-crawl` / brand-intelligence edge functions rather than new ones.

## Follow-ups

- Slice D — DNA approval + promote-to-ready / recovery (next, per PR sibling table)
- Optional manual QA pass (materialize → live counts, offline vs failed, resume idempotency) called out but not completed before merge