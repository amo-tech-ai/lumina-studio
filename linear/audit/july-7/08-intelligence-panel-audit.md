# 08 — Intelligence Panel Forensic Audit

**Date:** 2026-07-07 · **Auditor:** Forensic audit agent
**Scope:** IPI-219, 243, 244, 247, 255, 284, 285, 286, 306
**Sources:** Linear · `app/src/components/intelligence-panel/` · `app/src/lib/intelligence/` · `app/src/app/api/intelligence/` · PR #164 · PR #171 · PR #149

---

## Step 1 — Repository Discovery

### Task Inventory

| IPI | Title | Linear Status | Actual Status | Grade |
|-----|-------|:-------------:|:-------------:|:-----:|
| 219 | Asset grid in brand context right panel | Done ✅ | ✅ Merged (PR #128) — `GET /api/brands/[id]/assets` + `BrandContextPanel` grid | 95/100 |
| 243 | INTEL-001 Build IntelligencePanel shell | Done ✅ | ✅ Phase A merged (PR #149). Phase B (assets, suggestions, tabs) never shipped | 65/100 |
| 244 | INTEL-002 ApprovalQueue + HITL | Done ✅ | ✅ Merged (PR #181). ApprovalCards + route wire. Done Jul 7 | 90/100 |
| 247 | DESIGN-070 Route-Agent Map Parity | Done ✅ | ✅ Merged (PR #147). All 4 routes mapped: assets→creative-director, matching→social-discovery, preview→visual-identity, onboarding→brand-intelligence | 95/100 |
| 255 | LIVE-071 Live Intelligence Data | Done ✅ | ✅ Merged (PR #151). Scores + approvals shipped. Assets/suggestions/sections deferred from original scope | 70/100 |
| 284 | Asset Thumbnail Grid | Canceled ❌ | ❌ Correctly canceled. PR #164 branch `ipi/286-route-aware-sections` never merged. Code exists only on stale branch | 100/100 (correct state) |
| 285 | AI Suggestion Rail | Backlog ⚪ | ⚪ Correctly in Backlog. PR #164 code exists on stale branch but should be re-audited against current panel architecture | 100/100 (correct state) |
| 286 | Route-Aware Context Sections | Done ✅ | ❌ **FALSE DONE.** `panelSections` routing exists only on unreferenced stale branch `ipi/286-route-aware-sections`. Zero route-aware sections on main. Linear status is wrong | 10/100 |
| 306 | CC-INT-001 Intelligence Panel Parity | Done ✅ | ✅ Merged (PR #171). Tabbed panel (Overview/Approvals/Activity), HealthSection, IntelApprovalQueueSection, PortfolioPanelSection, RecentActivitySection. Correct—matched scope | 90/100 |

### Architecture Map (current on main)

```
GET /api/intelligence/panel?brandId=<uuid>
  └─ withOperatorAuth
  └─ Supabase: brands + brand_scores WHERE brand_id
  └─ buildPanelData(brand, scores, pendingApprovals)
  └─ Returns: IntelligencePanelData { brand, scores, approvals, portfolio }

useIntelligencePanel(activeBrandId, mode)
  └─ Fetches /api/intelligence/panel (fetch + 30s polling)
  └─ Dev skip via ?skip=1 (DEV_INTELLIGENCE_PANEL_DATA fixture)
  └─ Returns: { data, loading, error, reload }

IntelligencePanel ({ activeBrandId, brandName })
  └─ resolveRouteBriefing(pathname) → { section, headline, nextActions }
  └─ IntelligencePanelSections { data, tab, mode }
       ├─ PortfolioPanelSection (brand list mode)
       ├─ HealthSection (DNA scores + pillars)
       ├─ IntelApprovalQueueSection
       ├─ BrandDetailPanelExtras
       └─ RecentActivitySection
  └─ Tabs: Overview | Approvals | Activity
```

### Dependencies

```
IPI-218 (3-panel shell) → IPI-219 (asset grid)
IPI-218 → IPI-243 (panel shell) → IPI-244 (approvals)
IPI-243 → IPI-255 (live data)
IPI-247 (route map) → IPI-255
IPI-255 → IPI-284/285/286 (Phase B — never merged)
IPI-305 (CC epic) → IPI-306 (panel parity)
```

---

## Step 2 — Architecture Audit

### Component Hierarchy (on main, post-IPI-306)

```
OperatorPanel
  └─ IntelligencePanel (right side, 332px)
       ├─ Brand picker row
       ├─ IntelligencePanelSections
       │    ├─ BrandDetailNoDnaBlock (brand detail, no scores)
       │    ├─ HealthSection (DNA + pillar scores)
       │    ├─ BrandDetailPanelExtras
       │    ├─ IntelApprovalQueueSection
       │    ├─ PortfolioPanelSection (brand list mode)
       │    └─ RecentActivitySection
       └─ Tab bar (Overview | Approvals | Activity)
```

### Dead Code / Stale Files

| File | Status | Issue |
|------|--------|-------|
| `ai-insights-section.tsx` | On main, NEVER imported | Exports `AiInsightsSection` but `IntelligencePanelSections` never renders it. `panel-contract.ts` defines `IntelligenceInsight[]` but `buildPanelData` returns empty `[]`. Dead component |
| `recommended-actions-section.tsx` | On main, NEVER imported | Same pattern — component exists, types in contract, but no data source on main |
| `assets-grid.tsx` | Branch only (`ipi/286-route-aware-sections`) | PR #164 never merged. Exists only on stale branch |
| `suggestion-rail.tsx` | Branch only | Same as assets-grid |
| `generate-suggestions.ts` | Branch only | Same as assets-grid |
| `build-thumb-url.ts` | Branch only | Same as assets-grid |
| Branch `ipi/286-route-aware-sections` | **PR #164, NEVER MERGED** | Closed with comment "Superseded. IPI-286 shipped inline in IPI-306." — but route-aware sections were never ported |

### Technical Debt

1. **`ai-insights-section.tsx` dead on main** — component compiles, passes tests, but has zero callers. ~28 lines of dead code shipped by IPI-306.
2. **`recommended-actions-section.tsx` dead on main** — same pattern. ~32 lines of dead code.
3. **Route briefing only returns text** — `resolveRouteBriefing` returns `{ section, headline, nextActions }` but this is only used for display in the panel header. **No route-aware section filtering exists.** The panel shows the same sections regardless of route.
4. **`panelSections` field exists only on stale branch** — PR #164 added `panelSections?: PanelSectionType[]` to `RouteBriefing`, but this was never merged. IPI-306's panel always shows the same structure.

### Code Quality

| Metric | Score | Notes |
|--------|:-----:|-------|
| Cyclomatic complexity | 🟡 | `IntelligencePanel` has 11 conditional branches for state handling. Codacy flagged this at PR #164 (51 complexity). IPI-306 is similar |
| Duplication | 🟢 | `buildPanelData` + `useIntelligencePanel` hook cleanly separated |
| Component size | 🟢 | Largest: `intelligence-panel.tsx` (205 lines). Good |
| Error handling | 🟡 | API route handles 401/400/404/500. Panel handles loading/error/empty. No network retry on fetch failure |
| CSS modules | 🟢 | All styles via `intelligence-panel.module.css`. Tokens via CSS variables |

---

## Step 3 — Task Verification

### IPI-219 — Asset grid in brand context panel
- **Grade:** 95/100 ✅
- **Evidence:** `GET /api/brands/[id]/assets/route.ts` exists. `BrandContextPanel` shows 6-thumbnail grid. PR #128 merged.
- **Status:** Keep ✅

### IPI-243 — INTEL-001 Panel shell (Phase A)
- **Grade:** 65/100 🟡
- **Evidence:** Phase A (panel shell + briefing + chat slot) merged in PR #149. Phase B (thumbnails, suggestion rail, tabs, evidence sections) explicitly deferred and **never implemented**.
- **Linear claims Done** — accurate only for Phase A. Phase B scope moved to IPI-284/285/286.
- **Status:** Keep ✅ (scope split already documented)

### IPI-244 — INTEL-002 ApprovalQueue + HITL
- **Grade:** 90/100 ✅
- **Evidence:** PR #181 merged. `IntelApprovalQueueSection` + `IntelApprovalCard` + `applyDraft` actions. Wire via `POST /api/workflows/brand-intelligence/approve`. Tests pass.
- **Status:** Keep ✅

### IPI-247 — Route-Agent Map Parity
- **Grade:** 95/100 ✅
- **Evidence:** PR #147 merged. 4 routes correctly mapped. `route-agent-map.test.ts` green.
- **Status:** Keep ✅

### IPI-255 — Live Intelligence Data Integration
- **Grade:** 70/100 🟡
- **Evidence:** PR #151 merged. Scores + approvals shipped via `GET /api/intelligence/panel`. Assets endpoint never built at panel level. Suggestions endpoint never merged. Original DESIGN-071 scope (assets + suggestions + route sections + SWR) was **never completed**.
- **Linear claims Done** — true for scores/approvals. Remainder deferred to IPI-284/285/286 (which also never shipped).
- **Status:** Keep ✅ (partial ship documented)

### IPI-284 — Asset Thumbnail Grid
- **Grade:** 100/100 (correct state) ✅
- **Evidence:** Canceled Jul 7. Correct — code exists on stale PR #164 branch, never ported into IPI-306 architecture.
- **Status:** ❌ Canceled — correct. No action needed.

### IPI-285 — AI Suggestion Rail
- **Grade:** 100/100 (correct state) ✅
- **Evidence:** Backlog correctly. Should stay Backlog until re-audited against current tabbed panel.
- **Status:** ⚪ Backlog — correct. No action needed.

### IPI-286 — Route-Aware Context Sections
- **Grade:** 10/100 🔴
- **Linear claim:** Done ✅
- **Truth:** **FALSE DONE.** Zero route-aware sections on `main`. PR #164 (`ipi/286-route-aware-sections`) was closed with comment "Superseded. IPI-286 shipped inline in IPI-306." — but IPI-306's panel is a tabbed panel with **no** route-aware section filtering. The `panelSections` field in `RouteBriefing` only exists on the stale branch.
- **Status:** 🔴 **Fix:** Must downgrade Linear to Backlog and update to reflect no implementation.

### IPI-306 — CC-INT-001 Intelligence Panel Parity
- **Grade:** 90/100 ✅
- **Evidence:** PR #171 merged. Tabbed panel with 6 DC-parity sections: Brand summary, Health, Approval queue, Recommended actions, Recent activity. Matches spec scope.
- **Status:** Keep ✅

---

## Step 4 — PR Audit

### PR #164 — IPI-284/285/286 Phase B
| Field | Value |
|-------|-------|
| Branch | `ipi/286-route-aware-sections` |
| State | **CLOSED, NOT MERGED** |
| Mergeable | ❌ **CONFLICTING** |
| Files | 15 files, +416/-81 lines |
| Reviews | Optibot: Code Looks Good 👍 (last review) |
| Closed | 2026-07-07 |
| Reason | "Superseded. IPI-286 route-aware sections shipped inline in IPI-306. IPI-284 cancelled. IPI-285 moved to Backlog." |

**Reality check:** IPI-306 shipped a tabbed panel without route-aware sections. The `panelSections` feature from PR #164 was **never ported**. The supersede comment is incorrect — route-aware sections do not exist on main.

**Recommendation:** Close the PR branch (no value in merging stale branch). Create new issue for route-aware sections scoped to current IPI-306 architecture.

### PR #171 — IPI-306 Intel Panel Parity
| Field | Value |
|-------|-------|
| Branch | `ai/ipi-306-cc-int-001-intelligence-panel-parity` |
| State | Merged ✅ |
| SHA | On `origin/main` |

### PR #149 — IPI-243 Panel Shell
| Field | Value |
|-------|-------|
| Branch | `ai/ipi-243-intel-001-build-intelligencepanel-context-dna-assets` |
| State | Merged ✅ |

### PR #151 — IPI-255 Live Data
| Field | Value |
|-------|-------|
| Branch | `ai/ipi-255-design-071-live-intelligence-data-integration` |
| State | Merged ✅ |

### PR #181 — IPI-244 ApprovalQueue
| Field | Value |
|-------|-------|
| Branch | `ai/ipi-244-intel-002-approvalqueue-hitl-write-actions-in` |
| State | Merged ✅ |

---

## Step 5 — Testing Audit

### Current Test Coverage

```
app/src/components/intelligence-panel/
  intelligence-panel.test.tsx       — 11 tests (panel rendering, tabs, portfolios, states)
  route-briefing.test.ts            — route briefing tests (not read)

app/src/lib/intelligence/
  build-panel-data.test.ts          — panel data construction tests
  build-portfolio-panel-data.test.ts — portfolio data tests
  panel-helpers.test.ts             — helper tests
  panel-scores-fallback.test.ts     — score fallback tests
  panel-approval-fallbacks.test.ts  — approval fallback tests
  panel-detail-fallbacks.test.ts    — detail fallback tests
  use-route-suggestions.test.ts     — route suggestion tests
  use-route-welcome.test.ts         — welcome screen tests
  normalize-route-path.test.ts      — route path tests

app/src/app/api/intelligence/panel/
  route.test.ts                     — API route tests (auth, validation, scores, approvals)
```

### Test Coverage Gaps

| Area | Coverage | Gap |
|------|:--------:|-----|
| Panel rendering | 🟢 Good | 11 tests cover tabs, badges, states, portfolios |
| API route | 🟢 Good | Auth, validation, scores, approvals |
| Unit tests (lib) | 🟢 Good | 8 test files covering helpers and data |
| **IntelApprovalQueueSection** | 🔴 **0 tests** | `IntelApprovalCard` approval flow untested outside route context |
| **IntelApprovalCard** | 🔴 **0 tests** | No component-level tests for approve/edit/reject UI |
| **HealthSection** | 🔴 **0 tests** | DNA display, pillar rendering, score coloring untested |
| **RecentActivitySection** | 🔴 **0 tests** | Activity group display untested |
| **PortfolioPanelSection** | 🔴 **0 tests** | Portfolio health rendering untested |
| **BrandDetailPanelExtras** | 🔴 **0 tests** | Detail extras rendering untested |
| **AiInsightsSection** | 🟡 N/A | Dead code — never rendered |
| **RecommendedActionsSection** | 🟡 N/A | Dead code — never rendered |
| **Accessibility tests** | 🔴 **None** | No a11y audit |
| **Playwright/E2E** | 🔴 **None** | No browser-level panel tests |

---

## Step 6 — Production Audit

| Category | Score | Evidence |
|----------|:-----:|----------|
| 🟢 **Architecture** | **80/100** | Clean tabbed panel with 3 sections. No route-awareness. 2 dead components shipped. Scoring route-sharing is OK for MVP |
| 🟢 **Frontend** | **75/100** | CSS modules, tokens, tabs. `class-variance-authority`-style not used. Codacy flagged 51 cyclomatic complexity. 2 dead components (AiInsightsSection, RecommendedActionsSection) on main |
| 🟢 **Backend** | **85/100** | `GET /api/intelligence/panel` handles auth/validation/errors. Portfolio mode works. No suggestions API. No assets API at panel level |
| 🟢 **AI integrations** | **40/100** | `AiInsightsSection` is dead code — never populated. `RecommendedActionsSection` is dead code. No AI-generated suggestions hit the panel. Route-briefing is static text, not AI-driven |
| 🟢 **Security** | **95/100** | `withOperatorAuth` on all routes. RLS on Supabase. No data leakage. Service role never in panel code |
| 🟢 **UX** | **70/100** | Works with real data for scores + approvals. Portfolio mode works. Loading/error/empty states present. No asset thumbnails visible. No AI insights visible. Same content regardless of route (no context-awareness) |
| 🟢 **Documentation** | **50/100** | IPI-286 falsely marked Done. IPI-255 claims full completion but 3+ features deferred. IPI-243 Phase B scope never shipped |
| 🟢 **Testing** | **55/100** | 11 panel tests, good API tests, but 6 sub-components have zero tests. No E2E. No accessibility |

### Overall Production Score: **69/100 ⚪**

---

## Step 7 — Final Report

### Executive Summary

The Intelligence Panel has shipped a functional tabbed panel covering brand health scores, approval queue, portfolio view, and recent activity. However, **key Phase B features never landed**:

- PR #164 (assets grid + suggestions + route-aware sections) was closed as "superseded" but never ported
- IPI-286 is **falsely marked Done** — zero route-aware sections on main
- 2 components (`AiInsightsSection`, `RecommendedActionsSection`) are **dead code** on main — shipped but never wired
- AI integration is minimal — no AI-generated suggestions reach the panel

### Top Risks

| Risk | Severity | Detail |
|------|:--------:|--------|
| IPI-286 falsely Done | 🔴 High | Linear status wrong. Route-aware sections do not exist. Will cause confusion for anyone planning work |
| 2 dead components shipped | 🟡 Medium | Dead code adds maintenance burden, confuses developers |
| No AI insights reaching panel | 🟡 Medium | AI Insights + Recommended Actions sections have zero data sources. They exist as UX skeletons only |
| PR #164 branch still exists | 🟢 Low | Stale branch with merge conflicts. Close/delete to prevent confusion |

### Critical Fixes (P0)

| # | Fix | Effort |
|---|-----|--------|
| 1 | **Fix IPI-286 Linear status** — Change from Done → Backlog. Add comment explaining route-aware sections not yet shipped | 5min |
| 2 | **Remove dead code** — Delete `ai-insights-section.tsx` and `recommended-actions-section.tsx` OR wire them to actual data sources | 15min |

### Improvements (P1/P2)

| # | Improvement | Effort | Pri |
|---|-------------|--------|:---:|
| 3 | Wire AI insights from panel data (empty `[]` → actual Gemini-derived insights) | 4h | P1 |
| 4 | Wire recommended actions from panel data | 3h | P1 |
| 5 | Add at least route-aware tab selection (shoot route → show shoot-relevant suggestions) | 3h | P2 |
| 6 | Add tests for HealthSection, IntelApprovalQueueSection, RecentActivitySection | 2h | P2 |
| 7 | IPI-285 (AI Suggestion Rail) — re-scope against current tabbed panel architecture | 1h spec | P2 |
| 8 | Delete stale branch `ipi/286-route-aware-sections` | 5min | P2 |

### Stale Tasks

| IPI | Status | Action |
|-----|--------|--------|
| 286 | Done (should be Backlog) | **Fix Linear — move to Backlog** |

### Missing Linear Tasks

- None discovered. Architecture is accounted for.

### Recommended Implementation Order

1. 🛑 **P0: Fix IPI-286 status** + remove dead components
2. 🔵 IPI-285 (Suggestion Rail) — re-scoped to tabbed panel architecture
3. 📋 Route-aware sections — new issue scoped to IPI-306 architecture
4. 🧪 Sub-component tests for HealthSection, IntelApprovalQueueSection, RecentActivitySection

### Production Readiness

| Area | Score | Grade |
|------|:-----:|:-----:|
| Architecture | 80/100 | 🟡 |
| Frontend | 75/100 | 🟡 |
| Backend | 85/100 | 🟡 |
| AI integrations | 40/100 | 🔴 |
| Security | 95/100 | 🟢 |
| UX | 70/100 | 🟡 |
| Documentation | 50/100 | 🔴 |
| Testing | 55/100 | 🔴 |
| **Composite** | **69/100** | **⚪ Significant work remains** |

### Final Verdict

**🟡 69/100 — Significant work remains. Core panel works for scores + approvals. AI integration is minimal (0% of AI sections reach panel). Route-awareness is entirely absent despite IPI-286 claiming Done. 2 dead components shipped. 6 sub-components untested.**

---

## Check List

- [x] Step 1 — Repository Discovery
- [x] Step 2 — Architecture Audit
- [x] Step 3 — Task Verification (9 tasks)
- [x] Step 4 — PR Audit (5 PRs reviewed)
- [x] Step 5 — Testing Audit (11 tested, 6 untested components)
- [x] Step 6 — Production Audit (8 areas scored)
- [x] Step 7 — Final Report
