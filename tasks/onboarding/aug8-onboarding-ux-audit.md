# Onboarding UX Audit — 13-Screen Flow (2026-06-25)

## Flow Under Review
Standalone `/onboarding` route (IPI-833), 13-screen linear flow.

## Screens
| # | Collects Input? | Type | Notes |
|---|---|---|---|
| 1 | No | Marketing | Welcome — safe to keep as first screen |
| 2 | Yes | Question | Build type (required) |
| 3 | No | Marketing | **Removable interstitial** |
| 4 | Yes | Question | Brand name (required) + website URL |
| 5 | Yes | Question | Sales channels (currently persisted, not consumed downstream) |
| 6 | No | Marketing | **Removable interstitial** |
| 7 | Yes | Question | Growth preference (required) |
| 8 | No | Marketing | **Removable interstitial** |
| 9 | No | Marketing | **Removable interstitial** |
| 10 | No | Marketing | **Removable interstitial** |
| 11 | No | Marketing | **Removable interstitial** |
| 12 | No | Analysis | Server-driven crawl + Brand DNA progress |
| 13 | No | Payoff | DNA review + "Open iPix" |

## Findings

### 1. Six Marketing-Only Interstitials (screens 3, 6, 8, 9, 10, 11)
**Removable without data loss.** These screens collect zero onboarding input. They are pure visual breaks.

**Safe to remove:** Removing these six screens does not lose any field the Brand DNA pipeline consumes. The `OnboardingAnswers` type (`navigation.ts:29-36`) has exactly five fields: `build`, `brandName`, `websiteUrl`, `listed`, `grow`. All are captured on screens 2, 4, 5, 7. Screens 3, 6, 8–11 contribute zero answers.

**MarketingScreens component is shared** — one `MarketingScreen` component renders all seven interstitials (1, 3, 6, 8, 9, 10, 11). Removing the six removable ones leaves screen 1 (Welcome).

### 2. Website Contract Defect (HIGHEST PRIORITY)
The UI presents the website URL as optional, but analysis requires it.

**Evidence:**
- `brand-details-question.tsx:57`: `Website <span>(optional)</span>`
- `navigation.ts:93-95`: Comment: "The URL is optional, so blank is fine"
- `navigation.ts:106-107`: `ctaDisabled` only blocks on malformed URLs, not blank values
- `analysis-progress-screen.tsx:163-167,266-289`: When `kickoffOnboardingCrawl` returns `needs_website`, the analysis screen renders a dead-end message: "Analysis needs a website URL. Add one on Brand Details, then continue again."

**Impact:** User completes onboarding through screen 11, reaches screen 12 (Analysis), gets blocked with a message pointing back to screen 4. This is a dead-end that forces backward navigation mid-flow.

### 3. Channel Selection Persisted But Unused
`SalesChannelsQuestion` (screen 5) collects channels into `OnboardingAnswers.listed`, persisted to `onboarding_sessions.draft_answers`. But `answersToOnboardingForm` (`session-draft.ts:41-49`) only maps `brandName`, `websiteUrl`, `build`, `grow` — channels are dropped. No downstream consumer.

**Decision:** Keep the screen for now (user expectation + future channel detection work per audit), but note it does not affect Brand DNA delivery today.

### 4. Growth Preference (7 screen options)
`GrowthPreferenceQuestion` (screen 7) captures `grow` — maps to `OnboardingForm.goal` in `session-draft.ts:48`. This IS consumed by Brand Intelligence. Keep.

## Target Flow: 7 Screens
| Screen | Semantic Key | Maps From |
|--------|-------------|-----------|
| 1 | welcome | old 1 |
| 2 | build_type | old 2 |
| 3 | brand_details | old 3–4 (marketing 3 absorbed into 4) |
| 4 | channels | old 5 |
| 5 | growth_goal | old 6–7 (marketing 6 absorbed into 7) |
| 6 | analysis | old 12 |
| 7 | brand_dna | old 13 |

## Recommendation
1. **Fix website contract first** (IPI-973 · ONB2-WEB-REQ-001) — remove "optional" wording, disable Skip, explain why website is required for crawl-backed Brand DNA.
2. **Then compress 13→7** (ONB2-UX-OPT-001 / IPI-972) — remove 6 marketing interstitials, merge into 7 semantic steps.
3. Do NOT simply clamp screen numbers — use semantic step keys with legacy adapter.
4. Preserve legacy resume behavior via `draft_answers` JSON.

## No DB Migration Required
The `onboarding_sessions` table stores `draft_answers` as JSONB and `current_screen` as an integer. Removing marketing screens only changes which screen numbers are rendered — the answers shape stays the same. No schema change needed.