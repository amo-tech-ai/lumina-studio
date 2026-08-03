# PR #776 — Merge Record

**Task:** IPI-918 · ONB2-INT-001e — Let operators restart a failed brand from Brand Hub without redoing onboarding
**PR:** `IPI-918 · ONB2-INT-001e — Let operators restart a failed brand from Brand Hub without redoing onboarding` (#776)
**Merge SHA:** `8ac1725c7cb9d191fed4191fb539cb4d45b982bc` (`main`)
**Author:** amo-tech-ai (Cursor co-author) · **Merged:** 2026-08-03 14:55:32 -0400

---

## Purpose

Adds a **Restart analysis** control to Brand Hub's red "Analysis failed" banner so an owner or editor can resume a failed brand analysis in one click, reusing the crawl already paid for instead of redoing onboarding. The server endpoint (`POST /api/brands/[id]/restart-analysis`) already shipped in IPI-905 · ONB2-INT-001d (#767); this PR is the missing UI. Restart orchestration, onboarding's listen-only behavior on `failed`, and the legacy Re-analyze action are explicitly untouched — Re-analyze retirement is deferred to IPI-919 · ONB2-INT-001f.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/components/brand-hub/restart-analysis-button.tsx` | New — same-origin POST, pending state, ref-guarded double-submit, typed-code → operator-safe copy mapping |
| `app/src/components/brand-hub/analysis-progress-banner.tsx` | Added `canRestart?: boolean` prop; renders `RestartAnalysisButton` in the `failed` branch; failure copy varies when restart is available |
| `app/src/lib/brand/can-restart-brand-analysis.ts` | New — display-gate helper mirroring the route's own owner/editor rule (`is_org_editor_or_above` RPC for org brands, creator check for personal brands); fails closed on RPC error |
| `app/src/app/(operator)/app/brand/[id]/page.tsx` | Brand query now selects `user_id`; resolves `canRestartAnalysis` only when `intake_status === "failed"` (no extra RPC on healthy pages); forwards prop to workspace |
| `app/src/components/brand-hub/brand-detail-workspace.tsx` | Added `canRestartAnalysis?: boolean` prop, forwarded to `AnalysisProgressBanner` as `canRestart` |
| `app/src/components/brand-hub/analysis-progress-banner.test.tsx` | +3 cases: owner/editor sees button on `failed`; viewer does not; button absent while `analysis_running` |
| `app/src/components/brand-hub/restart-analysis-button.test.tsx` | New — 10 cases: single POST with `credentials: "same-origin"`, pending/disabled state, duplicate-click suppression, typed-code copy (`already_running`, `unauthorized`, `provider_unavailable`), generic fallback for unrecognized/Firecrawl-leaking bodies, prototype-pollution guard, network-failure recovery |
| `app/src/lib/brand/can-restart-brand-analysis.test.ts` | New — 6 cases: personal-brand creator/non-creator/ownerless, org editor/owner allowed, org viewer denied, RPC-error fail-closed |

No changes to `restart-failed-analysis.ts`, `restart-stage.ts`, migrations, or CI config — single concern is the Brand Hub recovery UI plus the one server prop feeding it.

## Tests / CI results (as reported in PR)

- `npx vitest run src/components/brand-hub src/lib/brand-hub src/lib/brand/can-restart-brand-analysis.test.ts` → **76 passed / 12 files** (17 of which are new to this PR)
- `npm run typecheck` → clean
- `eslint` on all 8 touched files → clean
- Full suite via pre-push hook → **2938 passed, 10 skipped**
- Manual browser check against a real `failed` brand — **not run** (no seeded failed brand in dev); verification level recorded as **Unit Verified**, with CI `app-build` covering the build

## Production impact

Additive, display-only change. The restart button is a UI entry point into an already-shipped, unchanged server route; no new write path, no `intake_status` writes from the browser, no polling added. The role check in `can-restart-brand-analysis.ts` is a display gate only — the route re-checks authorization server-side and still returns 403 to an unauthorized caller. Provider error bodies (e.g. Firecrawl credit errors) are mapped to generic operator-safe copy and never rendered verbatim.

## Known limitations

- No manual verification against a real failed brand in dev (none seeded) — confidence rests on the unit/component test suite and existing route coverage from IPI-905.
- Legacy **Re-analyze** action remains alongside the new **Restart analysis** control; consolidating to one recovery path is out of scope here and tracked separately.
- Live progress after restart still depends on the existing `useBrandAnalysisProgress` Realtime subscription plus a `router.refresh()`; no new push/poll mechanism was added to detect stalled restarts.

## Rollback / cleanup notes

- Pure application-code change (React components + one TS helper + server page prop) — revertable with a straight `git revert 8ac1725` if needed; no migrations, feature flags, or secrets to clean up.
- Reverting removes the button and the `canRestartAnalysis` prop plumbing only; the underlying `POST /api/brands/[id]/restart-analysis` route from IPI-905 is unaffected and continues to function for direct API callers.

## Follow-up tasks

- IPI-919 · ONB2-INT-001f — Use One Safe Brand Analysis Recovery Path (retire the legacy Re-analyze action once Restart analysis is proven out).
- Manual verification against a real seeded `failed` brand in a dev/staging environment.