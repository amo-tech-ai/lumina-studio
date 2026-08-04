# Merge Record

**Task:** [IPI-919 · ONB2-INT-001f — Retire Legacy Re-Analyze Path and Keep One Safe Recovery Action](https://linear.app/amo100/issue/IPI-919)
**PR:** [#822](https://github.com/amo-tech-ai/lumina-studio/pull/822) — IPI-919 · ONB2-INT-001f — Retire Legacy Re-Analyze Path and Keep One Safe Recovery Action
**Merge SHA:** `addb55583fbeb8c47c20bbc033ed472ffc30ec04` (squash, `main`)
**Branch:** `ipi/919-one-recovery-path`
**Merged:** 2026-08-04T13:14:46Z
**Recorded:** 2026-08-04

## Purpose

Removes the legacy Brand Intelligence **Re-analyze** recovery path and leaves exactly one
safe recovery action: `POST /api/brands/[id]/restart-analysis`. That endpoint is stage-aware —
it reuses a completed website crawl when only Brand Intelligence failed, instead of paying for
another Firecrawl crawl. This continues the onboarding failure-recovery sequence started by
**IPI-905 · ONB2-INT-001d** (#767) and **IPI-918 · ONB2-INT-001e** (#776).

## Files / systems changed

| Area | Change |
| --- | --- |
| `app/src/app/(operator)/app/brand/[id]/actions.ts` | Removed the `reanalyzeBrand` Server Action and its exported `ReanalyzeResult` type, and its analysis-lock/crawl/intelligence dependencies. Deleted the paired `actions.test.ts` (753 lines) covering crawl-first reanalysis, lock CAS/concurrency, and stuck-analysis recovery. |
| `app/src/components/brand-hub/re-analyze-button.tsx` | Deleted `ReAnalyzeButton` client component. |
| `app/src/components/brand-hub/brand-detail-workspace.tsx` (+ test) | Removed the client-side "Start analysis" flow (router refresh, loading state, toast, `reanalyzeBrand` call, button UI). Recovery now flows only through `AnalysisProgressBanner`'s restart control. |
| `app/src/components/intelligence-panel/brand-detail-panel-extras.tsx` (+ test) | Deleted `BrandDetailNoDnaBlock` (no-DNA "Analyse brand" button and its `reanalyzeBrand` call). |
| `app/src/components/intelligence-panel/intelligence-panel-sections.tsx` | Removed the now-deleted `BrandDetailNoDnaBlock` import/render; no-DNA fallback message no longer shown. |
| `app/src/lib/brand-hub.ts` (+ `app/src/test/brand-hub.test.ts`) | Removed the unused `isReAnalyzeDisabled` helper and its test. |
| `app/src/components/brand-hub/{analysis-progress-banner,intake-banner,profile-tab,scores-tab}.tsx` (+ tests) | Updated stale copy that referenced "Re-analyze" to state-neutral or restart-analysis-pointing text. |
| `app/src/components/intelligence-panel/route-briefing.ts` (+ test) | Brand Hub next-action briefing changed from "Re-analyze brand" to "Check analysis status". |
| `app/src/lib/brand/{discard-draft,promote-draft}.ts`, `app/src/mastra/workflows/brand-intelligence-workflow.ts`, `app/src/app/(operator)/app/brand/[id]/page.tsx` | Comment-only updates pointing at the retired action / the surviving `restart-analysis` path. No behavior change. |
| `app/src/app/api/brands/[id]/restart-analysis/route.ts` (+ test) | Added `export const maxDuration = 120` (crawl-wait + brand-intelligence execution window), matching the limit already documented on `app/brand/[id]/page.tsx`. |
| `app/eslint.config.mjs` | Added a `no-restricted-syntax` rule flagging any future `import { reanalyzeBrand }` with a message pointing at `restart-analysis`. |

Net diff per PR description: legacy action, button, and helper removed; UI copy and comments
updated to the single supported recovery path; no database schema, crawler, or scoring changes.

## Tests / CI at merge (per PR description)

| Check | Result |
| --- | --- |
| Focused recovery tests | 284 passed |
| Full test suite | 3165 passed, 10 skipped, 0 failed |
| TypeScript | Passed |
| Lint | Passed |
| Production build | Passed |
| Legacy production imports of `reanalyzeBrand` | None found |
| Legacy "Re-analyze" UI copy | None found |
| ESLint regression guard (`reanalyzeBrand` import ban) | Passed |

## Production impact

Failed-analysis recovery in Brand Hub now has exactly one UI control (the restart action in
`AnalysisProgressBanner`) and one server entry point (`POST /api/brands/[id]/restart-analysis`).
Onboarding's first-crawl kickoff is unaffected — it never called `reanalyzeBrand`. Operators can
no longer trigger a duplicate paid Firecrawl crawl via the old "Start analysis" / "Re-analyze" /
"Analyse brand" controls, because those controls no longer exist.

## Known limitations

- This PR is UI/Server-Action cleanup and comment updates only — it does not change
  `restart-analysis`'s own stage-aware crawl-reuse logic, Brand Intelligence scoring, or the
  database schema (that logic shipped earlier under IPI-905/#767 and IPI-918/#776).
- `app/src/app/(operator)/app/brand/[id]/actions.test.ts` (753 lines of lock/CAS/concurrency
  coverage for the retired action) was deleted rather than migrated; equivalent lock-token CAS
  behavior for `restart-analysis` is expected to already be covered by that route's own test
  suite, but this PR does not add new CAS-concurrency tests for it.

## Rollback / cleanup notes

- No migrations, feature flags, or secrets were touched — this is an application-code-only
  change, revertable with `git revert addb5558` if the removed controls are needed again.
- Reverting would also need to drop the new ESLint `reanalyzeBrand` import guard in
  `app/eslint.config.mjs`, or it will fail lint on the reintroduced import.
- No infrastructure or deployment cleanup required.

## Follow-up tasks

- None called out in the PR description beyond the work already tracked under
  **IPI-905 · ONB2-INT-001d** (#767) and **IPI-918 · ONB2-INT-001e** (#776), which this PR
  builds on. No new Linear issues were referenced as spun out of this merge.