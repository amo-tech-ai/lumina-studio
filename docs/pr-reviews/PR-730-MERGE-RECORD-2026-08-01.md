# PR #730 — Merge Record

**Task:** IPI-835 · ONB2-INT-001b0 — Shared brand analysis progress hook
**PR:** `IPI-835 · ONB2-INT-001b0 — Shared brand analysis progress hook` (#730)
**Merge SHA:** `f6640ac1567b9e342d384771c8dd4f43c42c7748` (squash, `main`)
**Author:** amo-tech-ai (Cursor co-author) · **Merged:** 2026-08-01 22:20:28 -0400

---

## Purpose

Extract one shared Realtime progress hook (`useBrandAnalysisProgress`) for Brand Hub, reused by the analysis-progress banner and intended for a future onboarding screen 12 integration (Slice B0 of the IPI-835 crawl/analysis Realtime work). The hook distinguishes a dropped/lost Realtime connection (`connection_lost`) from a server-reported failure (`failed`) so operators no longer see a quiet crawl or a dropped websocket rendered as "analysis failed." Terminal UX success is `intake_status = ready` only — `scores_complete` is treated as mid-pipeline (it still refreshes the RSC layout but keeps the progress banner visible).

This PR does **not** wire `/onboarding` sessions, replace screen 12's timer, call approve/promote, or delete `/app/onboarding` (explicitly out of scope, per sibling-PR table in the description: Slice A #718 merged, Slice B1 next, Slice C after B0+B1).

## Files / systems changed

- `app/src/lib/brand-hub/use-brand-analysis-progress.ts` — **new**. Exports `phaseForStatus`, `useBrandAnalysisProgress`, and the `CrawlPages` / `AnalysisProgressPhase` / `BrandAnalysisProgress` / `UseBrandAnalysisProgressOptions` types. Owns the Supabase Realtime subscription (`brands` UPDATE + `brand_crawls` events), a quiet-gap "still working" timer (default 30s, disabled when `quietGapMs <= 0`), `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` → `connection_lost` mapping, a `reconnect()` re-subscribe path, and an intake re-read on `SUBSCRIBED` to catch updates missed while disconnected.
- `app/src/components/brand-hub/analysis-progress-banner.tsx` — refactored to delegate all status/crawl/connection state to the new hook; adds optional `quietGapMs` prop; adds a `connection_lost` UI state with a "Reconnect" action; keeps `scores_complete` visible instead of hiding the banner.
- `app/src/components/brand-hub/brand-detail-workspace.tsx` — banner render condition changed from `status === "failed"` to `analysing || status === "failed"` so the banner (and its Realtime subscription) mounts for the full in-flight range, not just the failed state.
- `app/src/lib/brand-hub/use-brand-analysis-progress.test.ts` — **new** (200 lines), jsdom Vitest suite covering `phaseForStatus` precedence and hook behavior (connection errors, reconnect, `SUBSCRIBED` re-read, `onReady` firing on `ready` but not on `scores_complete` alone for UX phase).
- `app/src/components/brand-hub/analysis-progress-banner.test.tsx` — updated to mock the Supabase subscription status callback, assert `scores_complete` stays visible (previously hidden as terminal), and add connection-lost coverage (`CHANNEL_ERROR`, `CLOSED`) with a visible Reconnect control and no failure alert.
- Included a same-day follow-up fix (squashed into this merge, per PR commit history): cleared the quiet-gap timer on server prop refresh (`bumpActivity()` on crawl-prop sync) and removed an `eslint-disable react-hooks/exhaustive-deps` directive that referenced a rule not configured in this project, replacing it with explicit dependency arrays.

## Tests / CI results

- `npx vitest run --pool=threads --maxWorkers=1 src/lib/brand-hub/use-brand-analysis-progress.test.ts src/components/brand-hub/analysis-progress-banner.test.tsx` — author-reported 28/28 passing after the lint fix.
- PR test-plan checklist at merge time:
  - [x] Hook unit tests: `CHANNEL_ERROR` / `TIMED_OUT` → `connection_lost` (not `failed`)
  - [x] Hook unit tests: `onReady` fires on `ready` only, distinct from UX-phase handling of `scores_complete`
  - [x] Banner: connection-lost state shows Reconnect; `scores_complete` stays visible
  - [x] Banner: crawl page counts continue to update via Realtime
  - [ ] CI `app-build` green — not confirmed checked in the PR description at merge time
  - [ ] Manual: kill network during `analysis_running` → verify connection-lost UI in a live environment — not confirmed checked
- CI lint failure noted in PR comments (invalid `eslint-disable` for an unconfigured rule) was fixed in the same PR before merge.

## Production impact

Client-side only change to the Brand Hub analysis progress UI (`app/src/components/brand-hub/*`, `app/src/lib/brand-hub/use-brand-analysis-progress.ts`). No new database migrations, Supabase schema/grants, API routes, or infrastructure/config changes. Behavior change for operators: a lost Realtime connection during `analysis_running`/`crawl_running` now surfaces as "Connection lost" with a Reconnect action instead of no longer updating silently or reading as a failure; `scores_complete` now keeps the progress banner visible (with a "finishing up" message and a layout refresh) instead of hiding it as if the analysis were already terminal.

## Known limitations

- The 30s quiet-gap heuristic for "still working" is a client-side timer, not based on a server heartbeat or `updated_at` freshness — noted in-code as a candidate for a follow-up if operators see false "still working" states during long Gemini runs.
- Two of the PR's own test-plan checkboxes (CI `app-build` green; manual kill-network verification) were unchecked at merge time and are not independently re-verified by this record.
- This PR does not wire `/onboarding`, replace the screen 12 timer, or touch approve/promote — those are explicitly deferred to sibling PRs (Slice B1, Slice C).

## Rollback / cleanup notes

- Contained to `app/src/lib/brand-hub/use-brand-analysis-progress.ts` (new file) and the three consumer/test files listed above — revertable with `git revert f6640ac` if the new phase model needs to be rolled back.
- No feature flags, secrets, migrations, or deployment steps to clean up; no other call sites depend on the removed inline Realtime logic in `analysis-progress-banner.tsx` (it was fully inlined there before this PR).

## Follow-up tasks

- Slice B1: wire `/onboarding` session Realtime state to this same hook.
- Slice C: replace onboarding screen 12's timer with `useBrandAnalysisProgress`, after B0 + B1 land.
- Confirm CI `app-build` is green and complete the manual kill-network verification against a live environment (both left unchecked in the PR's own test plan).
- Consider replacing the fixed 30s quiet-gap timer with a server-heartbeat or `updated_at`-freshness signal if false "still working" states are observed during long Gemini analysis runs.