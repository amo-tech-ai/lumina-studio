# iPix / FashionOS — Design TODO

Near-term, actionable tasks. Strategy + status live in `plan.md`; shipped work in `changelog.md`.
Session entry point: `app/DESIGN.md`.

---

## 🔵 Now

- [ ] **IntelligencePanel build** — brand context card + DNA scores + assets grid + approval queue stacked above CopilotKit chat in the existing right slot. Replaces bare CopilotSidebar. *(IPI-242 follow-up)*
- [ ] **Brand Detail** (`/app/brand/[id]`) — BrandHub with tabs (Overview · DNA · Approvals · Assets · Activity); right panel = brand health context. States: loaded · loading · DNA-analysis-in-progress (streaming banner) · no-data. *(spec: `prompts/02-brand-detail.md`)*
- [ ] **Shoots List** (`/app/shoots`) — `ShootCard` grid, status + brand + date filters, floating `+ New shoot` CTA, empty state. *(spec: `prompts/03-shoots.md` — ready to start)*
- [ ] Extract `EmptyState` from Command Center into a reusable DC.
- [ ] Formalize `AgentStatusIndicator` states (idle · thinking · streaming · awaiting-approval).

## ⬜ Next

- [ ] **Brand List** (`/app/brand`) — grid of `BrandCard`s + filter bar + empty state with AI suggestion. *(Brand Detail designed first — detail has more AI touchpoints; list follows)*
- [ ] **Campaigns** (`/app/campaigns`) — campaign cards, Creative Director right panel, populated/empty/loading.
- [ ] **Assets** (`/app/assets`) — masonry `AssetCard` grid, DNA match %, multi-select bulk bar, selected-asset detail in right panel.

## ⬜ Later

- [ ] **Onboarding** (`/app/onboarding`) — 5-step wizard; step 2 streaming crawl progress; step 4 HITL DNA diff review. Full-width, no right panel.
- [ ] **Shoot Wizard** (`/app/shoots/new`) — multi-step with budget/deliverable/shot-list approval cards.
- [ ] **Matching** (`/app/matching`) — swipe-card + table variants.
- [ ] **Channel Preview** (`/app/preview`) — device frames, multi-platform.
- [ ] Mobile pass: IntelligencePanel as bottom Sheet, NavSidebar hamburger Sheet.

## 🧱 Component backlog (build when first needed)

- [ ] `BrandCard` · `ShootCard` · `CampaignCard` · `AssetCard`
- [ ] `PageHeader` (breadcrumb + actions)
- [ ] `EvidenceBlock` (collapsible citations) — **P0 for Brand Detail**
- [ ] `WizardStep`
- [ ] `StatusChip` full variant set (planning · active · post · complete · archived)
- [ ] `DataTable` (sortable, for assets / campaigns / matching)
- [ ] `FilterBar` (status + brand + date)
- [ ] `ActivityTimeline` (shared AI activity feed)
- [ ] `GlobalSearch` / Command palette (`⌘K`) — **P1, build before M6**

## 🧩 Cross-cutting (apply across all screens)

- [ ] **Error recovery actions** — `Retry` · `Report` · `Go back` on every error state; no dead ends.
- [ ] **Permission states** — read-only / operator / admin; gate write actions (Approve, Edit, generate) and show a why-disabled hint.
- [ ] **Realtime states** — connected / reconnecting / stale-data banners; never present dropped-stream output as live.

## ✅ Recently done

- [x] `app/DESIGN.md` — single upload entry point for all Claude Design sessions. *(2026-06-28)*
- [x] `tokens.css` + `design-system-rules.md` merged to main (PR #132). *(2026-06-28)*
- [x] 10 shadcn/ui primitives merged (badge, dialog, input, progress, select, separator, sheet, skeleton, sonner, tabs — PR #132). *(2026-06-28)*
- [x] `21-component-dependencies.md` — full component dependency tree. *(2026-06-28)*
- [x] `prompts/02-brand-detail.md` — Brand Detail full screen spec. *(2026-06-28)*
- [x] `prompts/03-shoots.md` — Shoots List full screen spec. *(2026-06-28)*
- [x] Command Center (`/app`) — shell + nav + intel panel + all 5 states. *(2026-06-28)*
- [x] Added `--nav-width-collapsed` / `--nav-width-expanded` to `:root`. *(2026-06-28)*
