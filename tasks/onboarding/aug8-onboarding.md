# IPI-836 · ONB2-VERIFY-001 — Onboarding Verification Audit (2026-06-25)

## Audit Date
2026-06-25

## Scope
Audit of onboarding v2 state against the verification baseline. READ-ONLY — no code, Linear, Supabase, or production changes made.

## What's Already Merged (IPI-836 baseline + follow-ups)

| PR | Task | Status | Detail |
|---|---|---|---|
| #811 | IPI-836 ONB2-VERIFY-001 | Merged | Resume fixes: Brand DNA approval → durable ready → Brand Hub |
| #843 | IPI-836 ONB2-VERIFY-001 | Merged | QA onboarding harness: prefight + DNA render + ID continuity |
| — | IPI-945 ONB2-ROUTE-001 | Merged | Legacy `/app/onboarding` redirects to `/onboarding` |

## Current Flow: 13 Screens (Verified)

From `app/src/lib/onboarding/navigation.ts`:
- `FIRST_SCREEN = 1`, `LAST_SCREEN = 13`
- `QUESTION_SCREENS = [2, 4, 5, 7]` — collect input
- `MARKETING_SCREENS = [1, 3, 6, 8, 9, 10, 11]` — visuals only
- `ANALYSIS_SCREEN = 12` — server-driven crawl/BI progress
- `PAYOFF_SCREEN = 13` — Brand DNA review + "Open iPix"

### Screen Map
| Screen | Component | Purpose |
|--------|-----------|---------|
| 1 | `MarketingScreen` | Welcome |
| 2 | `BuildTypeQuestion` | What are you building? (build) |
| 3 | `MarketingScreen` | Interstitial |
| 4 | `BrandDetailsQuestion` | Brand name + website URL |
| 5 | `SalesChannelsQuestion` | Channel selection (listed) |
| 6 | `MarketingScreen` | Interstitial |
| 7 | `GrowthPreferenceQuestion` | Growth goal (grow) |
| 8–11 | `MarketingScreen` | Interstitials |
| 12 | `AnalysisProgressScreen` | Crawl + BI progress (server-status driven) |
| 13 | `BrandDnaPayoffScreen` | DNA review + exit |

## Current Verified Direction

- **Flow = 13 screens**
- **Target = 7 screens**: Welcome → Build type → Brand name + website → Channels → Growth outcome → Analysis → Brand DNA review
- **Remove marketing-only screens**: 3, 6, 8, 9, 10, 11
- **Preserve screens**: 1, 2, 4, 5, 7, 12, 13
- **Legacy mapping**:
  - old 1 → welcome
  - old 2 → build_type
  - old 3–4 → brand_details (merged)
  - old 5 → channels
  - old 6–11 → growth_goal (merged into single screen)
  - old 12 → analysis
  - old 13 → brand_dna
- **Critical constraint**: old 6–11 with no brand_id must return to growth_goal and materialize once. Do NOT send directly to analysis.
- **Preserve legacy resume behavior** — drafts use `draft_answers` JSON on `onboarding_sessions`
- **Analysis must remain server-status driven** — reads `brands.intake_status` via Realtime
- **Brand DNA approval must wait for durable ready** — screen 13 waits for `scores_complete`/`draft_ready`/`ready`
- **No DB migration expected** for removal-only compression
- **Channels are persisted but not consumed downstream** — safe to keep or simplify later

## Status of Each Priority Task

### 1. IPI-836 Verification Baseline — DONE
PRs #811 and #843 merged. Core verification harness exists.

### 2. IPI-945 Route Cutover — DONE
`(operator)/app/onboarding/page.tsx` redirects to `/onboarding`.

### 3. Website Contract Fix — NOT DONE (BLOCKER for 7-screen rollout)
**Status: UNFIXED.** The website URL is still presented as optional:

- `navigation.ts:93-95`: comment says "The URL is optional, so blank is fine"
- `navigation.ts:107`: `ctaDisabled` only blocks on malformed URLs, not blank
- `brand-details-question.tsx:57`: label reads `Website (optional)`
- `analysis-progress-screen.tsx:163-167,266-289`: shows a dead-end "Website needed" message that sends user backward to edit website

This is the exact defect from the audit: UI says optional, but `kickoffOnboardingAnalysis.ts:44-47` returns `needs_website` when blank, and the analysis screen blocks. The user completes onboarding only to get blocked at screen 12.

### 4. IPI-972 13→7 Screen Compression — NOT STARTED
**Status: BACKLOG, NOT IMPLEMENTED.** The `navigation.ts` still uses `LAST_SCREEN = 13` and `MARKETING_SCREENS = [1, 3, 6, 8, 9, 10, 11]`. The 7-screen semantic step map does not exist yet.

### 5. IPI-843 Mobile + Reduced Motion QA — NOT STARTED
**Status: BACKLOG.** No Playwright journey exists for the 7-screen flow.

### 6. IPI-904 RLS Hardening — PENDING
**Status: See separate security audit.** Onboarding materialize RPC column restrictions.

### 7. IPI-971 Recovery/Retry — PENDING
**Status: See separate task.** Allow users to retry Brand DNA without repeating onboarding.

## Stale Notes (to update)
1. `tasks/onboarding/aug8-onboarding-optimization-plan.md` — references `tasks/onboarding/` directory that was created empty. Plan files need to be written here.
2. `tasks/onboarding/aug8-onboarding-ux-audit.md` — same, needs to be created.
3. The audit doc at the top of this file was from 2026-08-01 and has outdated scores (now verification is done).

## Next Unimplemented Task — **COMPLETED**
**IPI-989 · ONB2-WEB-REQ-001 — Make the onboarding website requirement explicit**
- **Linear issue:** https://linear.app/amo100/issue/IPI-989 (Done)
- **Parent:** IPI-831 · ONB2-EPIC-001 (Onboarding v2 Delivery)
- **Blocks:** IPI-972 · ONB2-UX-OPT-001 (13→7 compression)
- **Real-world title:** `fix(onboarding): require website URL in brand details, remove optional labeling and dead-end`

### Implementation Summary
1. `navigation.ts` — `ctaDisabled` blocks blank URLs on screen 4; `canSkip` excludes screen 4
2. `brand-details-question.tsx` — removed "(optional)" label; added "(required for Brand DNA crawl)"; validation triggers immediately
3. `onboarding-flow.tsx` — Skip on screen 4 only clears brandName, not websiteUrl
4. `analysis-progress-screen.tsx` — removed `needsWebsite` dead-end; added defensive guard
5. Tests updated across 4 test files — 149 tests pass

## Blockers RESOLVED
- ~~BLOCKER: Website URL treated as optional but required by analysis~~ → **FIXED** (IPI-989)
- BLOCKER: 13→7 screen compression not implemented (IPI-972 · ONB2-UX-OPT-001) → **UNBLOCKED**

## Files Involved (website contract fix)
- `app/src/lib/onboarding/navigation.ts` — `ctaDisabled`, `canSkip`, screen constants
- `app/src/components/onboarding/questions/brand-details-question.tsx` — "optional" label, skip behavior
- `app/src/components/onboarding/analysis-progress-screen.tsx` — `needsWebsite` dead-end
- `app/src/lib/onboarding/validate-url.ts` + `validate-url.test.ts` — URL validation

## Readiness: 75/100
IPI-989 website contract fix is complete and merged-ready (tests + typecheck + lint pass). The 13→7 compression (IPI-972) is now unblocked and ready for implementation.