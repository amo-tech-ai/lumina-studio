# Design Parity QA Checklist — Command Center + Brand List/Detail

**Date:** 2026-07-02  
**Branch under test:** `ipi/design-command-brand-parity` (worktree `/home/sk/wt-ipi-272-brand-list-dc-parity`)  
**React base URL:** `http://localhost:3002`  
**DC reference server:** `http://localhost:8765`  
**QA account:** `qa@ipix.test` (live Supabase — 1 brand: Maaji)  
**Brand detail ID tested:** `942ed871-932f-44a2-a377-9c404cb82400`

---

## Automated verification

| Check | Command | Result |
|-------|---------|--------|
| Lint | `cd app && npm run lint` | 🟢 pass |
| Unit/integration tests | `cd app && npm test` | 🟢 **557 passed**, 6 skipped |
| Typecheck | `cd app && npx tsc --noEmit` | 🟢 pass |
| Production build | `cd app && CI=true npm run build` | 🟢 pass |
| Playwright (full) | `npx playwright test --project=chromium-desktop` | 🟡 **30 passed**, 2 failed, 1 flaky |

### Playwright failures (not all design-parity blockers)

| Spec | Result | Notes |
|------|--------|-------|
| `e2e/intelligence-panel-dc-verify.spec.ts` | 🔴 fail | **Stale test** — expects removed `"Target design — IntelligencePanel not production-wired yet"` banner |
| `e2e/brand-detail-console-clean.spec.ts` | 🟡 flaky | Intermittent `useCopilotKit must be used within CopilotKitProvider` SSR fallback console error |
| `e2e/03-shoot-tools-api.spec.ts` | 🔴 fail | Unrelated to design parity (shoot tool registry) |
| `e2e/command-center-dc-parity-screenshots.spec.ts` | 🟡 flaky | Mobile `networkidle` timeout on `/app` |
| `e2e/suspense-console-forensics.spec.ts` | 🟢 pass | 0 Suspense-boundary errors (merged in #178) |
| `e2e/brand-dc-parity-screenshots.spec.ts` | 🟢 pass | DC + React screenshots captured |

---

## Routes tested

| Route | Desktop 1280 | Tablet 768 | Mobile 390 | Console | Network |
|-------|--------------|------------|------------|---------|---------|
| `/app` | 🟢 | ⚪ not tested | 🟡 partial (content loads; screenshot timing flaky) | 🟢 no app errors in MCP session | 🟢 |
| `/app/brand` | 🟢 | ⚪ not tested | 🟢 search, chips, card, chat dock | 🟢 | 🟢 |
| `/app/brand/942ed871-…` | 🟢 | ⚪ not tested | ⚪ not tested | 🟡 CopilotKit SSR fallback (Playwright flaky) | 🟢 |

---

## Screenshots captured

Evidence directory: `docs/qa/screenshots/2026-07-02/` (copied from Playwright run)

| File | Description |
|------|-------------|
| `commandCenter-dc-desktop-v2.png` | DC reference — Command Center |
| `commandCenter-react-desktop-v2.png` | React `/app` desktop |
| `commandCenter-react-mobile-v2.png` | React `/app` mobile |
| `brandList-dc-desktop.png` | DC reference — Brand List |
| `brandList-react-desktop.png` | React `/app/brand` desktop |
| `brandDetail-dc-desktop.png` | DC reference — Brand Detail (Nike) |
| `brandDetail-react-desktop.png` | React brand detail (Maaji live data) |
| `intel-panel-dc-verify.png` | DC intel panel structure |

---

## Visual parity score (vs DC HTML)

Scoring: layout · spacing · cards · images · typography · right panel · states · responsive

### 1. Command Center (`/app`)

| Area | Score | Notes |
|------|-------|-------|
| Overall | 🟡 **~85%** | Strong structural match; live data differs from Nike fixture |
| Recent Work row | 🟢 | Image-first cards with score badges, titles, aspect labels |
| Hero / greeting card | 🟢 | Image + brand name + next-step copy |
| Quick action chips | 🟢 | Generate / Review / Plan row present |
| Intelligence Panel | 🟢 | DNA score bars, Approvals queue (Approve/Edit), Overview/Approvals/Activity tabs |
| Debug UI removed | 🟢 | No DC `STATE` switcher; no target banner in React |
| Chat dock | 🟢 | Input + quick-action pills |
| Gaps | 🟡 | Recent-work subtitles all show `IG · 4:5` (DC varies Reel/Video); live Maaji vs Nike hero |

### 2. Brand List (`/app/brand`)

| Area | Score | Notes |
|------|-------|-------|
| Overall | 🟡 **~80%** | Core grid + panel shipped; filter naming + sort affordance differ |
| Image-first grid | 🟢 | 16:9 cover, status pill, DNA bar, 4 pillar mini-scores, View/Analyse |
| Search + filter chips | 🟢 | Search input + All/Active/Analysing/Draft |
| Portfolio right panel | 🟢 | Portfolio tab, brand row, Approvals summary, bottom tabs |
| Loading/empty/error | 🟡 | Skeleton/empty components exist; not re-verified with forced states this run |
| Responsive mobile | 🟢 | Single-column card, filters wrap, chat dock pinned |
| Debug UI removed | 🟢 | No DC `STATE` switcher |
| Gaps | 🟡 | Missing **Sort · DNA score** button; DC chips use Ready/Failed vs Active/Draft; QA org has 1 brand (DC shows 3-up grid) |

### 3. Brand Detail (`/app/brand/[id]`)

| Area | Score | Notes |
|------|-------|-------|
| Overall | 🟡 **~75%** | Hero + pillars + panel strong; AI draft section missing |
| Image-first hero | 🟢 | Cover band, name overlay, status chip, DNA score badge |
| DNA pillars | 🟢 | 4 clickable rows (Visual/Audience/Consistency/Commerce Readiness) |
| CTA row | 🟢 | Improve Visual · Plan a shoot · Review assets |
| Detail right panel | 🟢 | DNA bars, history timeline, visual identity swatches, profile, assets link, tabs |
| AI draft / before-after | 🟡 | **Implemented** (`BrandDetailDraftCard`) but **not visible** for Maaji — renders only when `status === "draft_ready"`; DC always shows populated fixture |
| Assets strip | 🟢 | Region present (`Assets (8)` + Review link) |
| Data wiring | 🟢 | Live Maaji crawl state, real scores, panel enrichment |
| Gaps | 🟡 | Crawl progress shows **"50 of 0 pages crawled"** (denominator bug); evidence dialog not re-tested in browser this run |

---

## Console status

| Context | Status |
|---------|--------|
| MCP Chrome DevTools — `/app/brand` | 🟢 no captured app console errors |
| Playwright clean Chromium — Suspense forensics | 🟢 0 Suspense-boundary errors |
| Playwright — brand detail | 🟡 flaky `useCopilotKit must be used within CopilotKitProvider` (SSR → client fallback; page still renders) |
| React DevTools extension noise | ⚪ N/A in Playwright; known extension-only per PR #178 |

---

## Network status

| Check | Status |
|-------|--------|
| Page loads (200/302) | 🟢 |
| Panel API `/api/intelligence/panel` | 🟢 |
| Broken hero images | 🟢 fallbacks render |
| 404 favicon | 🟢 benign (ignored in forensics) |

---

## Blockers

| ID | Severity | Issue | Owner action |
|----|----------|-------|--------------|
| B1 | 🟡 | Brand Detail **AI draft** not visible in QA run (Maaji = analysing, not `draft_ready`) | Verify with a `draft_ready` brand or `?skip=approval` fixture before merge |
| B2 | 🟡 | Stale `intelligence-panel-dc-verify.spec.ts` asserts removed banner | Update test assertions before PR merge |
| B3 | 🟡 | Crawl progress **"50 of 0 pages"** display | Fix total-pages denominator |
| B4 | 🟡 | Brand detail CopilotKit SSR console error (flaky) | Confirm prod build + add to benign filter or fix provider boundary |
| B5 | ⚪ | `e2e/03-shoot-tools-api.spec.ts` failure | Out of scope for design PR |

---

## Fixes needed before merge (recommended)

1. **Update e2e** — `intelligence-panel-dc-verify.spec.ts`: assert production panel (no target banner; real Approvals/DNA structure).
2. **Brand Detail** — wire AI draft card from DC or split to follow-up issue with PR waiver.
3. **Brand List** — add Sort · DNA score affordance (can be non-functional stub matching DC layout).
4. **Crawl progress** — fix `0` total pages in analysing state.
5. **Filter labels** — align Active/Draft vs DC Ready/Failed (product call).
6. **Playwright** — replace `networkidle` with `domcontentloaded` + explicit selectors on mobile CC screenshot spec.

---

## Production readiness verdict

**🟡 Needs improvement — not merge-ready as a “design parity complete” PR**

**Shippable today:**
- Command Center layout + Recent Work + Intelligence Panel (no debug UI)
- Brand List image-first workspace + portfolio panel
- Brand Detail hero, pillars, CTAs, enriched detail panel

**Hold merge for:**
- Stale/failing parity e2e updated
- Crawl progress display bug
- AI draft card verified on a `draft_ready` brand (component exists; data-gated)

**Suggested PR strategy:** Open draft PR `ipi/design-command-brand-parity` with screenshots + this checklist; either complete B1 in same PR or document waiver + follow-up Linear issue (IPI-271 scope).

---

## Reference files

- `Universal design prompt/Command Center.v2.image-first.dc.html`
- `Universal design prompt/Brand List.v2.image-first.dc.html`
- `Universal design prompt/Brand Detail.v2.image-first.dc.html`
- Forensic audit: `tasks/design-docs/implementation/brand/parity-audit.md`
