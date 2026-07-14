# Changelog — iPix / FashionOS Design

All notable changes to the design prototypes & system. Newest first.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### AI-native runtime contract + perf budget — for Claude Code (2026-07-01)
Docs only. Addresses the 2026-07-01 review's runtime/backend gaps — routed to the **code repo** per separation-of-concerns, not built as design specs.
- **`docs/handoff/14-ai-runtime-contract.md` (new):** the AI-native contract the UI docs didn't cover — (1) AI Runtime Matrix per screen (agent→workflow→approval→reads/writes→UI update), (2) CopilotKit integration matrix, (3) Mastra workflow map (only `draft-shoot` durable), (4) AI approval state machine (Draft→Review→Approved/Rejected→Committed→Archived/Expired) + RLS rule, (5) AI component interaction-state matrix + 5 runtime errors, (6) Supabase source-of-truth/ownership, (7) ownership-by-layer. Columns grounded in the known agent map; exact schema/tools = _TBD_ for Claude Code. Tasks **RT-1..8**. Indexed as handoff doc 14; added to `todo.md`.
- **`docs/design/PERFORMANCE.md` (new, D-DS23 ✅):** CWV targets (LCP≤2.5 / CLS≤0.05 / INP≤200), per-route asset budgets (images/fonts/JS/CSS/icons), design-guaranteed CLS/LCP rules, Claude Code verification list. Closes §15 governance → **10/10 complete**.
- **Record correction:** the review listed Image Standards, Token lifecycle, and Component lifecycle as "missing" — all three shipped earlier the same day (D-DS20/D-DS15/D-DS16). Tracker + `changelog` reflect ✅.

### Phase C+++ — governance closing batch: D-DS20 images + D-DS15 tokens + D-DS16 lifecycle (2026-07-01)
Docs only — no screen/React code changed.
- **D-DS20 Image Standards (✅):** new `docs/design/IMAGE-STANDARDS.md` — canonical aspect ratios (4/5 · 3/4 · 16/10 · 1/1 · 9/16, grounded in the built screens), crop/focal rules (`object-fit:cover` + `g_auto`), treatment (radius/border/scrim from tokens), min-size/retina, Cloudinary delivery presets (`f_auto`/`q_auto`/`dpr_auto`), 4-step fallback chain (real → placeholder → skeleton → empty), and an image QA gate. Indexed in `README.md`.
- **D-DS15 Token Governance (✅):** `DESIGN-TOKENS.md` — added a governance section: naming pattern (`--category-role-modifier`, semantic-not-literal), add/change/deprecate rules (prove reuse, no meaning-repurpose, alias-then-remove), and review anti-patterns.
- **D-DS16 Component Lifecycle (✅):** `components/COMPONENTS.md` — added a lifecycle table labelling all 20 components Stable/Experimental (EvidenceBlock = Stable **frozen**; ChatDock + AgentStatusIndicator = Experimental) with promote/deprecate rules; also added EvidenceBlock to the component index (was missing).
- **Governance backlog now:** only **D-DS23 Performance Budget** remains open in §15 (engineering-leaning: LCP/CLS/INP + image/font/bundle limits).

### Phase C++ — governance: D-DS18 Design→React matrix + D-DS24 master QA checklist (2026-07-01)
Docs only — no screen/React code changed.
- **D-DS18 Design → React Mapping (✅):** `09-react-implementation-map.md` — single mapping matrix at top: each DC prototype → React page → route → agent → owner → Linear → Design/React status, for all 13 built screens + new-screen row, plus the shared-component list (build-once). Owner/Linear columns are Claude Code's to fill in the code repo.
- **D-DS24 Master Design QA Checklist (✅):** new `docs/design/DESIGN-QA.md` — 11-section design gate (type · color/tokens · components/reuse · states · AI UX · motion · mobile @390 · tablet 768–1024 · a11y · console · sign-off) + the Design-100% definition-of-done. Added to `README.md` index. Run before flipping any screen to Design-100%.

### Phase C+ — governance: D-DS17 dependency matrix + D-DS19 completion % (2026-07-01)
Docs only — no screen/React code changed.
- **D-DS17 Component Dependency Matrix (✅):** `03-component-map.md` — added a tier matrix under the mermaid tree: each of the 20 components with depends-on, used-by count, and blast radius (🔴/🟠/🟡/🟢), plus a Tier 0→3 build/refactor order. StatusChip (8 dependents) + EvidenceBlock (7 screens) + IntelligencePanel flagged as frozen-contract, extend-don't-fork.
- **D-DS19 Per-screen completion % (✅):** `DESIGN-TASKS.md §0` — added Design/React/QA/Production completion matrix for all 13 built screens (Design 100%; React/QA/Prod 0% by design at this stage) + the new screens at 0%, with the Design-100% definition-of-done.

### Phase C — governance consolidations: motion, error library, BottomSheet, tablet (2026-07-01)
Docs only — no screen/React code changed.
- **D-DS21 Motion (✅ consolidated):** `ANIMATIONS.md` marked the canonical motion spec (timings, easing, per-element, streaming); adoption stays as D-MO1. `ANIMATIONS.md` header now states define-vs-apply split.
- **D-DS22 Error State Library (✅ consolidated):** added one catalog table to `STATES.md` covering all 9 states — loading · no-data · network · timeout · 404 · 500 · permission · sync-failed/offline · AI-failed — each with canonical copy + recovery action + surface (inline vs full vs banner).
- **D-DS4 BottomSheet (decision recorded):** primitive is built + documented; DC keeps the equivalent CSS-only sheet; React consolidates all sheets onto the one component + adds focus-trap. Noted in `COMPONENTS.md#bottomsheet` + `DESIGN-TASKS.md §15`. Design portion ✅; adoption = Claude Code.
- **M3 Tablet 2-pane (decided + specified):** new `MOBILE-PLAN.md §18` — portrait 768–834 = mobile-plus (2-col grids, sheet); landscape 835–1024 = collapsed icon rail + inline ~300px panel; split-view driven by container width. DC stays mobile-style at this band; React implements + verifies at 768/1024.

### Phase A — consistency pass: D-BL1 + D-SW1 mobile + tracker flips (2026-07-01)
No redesign; Zeely v3 + shared components preserved.
- **D-BL1 · Brand List bulk-action bar (✅ built + verified):** added the same select-mode pattern used on Campaigns/Assets/Matching — a **Select** toggle, per-card checkbox overlay, sticky **"n selected"** bulk bar (Select all · **Re-analyse** · **Export DNA** · clear) with `aria-live` toast; select mode clears on action. Verified live: toggle → 2 checked → "2 selected" bar → actions fire. (Sort + portfolio-health header already present.)
- **D-SW1 / D-MB4 · Shoot Wizard mobile pass (✅ built + verified):** added a scoped `@media(max-width:760px)` block — content grids collapse to 1 col (`.wz-content`), top bar slims (hide brand/title block, "Back to Shoots" label, redundant top Save — all still in the Menu), step rail padding tightened (already h-scrolls). Verified the collapse selector matches (step-1 chooser 3-col → 1-col); desktop layout unchanged.
- **Tracker flips (`DESIGN-TASKS.md §0`):** screen table → **13 screens** (added Analytics Overview + Campaign Performance rows); Brand List selection → 🟢; Shoot Wizard mobile → 🟢; **Campaigns · Matching · Channel Preview mobile → 🟢 @390** (verified last pass); Assets mobile → 🟢; "mobile re-verify of new modals + selection" → 🟢. Body rows D-BL1/D-SW1/D-MB4 → ✅.

### Docs — Governance backlog added from audit review (2026-07-01)
Added `DESIGN-TASKS.md §15` — 10 governance/maintenance tasks (**D-DS15–D-DS24**: token governance, component lifecycle, dependency matrix, Design→React map, completion %, image standards, motion, error library, perf budget, master QA checklist). IDs assigned to avoid collision with the existing D-DS11–14. Each points at an existing home doc where one exists (motion → `ANIMATIONS.md`, errors → `STATES.md` = *consolidate, not create*) to avoid doc sprawl. Recommended design order extended with a governance phase (step 6). No screen/code changes.

### Docs — Audit fixes applied: drift reconciled to the 13-screen system (2026-07-01)
No prototype/React code changed — documentation only; source = `docs/design/DESIGN-AUDIT-2026-07-01.md`.
- **Screen counts → 13** (11 operator + Analytics Overview + Campaign Performance): `handoff.md`, `MOBILE-PLAN.md` (§0 + §16.1), `DESIGN-TASKS.md`. *(fixes E1)*
- **Component count → 20 (incl. EvidenceBlock)**: corrected the "21 shared components" claim in `handoff.md` + `03-component-map.md`; EvidenceBlock reuse count corrected **5 → 7 screens** (`03-component-map.md`, `DESIGN-TASKS.md §0`). `DataTable` confirmed **never built** — appears only in historical `uploads/plan.md`, not in any active doc. *(fixes E2)*
- **Stale plan marked superseded:** `uploads/plan.md` now carries a SUPERSEDED banner pointing to `DESIGN-TASKS.md §0`. *(fixes R2)*
- **Single tracker:** `DESIGN-TASKS.md §0` declared the one source of truth; `PLAN.md`, `todo.md`, `checklist.md` now carry a banner deferring live status to it instead of duplicating. *(fixes R3)*
- **Parity scope note:** `handoff.md` + `DESIGN-TASKS.md` state that this is the **design** project (no `app/` here) — React-vs-Design / `app/` parity must be audited in the code repo against the handoff specs. *(fixes R1)*
- **Screenshots index:** added `screenshots/INDEX.md` (file → screen · version · date · 🟢/🟡 staleness + coverage gaps). *(fixes M5)*
- **Mobile re-verify @390 (Campaigns · Matching · Channel Preview) with selection + EvidenceBlock active:** rail hidden · bottom tab bar shown · **0 horizontal overflow** on all three; bulk bars `flex-wrap:wrap`; EvidenceBlock modals `inset:0` + `max-width:100%`; Channel Preview device frames wrap. **No new mobile issues.**

### Docs — Design vs Development ownership clarified (2026-07-01)
No prototype changes (no visual defect found). Added a **"Design vs Development Ownership"** section to `MOBILE-PLAN.md` (§17), `docs/design/DESIGN-TASKS.md`, and `docs/handoff/13-react-mobile-verification.md`. Marked the design portion of the Analytics React build + MOBILE-002/003/004 as ✅ *specified* and moved implementation ownership to Claude Code (focus-trap, `aria-live`, long-press, ≥44px hit-area enforcement, Tailwind reflow, routes). Rule stated: DC prototypes *specify* production behavior; React *implements* it.

### Fixed + Checklist — Analytics mobile re-verify @390px + React port gate extended (2026-07-01)
- **Campaign Performance mobile fix:** ranking-row name column was a fixed `150px` and overflowed ~92px at 390px. Changed to `flex:0 1 150px; min-width:0` (ellipsis) + bar `min-width:36px` → **0 overflow at 390**, desktop basis 150 preserved (verified full-width screenshot unchanged).
- **Verified @390 (both analytics screens):** rail hidden · bottom tab bar shown · KPI 6→2-col · chart grids → 1-col · EvidenceBlock modal full-width (`max-width:100%`) + close reachable · no workspace h-overflow.
- **`13-react-mobile-verification.md` extended to 13 screens** — added the Analytics/Campaign Performance per-screen gate (KPI/chart reflow, ranking-row shrink, `?c=` drill-down preselect, EvidenceBlock reflow) + route table for `/app/analytics` and `/app/analytics/campaigns`.

### Added — SCR-17 Campaign Performance drill-down built (2026-07-01)
Second analytics screen, built on the SCR-16 shell (OperatorShell + IntelligencePanel + PersistentChatDock + EvidenceBlock) — reuse-only, **no new shared components**; charts are token-based pattern instances per `PATTERNS.md#charts/#kpi`.
- **`Campaign Performance.v2.image-first.dc.html`** (`/app/analytics/campaigns`, agent analytics-intelligence): breadcrumb **Analytics › Campaign performance**.
- **Bar-to-detail drill-down** — ranked campaign list (engagement-rate bars, click a row to drill in; selected row highlighted + chevron). Drives everything below.
- **Per-campaign KPIs (6)** — Reach · Engagement · CTR · Conversions · Avg DNA · Cost/engagement, each with a signed delta (CPE uses inverted good/bad colour), click → **Explain** (EvidenceBlock).
- **Charts** — engagement-over-time trend (line+area) + top-assets bars, both per selected campaign.
- **AI insights** per campaign (Spring/Air Max/Resort/Heritage each have their own set) with confidence + evidence + Explain; **IntelligencePanel** shows selected-campaign headline + top insights.
- **EvidenceBlock** keyed per campaign + per metric (13 mapped explanations incl. launch-readiness for the Planning campaign). Verified: drill Spring→Air Max updates detail + greeting; Reach/campaign Explain open EvidenceBlock with why/reasoning/suggestions.
- **5 states** · nav + Analytics active + mobile tab bar + More sheet + chat dock · toast `aria-live` · reduced-motion-safe static charts. Clean console.
- **Remaining:** wire Analytics "Campaign performance" chart → this screen; mobile re-verify; React port.

### Added — SCR-16 Analytics Overview built (2026-07-01)
First analytics screen, built to the locked chart/KPI language (D-DS6/9/11). Reuse-only — OperatorShell + IntelligencePanel + PersistentChatDock + EvidenceBlock; **no new shared components** (charts are token-based pattern instances per `PATTERNS.md#charts/#kpi`).
- **`Analytics.v2.image-first.dc.html`** (`/app/analytics`, agent analytics-intelligence): date-range FilterBar → **6 KPI cards** (value · signed delta · sparkline, click → Explain) → **charts**: DNA-over-time trend (line+area), AI-approval-rate score ring, campaign-performance comparison bars, top-assets bars → **AI insights** list (confidence + evidence + Explain).
- **IntelligencePanel:** active filters, headline metric, top AI insights → all open **EvidenceBlock**.
- **EvidenceBlock for every metric/insight** — 7 mapped explanations (score→potential, confidence, why, reasoning, evidence, suggestions, Approve→apply); verified 87→93 on Avg Brand DNA.
- **5 states** (populated/loading/empty/error via switcher) · nav + mobile tab bar + More sheet + chat dock · toast `aria-live` · reduced-motion safe (static charts). Verified live: KPIs, 4 charts, insights, EvidenceBlock all render; clean console.
- **Nav:** added an Analytics destination (chart icon) across the shell.
- **Remaining:** SCR-17 Campaign Performance drill-down; mobile re-verify; React port.

### Locked — Chart + KPI patterns D-DS6/D-DS9/D-DS11 (2026-07-01)
Locked the chart/KPI language before building Analytics (docs only, no screens). No new components — patterns are token-based instances (a `KpiCard`/`Chart` primitive may be extracted at SCR-16 build).
- **`PATTERNS.md#charts`** rewritten to a buildable spec: locked chart-type set (trend/comparison/score/sparkline) with per-type recipes, tooltips (hover+focus, tap-to-pin mobile), states (loading/empty/error/partial), motion (reduced-motion safe), a11y (text alt, no colour-only series), do/don't.
- **`PATTERNS.md#kpi`** rewritten: fixed anatomy, 5 variants, signed-delta colour rule, states, **EvidenceBlock for every metric**, mobile/tablet, do/don't.
- **DESIGN-TASKS.md** — D-DS9 + D-DS11 flipped ✅; gate note updated to **SCR-16 CLEARED**; §0 tracker rows updated.
- **COMPONENTS.md** — added a Charts & KPI patterns entry (patterns, not components; extract at SCR-16 if reusable).
- **ANALYTICS-PLAN.md** — gate marked cleared.

### Added — D-AS3 Assets rights/usage + ANALYTICS-PLAN.md (2026-07-01)
Closed the two remaining queued items. No redesign; reuse-only.
- **D-AS3 (🟢 built + verified):** Assets selected-panel now has a **Rights & usage** section — release status (dot), usage rights, license #, territory, expiry (per-asset, status-derived) + a **rights flag** for Flagged/Draft assets (expired/no-release warning) + a **usage-history** timeline. Verified live (Rights header + all fields render on asset select; clean console).
- **ANALYTICS-PLAN.md (🟢 planning doc, no build):** SCR-16 Overview + SCR-17 Campaign Performance — 3-panel shell reuse, KPI row + charts from `PATTERNS.md#charts/#kpi`, EvidenceBlock on every metric, AI insights with next actions, 5 states, mobile/tablet, a11y. Gated on D-DS6 (chart language) before any build; no new components.

### Mobile finalization pass (2026-07-01)
No redesign; localized fixes + verification specs. Ref `MOBILE-PLAN.md §16` + `docs/handoff/13-react-mobile-verification.md`.
- **MOBILE-001 (🟢 done):** bulk-action bars in Matching & Campaigns wrapped (`flex-wrap`); Assets already wrapped — no h-overflow at 390/430px.
- **MOBILE-004 (🟢 partial):** all 7 toast surfaces now carry `role="status" aria-live="polite"` (Matching, Campaigns, Assets, Channel Preview, Brand Detail, Shoot Detail, Shoot Wizard). `prefers-reduced-motion` confirmed already honored everywhere.
- **MOBILE-006 (🟢 done):** created `13-react-mobile-verification.md` — breakpoint matrix, per-screen gate, touch-target/long-press/a11y/tablet specs, Playwright/Lighthouse/axe gates.
- **Specified for React (🟡, not applied to DC):** MOBILE-002 44px hit areas, MOBILE-003 long-press select + mobile action sheet, MOBILE-004 focus-trap + streaming `aria-live` + keyboard, MOBILE-005 768/1024 tablet gate.
- **Scores:** mobile readiness **82/100** (↑ from 78); overall design readiness **83/100**.

### Fixed — Mobile audit: bulk-bar overflow (2026-06-30)
Mobile-only audit pass (`MOBILE-PLAN.md §16`), no redesign. Verified the shared mobile shell + new EvidenceBlock/selection surfaces against the ≤1024px rules and the ≥44px touch standard.
- **🔴 Fixed (critical):** the sticky **bulk-action bars** in Matching & Campaigns were a single non-wrapping flex row → overflowed horizontally at ≤390px. Added `flex-wrap:wrap;gap:8px 12px`. (Assets bulk bar already wrapped — no change.)
- **EvidenceBlock modals verified** to reflow full-width + scroll on mobile (no clip) across all 5 screens.
- **Documented (not yet fixed, recorded in `MOBILE-PLAN.md §16`):** selection checkboxes <44px touch target; no long-press-to-select on mobile (Select toggle only); drag-to-target is desktop-only on touch (bulk-bar is the working fallback); EvidenceBlock modals/bulk bars need focus-trap + `aria-live` (D-A11Y2/4).
- **Scores:** mobile readiness **78/100**; overall design readiness **82/100**.

### Added — Phase 1+2: EvidenceBlock & selection reuse across Matching · Campaigns · Channel Preview (2026-06-29)
Applied the now-complete reusable patterns consistently before Analytics. No redesign, Zeely v3 + shared components preserved. **No new explainability or card components.**
- **Matching** — "Explain fit score" in the creator panel → shared `EvidenceBlock` modal (Creator Fit: score→potential, confidence, AI reasoning, evidence images, audience evidence, suggestions, Approve→re-score). Table view gained the **D-DS5 selection system** (Select toggle, per-row checkboxes, sticky bulk bar: Save to shortlist / Invite / Select all / Clear).
- **Campaigns** — "Explain campaign health" in the selected-campaign panel → `EvidenceBlock` modal (health blends deliverables + timeline + deliverable quality + budget; suggestions = AI recommendations). Grid gained **D-DS5 selection + drag**: Select toggle, checkbox overlay, bulk bar (Duplicate / Archive), draggable cards with a floating drop dock (Duplicate / Archive).
- **Channel Preview** — "Explain readiness" in the channel detail panel → `EvidenceBlock` modal (channel readiness: crop reasoning, safe-zone evidence, brand-DNA breakdown, per-channel crop suggestions, Approve→re-score).
- **Verified live (desktop):** all three EvidenceBlock modals render every section; Matching + Campaigns selection/bulk/drag work; clean console on each.
- **Remaining:** D-AS3 (Assets rights/usage metadata), `ANALYTICS-PLAN.md`, mobile pass + final doc sync (TASKS/COMPONENTS/PATTERNS/AI-EXPLAINABILITY/checklist).

### Added — Phase 4 Assets: upload + bulk + selectable/draggable cards + EvidenceBlock reuse + AI-explainability standard (2026-06-29)
Built the next milestone slice concretely on the Assets screen; no redesign, Zeely v3 preserved, shared components reused.
- **D-DS5 — Selectable & draggable card system** (canonical, documented in `PATTERNS.md#selection`): **Select** toggle + per-card checkbox, multi-select, sticky **bulk-action toolbar** (N selected · Select all · Approve · Reject · Add to shoot · Add to campaign · Clear), HTML5 **drag** with a floating **drop dock** (Drop into Shoot / Campaign). Drives the existing `AssetCard` via its `onSelect`/`selected`/`border` props — **no card fork**.
- **D-AS1 — Upload experience:** Upload button → modal with per-file progress through **Uploading → Auto-tagging → DNA analysis → Ready**, each file landing a DNA score + auto-tags + brand grouping; "Approve all & add to library" (enables on completion).
- **D-AS2 — Bulk actions:** approve/reject/assign + drag-to-target, all with toasts.
- **Phase 2 — EvidenceBlock reuse:** selected-asset panel now has **"Explain DNA match"** → opens the shared `EvidenceBlock` in a modal (score→potential, confidence, why, AI reasoning, evidence imgs, suggestions, before/after, Approve→re-score). **No duplicate explainability component.**
- **Phase 3 — `AI-EXPLAINABILITY.md`:** new mandatory standard — the AI review workflow (analyze→evidence→reasoning→confidence→improvements→before/after→approve→apply→re-score), confidence badges, evidence/reasoning/approval patterns, AI states, and the where-used matrix.
- **Verified live:** select mode + 3-select + bulk bar (counts), Upload modal (4 files processing→Ready), Explain DNA → EvidenceBlock (all sections), no console errors.
- **Deferred (next):** reuse EvidenceBlock in Matching/Campaigns/Channel Preview; Analytics foundation (chart standards ready).

### Added — Phase 1: Brand DNA explainability (EvidenceBlock) + DNA history (2026-06-29)
Transformed Brand Detail into the flagship AI experience; new reusable component; no redesign, Zeely v3 preserved.
- **New shared component `components/EvidenceBlock.dc.html`** — score→potential + confidence, Why this score, AI reasoning, Evidence (images + bullets), Suggested improvements (+gain), Before/After, and Approve/Improve/Regenerate. Sections auto-hide when empty. **Reusable** on Assets, Matching, Campaigns, Channel Preview, any AI reasoning panel.
- **D-BD1** — every DNA pillar in Brand Detail is now a button → opens EvidenceBlock in a modal with per-pillar why/evidence/reasoning/suggestions/before-after + potential. Approve fires a re-score toast.
- **D-BD2** — added a **DNA history** block (trend bars + timeline of prior analyses, scores, and approved changes; "+9 since May").
- **D-DS6/D-DS9** — chart standards documented in `PATTERNS.md` (#charts + #kpi); analytics screens must use them.
- **Reused:** StatusChip, modal/toast patterns, OperatorShell, AI dock, tokens. **No duplicate components.**
- **Verified:** 4 clickable pillars → modal renders all sections (why/reasoning/evidence/suggestions/before-after); Approve closes + toasts; DNA history renders; clean console; desktop + mobile.
- **Partial/next:** D-DS5 (selectable/draggable card variants) documented as a pattern, build pending.

### Added — Quick Wins: tooltips · breadcrumbs · dev indicator · Shoot Detail polish (2026-06-29)
Four Quick Wins; no redesign, Zeely v3 preserved, shared components reused, no console errors.
- **D-CT3 · Tooltips** — one shared `title` pattern on icon-only buttons (nav toggle on all 8 panel screens, Shoot Detail Share/More/Close; voice/account already done). Desktop + mobile.
- **D-NAV3 · Breadcrumbs** — Shoot Detail now uses the same breadcrumb as Brand Detail ("Shoots › <name>", clickable → Shoots List). Consistent style/behavior.
- **D-CC2 · Dev indicator** — the realtime SIMULATE row is now **dev-only** (gated behind `?dev=1` / `localStorage ipix.dev`); relabelled as a purple **⚙ DEV** badge. End users never see simulation chrome; the user-facing status strip stays.
- **D-SD1/D-SD2 · Shoot Detail** — Deliverables tab gained a `n/total ready` count + per-card spec; Activity tab gained a count; new **Call Sheet preview** modal (print-styled: crew + schedule from shoot data) with **Export PDF** (toast). Navigation/layout unchanged.
- **Verified:** breadcrumb navigates; deliverables count + Call Sheet (crew/schedule) + Export toast + activity count; dev indicator hidden normally / shown with `?dev=1`; tooltips present; clean console on all touched screens.

### Cleanup — QA follow-up: archive stale files, disable decorative controls, doc polish (2026-06-29)
Completed the actionable QA recommendations (production wiring intentionally left for Linear).
- **Archived** the two stale pre-v2 files → `archive/` (`Brand Detail.dc.html`, `Command Center.dc.html`); the `*.v2.image-first.dc.html` set is the sole canon.
- **Decorative controls:** "Fix now" (Brand List) now opens the brand (→ `Brand Detail?id=nike`); **Voice input** disabled with a "coming soon" tooltip + `aria-disabled` on all 8 panel screens + `PersistentChatDock`; **Account** given an identity tooltip. No dead/misleading controls remain. (Upload was spec-only — never a built control.)
- **Component docs:** `onOpen` prop documented for `BrandCard` in `COMPONENTS.md` (N1). N3 (StatusChip variants) already complete.
- **Deferred (non-blocking P3):** N2 (`EmptyState` reuse), N4 (`BottomSheet` primitive — refactor risk for cosmetic gain across 8 working screens), N5 (`AgentStatusIndicator` states). **Production (Linear):** IntelligencePanel data, permissions/realtime, global-search backend, Lucide, ⌘K — not started by design.
- Verified: all touched screens load clean (no console errors); Fix now navigates; voice/account tooltips present.

### QA — Full prototype verification pass (2026-06-29)
Complete verification of files, 11 screens, 8 key journeys, all interactive controls, AI docks, and the component system. **No redesign; no new bugs found** (all prior bugs already fixed). Results + scorecard in `checklist.md` §12.
- **Files:** all required docs, 11 screens, 20 component DCs, images 5–24 present; imports resolve; clean console on every screen.
- **Screens/journeys:** all 11 load clean (desktop + mobile); all 8 key journeys complete with no dead ends.
- **Controls:** no dead *primary* actions; remaining inert = voice/upload/account/"Fix now" (P3 decorative).
- **AI:** every dock contextual, updates on selection, streams; zero generic greetings.
- **Findings:** 🔴P0/🟡P1 none. 🟠P2 = two stale pre-v2 files (`Brand Detail.dc.html`, `Command Center.dc.html`) recommend archiving. ⚪P3 = component polish (N1/N2/N4/N5) + production wiring (IntelligencePanel data, permissions/realtime). **N3 StatusChip variant set confirmed complete.**
- **Score: 92/100 (A).** Nav 96 · Buttons 94 · Journeys 95 · Mobile 90 · AI 91 · Components 88 · Handoff readiness 84.

### Added — Final approved improvements: K panel + shortlist + breadcrumb + channel-select + cross-cutting states (2026-06-29)
No redesign; Zeely Editorial v3 preserved. All verified live, no console errors.
- **K · Asset right panel extended** (no lightbox) — added **AI analysis**, **Channel readiness** (per-channel score + 🟢/🟡/⚪ dot + Ready/Review/Re-crop), and a fuller **quick-action** set: Use in shoot · Use in campaign · Replace · Download · **Channel Preview** (navigates). Non-nav actions fire a toast. Mobile sheet behavior preserved.
- **Matching shortlist drawer** — the header badge is now a button **"Shortlist (n)"** → right-side drawer listing saved/invited creators with status, **Remove**, and **Send invites to saved**. State persists across swipe/table.
- **Brand Detail breadcrumb** — the "Brands" crumb is now a working back-link → Brand List (kept existing breadcrumb style).
- **Channel Preview channel selection** — the confirm modal now has a **checkbox per channel**; the title + button update live ("Publish to 2 channels" / "Publish 2 channels"), Publish disables at 0, and **progress + success run only for selected channels** ("Published to 2 channels").
- **Cross-cutting states** (Command Center) — a realtime/permission status strip with the dot system: 🟢 Live · 🟡 Reconnecting · ⚪ Stale data (+ **Refresh** → reconnecting → live) · 🔴 Read-only (+ **Request access**). Demoable via a SIMULATE control. Lightweight prototype only — no backend behavior.
- **Intentionally NOT built:** Asset lightbox (extended the panel instead, per approval); standalone Campaign Detail (kept the right-panel detail); real backend for realtime/permissions (prototype dots only).
- **Files:** Assets, Matching, Brand Detail, Channel Preview, Command Center (`.v2.image-first.dc.html`).

### Verified — Sub-item audit E–L + J1 Overview link (2026-06-29)
Full sub-item QA (E1–E5, F1–F4, G1–G5, H1–H4, I1–I4, J1–J3) — all **30/30 green**, scored in `checklist.md` §11 (K0/L0 gated on approval). Added the spec'd **"View in Assets"** link to the Shoot Detail **Overview** (Moodboard header), so J1 covers both the Assets tab header and Overview. No errors, red flags, or blockers.

### Fixed — Verification pass: dead mobile tab nav + malformed More label (2026-06-29)
QA review across all shipped interactive items. Phase 1 items (A–D) and E–J all **passed**. Found and fixed one **pre-existing systemic bug** (from the M6 mobile pass, not the Phase-1 work):
- **Dead mobile bottom-tab navigation** — on 6 panel screens the mobile tab-bar Home/Shoots/Assets/Brands were bare `<button>`s with no handler (mobile users could only navigate via the More sheet). Wired each to `window.location` (matching the desktop NAVHREF + Command Center's already-working pattern). *(Brand List, Brand Detail, Shoots List, Assets, Campaigns, Matching, Channel Preview.)*
- **Malformed `<label for="m-more">`** — its `style` attribute was missing the closing `">`, so the dots-icon `<span>` was swallowed into the attribute (icon dropped, broken markup). Fixed on the 4 screens that had it (Brand List, Brand Detail, Shoots List, Assets); the other three already had a correct label.
- **Root cause:** the mobile tab-bar markup was hand-authored per screen during M6 and never wired to navigation, and a copy-paste dropped the label's closing quote on the first four screens.
- Verified live on all 6: 4 tabs each navigate, More label renders its icon with clean style, no console errors. Shoot Detail was already correct (`<a href>` tabs) and untouched.

### Added — Phase 3: F·G·H·I·J wiring + states (2026-06-29)
No redesign; Zeely Editorial v3 preserved. All verified live, no console errors.
- **F · Functional search** — Brand List + Shoots List search inputs now bind `onInput`, filter the grid client-side by name/brand/status, and show a **"No matches for '<query>'"** state; clearing restores the list; filter chips still work. *(Command Center has no content list — only the AI ask dock — so it has no list-search to wire; flagged, not changed, to avoid a redesign.)*
- **G · Channel Preview publishing flow** — added a **Publish** CTA → **confirm** modal (lists all 4 channels + DNA) → **publishing** progress (per-channel pulsing dot → green tick) → **success** ("Published to 4 channels") with **Return to dashboard** (→ Command Center) and **Publish another**. In-screen overlay, no new screen.
- **H · Matching Save/Invite** — Save/Invite now fire a **toast** ("Saved @handle to shortlist" / "Invite sent to @handle"), a **shortlist count badge** ("N saved · M invited") appears in the header, and the selected-creator panel gained a **Save** button beside Invite. State persists across swipe/table toggle.
- **I · Brand Detail DNA states** — analysing card now shows a **live determinate counter** ("n of 47 pages"); the error state was upgraded from a single "Try again" to **Retry · Report · Go back** (Report → "Reported ✓"); **Retry runs analysing → loaded** (no fake resumable stream — determinate crawl then settles to the loaded DNA view). Demoable from the state switcher.
- **J · Shoot Detail → Assets deep-link** — Assets tab gained a **"View in Assets"** action → `Assets…?shoot=<id>&name=<name>`; Assets reads `?shoot=`, shows a removable **"Shoot: <name>"** chip, filters the grid, and clearing the chip restores all + clears the URL.
- **Bugfix noted:** Brand Detail crawl counter first failed because `clearInterval`/`setTimeout` lived inside a functional `setState` updater (ran twice/discarded); moved side-effects out of the updater.
- **Files:** `Brand List…`, `Shoots List…`, `Matching…`, `Brand Detail…`, `Shoot Detail…`, `Assets…`, `Channel Preview…` (.v2.image-first.dc.html).

### Added — Phase 2: Brand → Shoot workflow (item E) (2026-06-29)
Seamless hand-off from Brand Detail into the Shoot Wizard with context carried over — no UI redesign, existing components reused.
- **E1 · CTA** — promoted the existing secondary "Plan a shoot" chip on Brand Detail to a **primary black "Plan a Shoot" button** (calendar icon) in the actions row.
- **E2 · Context nav** — `planShoot()` → `Shoot Wizard…?brand=nike&campaign=spring-2026&season=SS26`.
- **E3 · Hydrate + lock** — Shoot Wizard parses the URL params on mount (`componentDidMount`), maps slugs→display names, and on Step 2 (Basics) shows a **"Carried over from Nike — Spring 2026 · SS26. No need to re-enter."** banner with the Campaign + Season selects **locked** (`disabled`); a **Change** button unlocks them. Brand was already a locked field. No duplicate questions.
- **E4 · AI context** — the Production-Planner dock greeting is now context-aware: *"Planning Nike's Spring 2026 campaign (SS26). I found your Brand DNA, moodboard, and previous shoots — I've drafted a production brief for review."* (Step 1) and a matching carried-over line on Step 2.
- **E5 · Prefilled brief** — the wizard's brief/plan/shot-list/crew/timeline were already AI-prefilled (editable), so the user refines rather than starts empty.
- **Verified:** Brand Detail → button (black, rgb(17,17,17)) → navigates with params → wizard greeting names brand+campaign+season → Step 2 banner + locked selects → Change unlocks → no-params open has no banner/lock (no regression). No console errors.
- **Files:** `Brand Detail.v2.image-first.dc.html`, `Shoot Wizard.v2.image-first.dc.html`.

### Planned — Completion plan (audit follow-through, awaiting go-ahead) (2026-06-29)
Produced `checklist.md` §0 progress tracker + §9 phased completion plan (with mermaid roadmap, nav map, Brand→Shoot sequence, publishing state diagram). Phase-1 audit of every remaining item: A–D done, M (contextual AI) verified across all 11 prototypes, E–J are wiring/state work needing **no new screen**, K (Asset lightbox) & L (standalone Campaign Detail) are gated on approval. No prototype code changed in this step.

### Fixed — Cross-screen dead-ends: list→detail navigation + onboarding completion (2026-06-29)
Audit (`checklist.md`) flagged three primary-action dead-ends. Implemented the smallest wiring fixes — no screen redesigns.
- **P0 · Onboarding completion** — final **"Open FashionOS"** button called `openApp = () => this.next()`, which capped at screen 13 and did nothing. Now `window.location.href = 'Command Center.v2.image-first.dc.html'`. The funnel finishes into the app. *(verified: jumped to screen 13 → click → navigated to Command Center)*
- **P1 · Brand List → Brand Detail** — brand cards and the left-rail brand buttons were dead. Added an `onOpen` prop to `BrandCard` (wired to the cover image **and** the "View" button so every brand — including the no-data Draft card — opens) and passed `on-open → openBrand(id)`; wired the rail Nike/Adidas/Zara buttons to the same. `openBrand(id)` → `Brand Detail.v2.image-first.dc.html?id=<id>`. *(verified: Nike rail → `?id=nike`)*
- **P2 · Campaigns & Assets** — audit re-check found these were **already wired**: `CampaignCard` and `AssetCard` both expose `onSelect`, and both screens already pass it (`on-select`) so a card click opens the existing right-panel detail (desktop) / bottom sheet (mobile). No change needed; corrected the audit record. *(verified: campaign card → Deliverables panel; asset card → DNA-match panel)*
- **Files:** `components/BrandCard.dc.html`, `Brand List.v2.image-first.dc.html`, `Onboarding.v2.zeely.dc.html`.
- **Result:** no remaining dead primary actions on Brand List, Onboarding, Campaigns, or Assets.

### Added — Persistent escape/menu control + exit guard (2026-06-29)
Kept the wizard focused (no full sidebar) but added a small always-visible control cluster in the top bar.
- **← Back to Shoots** — now a labelled button (was an unlabelled chevron), always visible on every step.
- **☰ Menu** — compact dropdown to jump to any of the 10 steps (current highlighted, completed ✓), with **Save draft** and **Back to Shoots** pinned below the divider. Lets users switch sections without the full sidebar; closes on jump or outside-click.
- **Save draft** — always visible in the header (and in the menu).
- **Exit confirmation** — leaving via Back to Shoots when there are unsaved edits opens a guard modal (Discard & leave · Stay · Save & leave). A `dirty` flag is set by brief/shot edits, props assign, savings apply, moodboard lock toggles, and "Fix all issues"; Save draft clears it, so a clean wizard exits straight to Shoots.
- Create-Shoot confirmation modal and live edit→score updates (prior entry) confirmed still working; **Shoot Detail route verified to exist** (`Shoot Detail.v2.image-first.dc.html`) as the post-create redirect target.
- Verified live: header controls, menu open/jump/close, dirty→exit-confirm→Stay, Save draft clears dirty; no console errors.

### Added — Action wiring, confirmation, live scoring (2026-06-29)
Turned the remaining static controls into working interactions and made Review scoring respond to user actions.
- **Moodboard:** "Regenerate all" → toast + AI stream; every tile now has a working **lock toggle** (persists in state, drives the card border) and a **regenerate** button (toast). Locks survive re-render.
- **Call sheet exports:** PDF / Email / WhatsApp each fire a confirmation toast ("Call sheet exported to PDF", "…emailed to 8 crew", "…sent via WhatsApp").
- **Confirmation before create:** Create Production Plan (and the Step-10 header button) now opens a confirm modal — "This will create the shoot, generate its tasks, build the call sheet, and lock in the budget" — with a checklist; Confirm proceeds to Shoot Detail, Cancel/✕/backdrop dismiss.
- **Live scoring:** section scores now react to user actions — Props assigned → Production 82→90 (B→A); Savings applied → Budget 92→96 (A→A+) and that approval flips to Approved; Shot edits → Shot List 88→92 (B→A). The composite readiness rises 92 → up to 96, grade + "Ready for Production" recompute, and the AI greeting reflects the live score.
- **Review additions:** "Completed fixes" panel (live, from applied actions) and "Remaining warnings" panel (live count, derived from open section warnings) — so the screen shows final scores, what's done, and what's left.
- Lightweight toast system (auto-dismiss). Verified live: regenerate/lock/exports toasts, props/savings/shot scoring, confirm open→cancel and →create, no console errors.

### Added — Production Readiness Dashboard, Review step (2026-06-29)
Rebuilt Shoot Wizard **Step 10 (Review & Create)** as a production-readiness dashboard — same Zeely Editorial language (white/black/grey, Inter, image-first), existing nav/stepper/AI dock preserved.
- **Always-accessible left rail** (sticky): **Production Readiness 92/100 · Grade A · Ready for Production** KPI + an 8-section score menu (Creative Brief, Moodboard, Shot List, Production, Budget, Timeline, Call Sheet, Deliverables) with grade dots + scores. Collapses to a single column under 760px.
- **Section explanations:** selecting any section updates a WHY panel — ✓/⚠ reasons + "potential score" (e.g. Shot List 88 → 95). Never a score without a reason.
- **Approval checklist** (6 items, pending ones show why), **AI Improvements** (+4 Brand DNA, −$4,800 savings, +3 shots…), **Production Risks**, **Resource Readiness** (Crew 8/8 … Props), **Deliverables** chips, and a **production journey** (Planning→Publishing, current stage highlighted).
- **State-aware:** assigning props / applying savings earlier flows into the Production score, Risks, Resources and Approvals here. Consistent grade scale (A+/A green, B/C amber).
- **AI chat** (Step 10) now gives a contextual readiness summary + quick actions: Fix all issues (applies props+savings), Assign resources (→ Step 6), Improve score, Export plan, Notify team.
- **Final CTA** "Create Production Plan" lists what it does (create shoot, reserve resources, generate tasks/call sheet, notify team, open Shoot Detail) and now redirects to **Shoot Detail**. Save draft / Back preserved.
- Verified: all panels render, section-select works, quick actions mutate state, create→redirect; no console errors. Steps 1–9 untouched.

### Fixed — Shoot Wizard interactive buttons (2026-06-29)
Analyzed every action button across the 10 steps and wired the dead ones with real state + workflows:
- **Shot list — edit pencil** (Step 5): opens an Edit-shot modal (name · frames/notes · aspect-ratio select). Save writes a per-shot override and the row updates live; Cancel/✕/backdrop discard.
- **Brief — Edit** (Step 3): opens an Edit-brief modal (Objective · Mood · Audience · References · Visual direction). Save overrides the brief card + "After" direction live.
- **Production — Assign** (Step 6): assigns the missing Props stylist (→ "Sofia Reyes — confirmed" + ✓); the "1 resource missing" badge flips to "All resources confirmed".
- **Budget — Apply savings** (Step 7): applies the $4,800 saving — total $48,200 → **$43,400**, Studio line $8,400 → $3,600, button → "Savings applied ✓".
- **Review — Create shoot** (Step 10): finalizes and redirects to Shoots List (label → "Creating shoot…"). The header primary button on Step 10 now also creates (was a no-op). **Save draft** (Step 10) persists the draft; **Back** already worked.
- All modals share one overlay; no restyle of existing layout. Verified each live (shot rename, brief mood edit, props assign, savings recompute, create→redirect).

### Fixed — Shoot Wizard Step 2 controls (2026-06-29)
- **Campaign** and **Season** were fake dropdowns (static `<div>` + chevron). Replaced both with real native `<select>` menus (Campaign: Spring/Summer/Fall/Holiday 2026 · Season: Spring/Summer/Fall/Winter), styled to match (appearance:none + custom chevron). Pull-downs now open and change value.
- Wired the **Change season** chip (focuses the Season select) and **Use previous** chip (→ Step 1). Apply AI plan, Shoot name input, and Brand field were already functional. Verified live.

### Fixed — Shoot Wizard header buttons (2026-06-29)
- **Root cause:** the close `‹` chevron and **Save draft** button in `Shoot Wizard.v2.image-first.dc.html` were static markup with no `onClick` (Back/Continue already worked).
- **Fix:** added `exit()` (close `‹` → returns to Shoots List), `saveDraft()` (persists `{step}` to `localStorage` + transient "Draft saved ✓" confirmation that reverts after 1.8s). Back/Continue left as-is. Verified: Continue 1→2, Back 2→1, Save draft confirms + persists, close exits to Shoots List. No styling changed.

### Fixed — New shoot button wiring (2026-06-29)
- **Root cause:** the header **"+ New shoot"** and empty-state **"Plan shoot"** buttons in `Shoots List.v2.image-first.dc.html` were static markup with no `onClick` — the Shoot Wizard existed (`/app/shoots/new`) but nothing linked to it, so clicking did nothing.
- **Fix:** added a `newShoot` handler (`window.location.href='Shoot Wizard.v2.image-first.dc.html'`) and attached `onClick="{{ newShoot }}"` to both buttons. No styling, layout, or other handlers touched. Verified both navigate to the wizard; filters, state switcher, chat dock, and IntelligencePanel unaffected.

### Fixed — Edit shoot button (2026-06-29)
- **Root cause:** the Edit shoot button had no `onClick` — it was static markup with no handler or edit state.
- **Fix:** added an edit-mode modal (Zeely Editorial styled) with `editing`/`draft`/`overrides` state. Editable fields: name, status (chips), date, brand, looks, total shots, location, team notes. **Save** merges the draft into per-shoot overrides and updates the screen live (header, progress, meta all reflect changes); **Cancel** exits with no changes. Tabs, chat dock, and shot list untouched. Progress recomputes safely from edited shot counts.

### Added — Shoot Detail screen (2026-06-29)
- **New screen `Shoot Detail.v2.image-first.dc.html`** (`/app/shoots/[id]`) — the production workspace for a single shoot. None existed before (referenced in plans only). Built on the shared shell (nav, mobile tab bar + More sheet, context chat dock, state switcher).
  - **Header:** hero image, shoot name, brand, status chip, DNA score, progress bar, team avatars, Edit/Share/⋯ actions, back-to-Shoots link.
  - **9 tabs:** Overview (stat cards · moodboard · editable checklist · deliverables), Shot List (editable — tap to toggle Captured/Planned), Assets (masonry), Team, Schedule (timeline), Budget (lines + bar), Approvals (compact ApprovalCards), Deliverables (per-channel cards), Activity (feed).
  - **Intelligence panel:** DNA ring, shots/budget progress, approval status, missing shots, risks & alerts, recommended next actions.
  - **AI dock:** context-aware ("You're reviewing Nike – Street Series") with the 6 specified suggestions.
  - **States:** Populated · Loading · Empty · Error · Approval Pending. Reuses AssetCard (`tile`+`masonry`), ApprovalCard (`compact`), StatusChip (`bare`). Reads `?id=` from the URL to resolve the shoot.
- **Wired "Open shoot"** in Shoots List → navigates to Shoot Detail with `?id=<shoot>`; verified the click lands on the right shoot (e.g. Spring Campaign / `s1`). Clean load, no console errors.

### Fixed — Navigation wiring (2026-06-29)
- **Sidebar menu links are now real routes.** The left-nav items (Home · Brands · Shoots · Assets · Campaigns, + Matching/Preview where present) and the brand rows + "Add brand" were inert `<button>`s — converted to `<a href>` pointing at the sibling screen files across **all 8 v2 screens**. Command Center's brand rows link to Brand Detail; its mobile bottom-tab bar + More sheet also navigate. Verified link targets on Command Center (8), Brand List (5), Channel Preview (7) — all resolve, clean loads.
  - *Follow-up:* the bottom mobile tab bars on the other 6 screens still use static buttons (only Command Center's is wired) — pending.

### Added — Component migration Phase 3 (2026-06-29)
- **Command Center → ApprovalCard (`compact` variant).** The IntelligencePanel **approval stack** (3 cards) now renders via `<dc-import name="components/ApprovalCard" variant="compact">`. ApprovalCard extended with a faithful **`compact` variant** (thumbnail + dot+title + 2-line preview + `confidence·source` + Approve/Edit, neutral grey border/dot) alongside the existing text-diff variant; new props `thumb`, `preview`, `source`, `confLabel`, `confColor`, `dotColor`. Verified: 3 cards, correct titles/confidence (91/72/91)/sources, clean load.
  - **Documented as bespoke (intentional skips):** the large **workspace HITL preview** (4:5 generated-image card + thinking dots + Approve/Edit/Reject) is an image-preview moment distinct from the compact ApprovalCard — kept bespoke. The panel **"active" chip** is a dotless tinted pill (StatusChip is dot+label). **OperatorShell / PersistentChatDock** are *not* retrofitted onto this reference screen: it carries verified screen-specific shell logic (mobile tab bar, intel-as-sheet, state switcher, wired streaming dock); a wholesale shell swap would risk that verified behavior. Those compositions are for **new** screens — documented in COMPONENTS.md.
- **Brand Detail → AssetCard (`tile` variant).** The Overview **moodboard** (8 thumbnails) now renders via `<dc-import name="components/AssetCard" variant="tile">`. AssetCard extended with a faithful **`tile` variant** (square thumb, small radius, no scrim/shadow, plain colored match badge bottom-right, no dot/type/footer) + `badgeColor` prop — reproduces the original 9px tile exactly. Verified: 8 tiles, correct match badges (92/88/67…), clean load.
  - **Documented as bespoke (no safe migration):** the inline **HITL DNA card** is an *image* before/after diff with an AI-DRAFT badge and an approve→fade→hide animation — migrating to the compact text-diff ApprovalCard would strip the images, badge, and animation (verified-behavior regression). The **hero/panel status chips** are *dotless tinted/glass pills*; StatusChip is a dot+label chip, so swapping would change their look. Left intact per the "stop & document" rule.
- **Matching → StatusChip (partial, by design).** Matching's two surfaces — the swipe deck and the 6-column data table — are bespoke interactions with **no safe shared-card equivalent**; force-fitting a card would change verified visuals or strip the swipe/select interactions, so they stay bespoke (documented). The one safe migration: the table's **Status column** now renders via `<dc-import name="components/StatusChip" bare>`. StatusChip extended minimally — added a **`bare` variant** (borderless mini-indicator to match the dense table) and the **`new`/`saved`/`invited`** statuses (dots `#111`/`#6b7280`/`#059669`, matching the screen). Table view + chips verified pixel-faithful, clean load.

### Added — Component migration Phase 2 (2026-06-29)
- **Assets → AssetCard** — masonry grid renders via `<dc-import name="components/AssetCard">`. AssetCard extended with a masonry variant (image-only, explicit `height`, type label, match badge + dot) alongside the footer/card variant, pass-through props (`imgUrl`, `height`, `matchDot`, `type`, `border`, `onSelect`, `showFooter`). Badge stays dark when the host supplies `matchDot` (parity); low-match flags amber standalone. 12 cards, multi-state masonry + select → panel DNA-match detail verified. Table view left intact.
- **Brand List → BrandCard** — grid renders via `<dc-import name="components/BrandCard">`. BrandCard rebuilt to carry **all three card states** (has-data DNA + pillar flags, analysing with live crawl `/47` + pulse/indeterminate animations, no-data Draft) plus View/Analyse actions, via pass-through props. Verified: DNA+pillars, Zara no-data, Analyse→crawl all working; clean load.
- **Campaigns → CampaignCard** — grid renders via `<dc-import name="components/CampaignCard">`. CampaignCard reworked to the screen's exact layout (status chip bottom-left, mono dates, `X/Y deliverables` + pct bar) and given pass-through props. Selection → IntelligencePanel parity verified.

### Added — Design System Extraction (2026-06-29)
- **`components/` library — 19 reusable Design Components**, each an importable `.dc.html` with typed, Tweaks-editable props, v3 Zeely Editorial, inline-token styled:
  - **Shell:** OperatorShell, NavSidebar, IntelligencePanel, PersistentChatDock, PageHeader.
  - **Cards:** BrandCard, ShootCard, CampaignCard, AssetCard (image-first, status chip, hover hairline).
  - **AI/HITL:** ApprovalCard (pending↔approved), AgentStatusIndicator (idle/thinking/streaming/awaiting-approval).
  - **Inputs:** SearchBar, FilterBar, WizardStep.
  - **Feedback:** StatusChip, SkeletonLoader, EmptyState.
  - **Mobile:** BottomNavigation, BottomSheet.
- **`Component Library.dc.html`** — live gallery rendering every component in its variants/states, grouped by category.
- **`components/COMPONENTS.md`** — full spec per component (purpose · anatomy · desktop/mobile · variants · states · tokens · AI behavior · accessibility · usage · do/don't · screens used) + authoring rules + staged-refactor plan.
- **`OperatorShell.dc.html`** composes the entire 3-panel shell from NavSidebar + PageHeader + PersistentChatDock + IntelligencePanel via `dc-import` — the template for new screens.
- **First screen refactor (proof):** **Shoots List** now renders its grid via `<dc-import name="components/ShootCard">` (screen passes its derived cover/status/border + `onSelect`); selection → IntelligencePanel parity verified, clean load. Remaining screens migrate one-at-a-time per the documented plan (their cards carry masonry/multi-state behavior the generic components omit).

### Added — Mobile More sheet + persistent chat dock (2026-06-29)
- **Mobile More sheet** — the bottom-tab "More" slot now opens a bottom sheet (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account); rows link to the real sibling prototypes and the current page is highlighted. Built two ways: pure-CSS checkbox toggle on the 7 static-markup screens, JS state on Command Center (dynamic `sc-for` tab bar). Resolves the "More shows active but goes nowhere" gap on Campaigns/Matching/Channel Preview.
- **Persistent mobile chat dock** — the workspace chat dock now stays pinned above the bottom tab bar on every panel screen (the `<main>` column reserves the tab-bar height so the dock lifts above it; dock compacted to 16px padding + height-cap on mobile). **Fixed** a Command Center bug where `main > div` padding (instead of `main`) let the dock hide behind the tabs.

### Added — Mobile pass (MOBILE-PLAN §15 Phase 1)
- **`MOBILE-PLAN.md`** — full mobile-first strategy for all 10 screens (bottom-tab nav, sheet primitive, chat dock, per-screen wireframes, gestures, a11y, perf, MVP→Advanced priority).
- **Command Center mobile shell** (reference implementation, `≤1024px`): left rail → **fixed bottom tab bar** (Home · Shoots · Assets · Brands · More, 56px + safe-area, fill/weight active state); IntelligencePanel → **bottom sheet** (90vh, drag handle + close, backdrop dismiss) opened by an **Insights FAB** (badge `3`); workspace gains bottom padding so content clears the tab bar; state-switcher repositioned above tabs. *(Fixes: aside inline `height/overflow` needed `!important` on mobile overrides; and the `transition:transform` on the sheet had to be removed — the runtime restarts it from the hidden state on the toggle re-render, so it never reached `translateY(0)`. Sheet now snaps open instantly.)*
- **Bottom tab bar propagated** to all panel screens — Brand List, Shoots List, Assets, Campaigns, Matching, Channel Preview: rail hidden on mobile, bottom tabs added (active item per route), existing mobile sheets retained (`.sheetbtn` trigger repositioned above the tab bar).
- **Brand Detail mobile** — had no mobile sheet at all; added a **pure-CSS (checkbox-toggle) Insights sheet** (FAB → 90vh sheet, drag-handle + backdrop dismiss, no logic rewrite) plus the bottom tab bar (Brands active). **Onboarding** is a centered single-card wizard with no 3-panel shell — already mobile-friendly, no change. **M6 mobile pass complete across all 10 screens.**

### Added
- **`Channel Preview.v2.image-first.dc.html`** (`/app/preview`, `visual-identity`) — multi-device **Channel Preview Studio**: one shared asset rendered across **Facebook Feed (1:1), Instagram Feed (4:5), Instagram Story (9:16), TikTok (9:16)** in faithful per-platform phone chrome. Controls: asset strip, caption, Image/Video toggle, **safe-zone overlay** toggle. Each frame carries a spec caption (ratio · dimensions · formats). IntelligencePanel = Channel-readiness summary (3 ready / 1 crop-warning, per-channel DNA + status) → tap a channel for **DNA-match breakdown + crop/safe-zone flag + spec + Export**. Visual Identity chat dock. 4 states (Populated, Loading, Empty, Error). **Completes the 10-screen set.**
- **`Matching.v2.image-first.dc.html`** (`/app/matching`, `social-discovery`) — creator matching with the spec's **swipe-card + table variants**. Swipe deck: stacked match cards (creator portrait, platform, follower/engagement/age stats, **fit %**, why-it-matches) with Skip / Save / Invite that advance the deck and update state + the live AI greeting. Table variant: sortable-style creator rows (avatar, platform, followers, engagement, fit bar, status). IntelligencePanel = Discovery summary (90%+ count, avg fit, by-platform) in table/no-selection, else **per-dimension fit breakdown + audience overlap + recent posts** (live with the current card in swipe mode). Social Discovery chat dock. 5 states (Swipe, Table, Loading, Empty, Error). **Closes M5.**
- **`Campaigns.v2.image-first.dc.html`** (`/app/campaigns`, `creative-director`) — image-first CampaignCard grid (16:9 cover, status chip, date range, deliverables count + progress bar). 3-panel shell; IntelligencePanel = Creative summary (live count, open tasks, next deadlines) when none selected, else **deliverable checklist + production timeline** for the selected campaign. Creative Director chat dock. 5 states (Populated, Selected, Loading, Empty, Error).
- **`Assets.v2.image-first.dc.html`** (`/app/assets`, `visual-identity`) — **masonry AssetGrid** + **DataTable** view toggle, FilterBar (type + DNA-match + search), AssetCard with DNA-match % badge (low matches flagged). IntelligencePanel = Library stats (1,240 assets, avg match, by-type) when none selected, else **per-pillar DNA-match breakdown + used-in** for the selected asset. Visual Identity chat dock. Empty = "No assets yet" + Upload / Let AI find them. 5 states. **Closes M4.**
- **`Shoot Wizard.v2.image-first.dc.html`** (`/app/shoots/new`) — AI-first **Production Planner**, not a form wizard. One stepped DC (shared state = AI "remembers" across steps): top bar (brand · step N/10 · Back/Continue→Create shoot), horizontal step rail with done-checkmarks, and a **persistent bottom AI chat dock** whose greeting + input hint + are context-aware per step. 10 steps — Welcome (editorial hero + 3 action cards), Basics (form + AI suggested-plan), Creative Brief (fields + before→after luxury diff), Moodboard (8 refs w/ lock/regenerate + why-it-matches), Shot List (editable rows + chips), Production (resource cards, 1 missing flagged), Budget (breakdown bars + savings), Timeline (dependency phases), Call Sheet (team/arrival/shot-order/exports), Review (Production 94 / Brand DNA 92 / 96% confidence + summary + Create shoot). Image-first throughout. Closes M3.
- **`Brand List.v2.image-first.dc.html`** (`/app/brand`, `brand-intelligence`) — image-first brand-card grid (16:9 cover, status chip on image, big mono DNA score, pillar row with weakest-pillar `*` flag, View/Analyse). 3-panel shell with portfolio-health IntelligencePanel (avg DNA, brand rows, needs-attention, approvals, tabs) + Brand Intelligence chat dock. All 5 states incl. **in-place Analyse** (card crawl progress → re-scores). Closes M2.
- **`Onboarding.v2.zeely.dc.html`** — built the 13-screen Zeely-style onboarding prototype (green accent confirmed): black backdrop + striped-globe motif, white floating cards, black pill CTAs w/ green arrow, 3-segment progress. Interleaved ask→reassure→educate flow: social-proof welcome · build-type radio · before/after DNA · brand inputs (debounced URL preview) · brand-listed checkboxes (brand glyphs) · testimonial · growth radio + affirmation · 4 value-prop screens (ads phone mock, monthly-goals, social funnel, content grid) · full-black AI analysis (auto-advancing checklist + progress) · animated DNA-ready payoff. Real fashion photos from `images/`. Keyboard nav + review dock. *(known runtime quirk handled: `componentDidUpdate` doesn't fire — analysis is driven from nav handlers; entrance opacity animations removed to avoid the keyframe-restart blank-card bug.)*
- **Onboarding plan + wireframes** (`prompts/08-onboarding-plan.md`) \u2014 Zeely-style 13-screen acquisition flow with interleaved ask/reassure/educate rhythm, full visual system (black + striped-globe motif + green local accent + white cards), component patterns, per-screen wireframes, and build notes. Open decision: green accent vs pure B/W.

### Planned
- Restyle existing prototypes to v3 (verify pure white/grey/black, Inter, image-first, chat dock).
- Add the global AI chat dock to every operator screen as they're built.
- Decide final HITL amber treatment (keep vs neutral vs benchmark green).
- Extract image-first components (`ImageThumb`, `MediaCard`, `AIPreviewCard`, `Moodboard`, `PaletteStrip`) + `AIChatDock`.

---

## 2026-06-28 — v3 "Zeely Editorial" design-system decision

### Changed
- **Adopted v3 "Zeely Editorial" as the required direction for all new screens** (supersedes v2 "Atelier"). Pure white / light-grey / charcoal / black; **Inter** primary UI font (Geist Mono numbers only); **black** primary actions; **orange retired** as chrome (opt-in only for a named AI action); 20px card + image radii.
- **`tokens.css` → v3**: warm "stone" primitives replaced by a **pure neutral grey scale** (`#FAFAFA → #111111`); page bg pure white (no beige); focus ring + streaming cursor charcoal; `--color-accent` resolves to black. Added `--font-sans` (Inter) / `--font-mono`, `--chatdock-*`, quiet-grey `--ai-badge-*`, and the missing `--color-blocked-light`.
- **`DESIGN.md`, `redesign-spec.md`, `image-strategy.md`, `00-README.md`, `prompts/00-universal.md` → v3**: pure palette + Inter + black actions throughout; rewrote redesign-spec as an Atelier→Zeely migration with a 6-phase checklist.

### Added
- **Global AI chat dock rule** — every operator screen carries a persistent, context-aware chat dock at the base of the center workspace (greeting names the active object; never "How can I help?"; quick chips + streaming status + black send). Added to DESIGN.md §5I, README, universal prompt, all page prompts, and the `AIChatDock` component + `--chatdock-*` tokens.
- **Image subject/sourcing rules** — editorial fashion photography of **female models in apparel**; prefer uploaded `app/design/images`; never random stock / illustration / office / glamour. Added across DESIGN.md §5H, image-strategy.md, README, and every page prompt.
- **All page prompts updated to v3** (`03-shoots`, `04-brand-list`, `05-shoot-wizard`, `06-campaigns`, `07-assets`, `09-matching`, `10-channel-preview`, `08/09-onboarding`): black buttons, white secondaries, thin grey borders, Inter, image-first layouts, bottom chat dock, 3-panel shell retained (onboarding standalone), all 5 states kept.

---

## 2026-06-28 — Shoots List + Zeely-pure across v2

### Added
- **`Shoots List.v2.image-first.dc.html`** (`/app/shoots`) — 3-panel shell, cover-first `ShootCard` grid (4:3 covers, status chip + DNA badge on image), search + brand/date filter, **filter chips** (All · Draft · Confirmed · In Production · Complete, functional), floating `+ New shoot`, **selected-shoot preview + shot-list** in the IntelligencePanel, **mobile bottom-sheet** for the panel. States: populated · selected · loading · empty (illustrated) · error. Real `images/` photos, Zeely-pure monochrome.

### Changed
- **Command Center v2** restyled to Zeely-pure to match Brand Detail (pure white, Inter, black buttons, grey AI badges, 20px images).

---

## 2026-06-28 — Zeely-pure restyle + real photography

### Changed
- **Brand Detail v2 → Zeely-minimal**: pure-white bg `#FFFFFF`, light-grey `#FAFAFA` surfaces, `#E5E7EB` borders, `#111`/`#6B7280` text, **Inter** font, black primary buttons, **subtle grey AI badge** (amber removed), softer shadows, 20px image radii. No beige, no orange/yellow accents.
- **Real images wired in**: both v2 prototypes now reference the user's uploaded fashion photos from `images/5-fashionos.jpeg`…`16-fashionos.jpeg` (deterministic key→file map) instead of random stock — hero, asset moodboard, before/after strips, nav thumbnails.

### Notes
- Random stock services (picsum/loremflickr) can't guarantee on-brand/clothed content; replaced with curated project images. In production these become `<image-slot>` drop targets.

---

## 2026-06-28 — v2 "Atelier" + image-first

### Changed
- **Accent retired from orange → charcoal.** `--color-accent` and `--color-border-focus` now resolve to `--primitive-ink-900`; AI Approve button, accent dots, brand active-dot, and streaming cursor read black — closer to the benchmark's monochrome restraint. Amber retained for HITL pending only; green/red for status. Applied to both v2 prototypes.
- **New visual language v2 "Atelier"** (visual-only; AI/HITL/3-panel unchanged): white-forward surfaces (`#FBF8F5`→`#FCFBF9`), warm-neutral charcoal text (`#1E293B`→`#1A1A18`), **charcoal primary buttons** (orange no longer a primary), **hairline borders instead of shadows** (`--shadow-card` near-invisible), card radius 10px→16px, calm grey nav active state, white ApprovalCards with an amber hairline + dot (no `#FFFBF0` fill).
- `DESIGN.md` rewritten (Design Principles, Colour System, Cards, Typography, Buttons, Navigation, Tables, Empty States, AI Components, Approval Cards). `redesign-spec.md` carries the full token delta + migration checklist. Old `design-plan.md` archived.

### Added
- **Image-first layer** (DESIGN.md §5H + `image-strategy.md`): photography is the hero, neutral chrome supplies restraint, one consistent 16px image frame, per-content-type aspect ratios, large AI previews before approval, editorial galleries/moodboards. Per-screen audit for all 10 screens. New image tokens: `--image-radius`, `--image-radius-sm`, `--image-border`, `--image-placeholder-bg`, `--image-scrim`.
- **`Command Center.v2.image-first.dc.html`** — brand-hero greeting MediaCard, Recent-work moodboard row, image-thumb approval cards, and a **large AI-preview** approval state (4:5 generated creative + brand-match chip + visual lineage). Charcoal primary, calm nav, image brand avatars.
- **`Brand Detail.v2.image-first.dc.html`** — brand-hero header band (NIKE lockup + DNA 87), before/after as **image strips**, Visual-identity **palette + sample-frame strip**, image **asset moodboard**, **live crawl thumbnails** in the analysing state, image-first No-DNA CTA.
- **`Brand Detail.dc.html`** (base) — `/app/brand/[id]`, all 5 states, inline HITL DNA draft, target-marked IntelligencePanel.

### Notes
- Photography is represented by editorial **duotone gradient placeholders** so the files are self-contained; in production these become real `<image-slot>` photos.
- Token gap flagged: Discard-hover uses a literal `#fdecec` — add `--color-blocked-light` to `tokens.css`.

---

## 2026-06-28 — Plan/Todo audit (rev 2)

### Changed
- Audited `plan.md` + `todo.md` against the live codebase (`route-agent-map.ts`, `mastra/index.ts`, `durable.ts`, `operator-panel.tsx`, `nav-sidebar.tsx`). Scores 90 / 92. Fixed agent map, corrected IntelligencePanel status (🟡 — production is a bare CopilotSidebar), removed stale `.dc.html`/"DC" wording, added Cross-cutting states + Production-parity tasks, milestone prototype-vs-production clarifier.
- Archived `design-plan.md` → `archive/2026-06-design-setup-plan.md` (stale pre-implementation setup doc).

---

## 2026-06-28 — Command Center (base)

### Added
- **`Command Center.dc.html`** (`/app`) — first operator screen: 3-panel shell (collapsible NavSidebar · Workspace · always-white IntelligencePanel), DNA score + pillars, 3 HITL ApprovalCards, all 5 states via a state switcher, 1024px breakpoint. Token-driven, Geist Sans/Mono.

### Fixed
- Added `--nav-width-collapsed` / `--nav-width-expanded` to the prototype `:root` (already present in `tokens.css`).

### Changed
- DNA bars render statically (the runtime restarts keyframe entrance animations); animation disabled under `prefers-reduced-motion` regardless.
