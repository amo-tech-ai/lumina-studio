# iPix / FashionOS — Design TODO

Near-term, actionable tasks. Strategy + status live in `plan.md`; shipped work in `changelog.md`.
Session entry point: `app/DESIGN.md`.

---

## 🔵 Now

- [ ] **Adopt v3 "Zeely Editorial" for all new screens** — pure white/grey/black, Inter, black actions, image-first, global chat dock. Source of truth: `DESIGN.md` + `tokens.css` (v3).
- [ ] **Restyle existing prototypes to v3** — audit Command Center / Brand Detail / Shoots List for any beige, orange chrome, Geist-Sans, or missing chat dock; fix to v3.
- [ ] **Add the global AI chat dock to every operator screen** — context-aware greeting + quick chips + streaming status + black send; never "How can I help?".
- [ ] **Update all page prompts to v3** — done in `design-patched/prompts/`; copy across and retire old orange/beige/Geist references.
- [ ] **IntelligencePanel build** — brand context card + DNA scores + assets grid + approval queue stacked above CopilotKit chat in the existing right slot. Replaces bare CopilotSidebar. *(IPI-242 follow-up)*
- [ ] **Copy `design-patched/` → `app/design/`** — DESIGN.md, tokens.css, redesign-spec.md, image-strategy.md, 00-README.md, prompts/*, plan.md, todo.md, changelog.md (the assistant can't write to the mount).
- [ ] **Decide the HITL amber treatment** — orange is retired; confirm amber stays the HITL/pending accent, or move it neutral / to the benchmark green. Apply once across ApprovalCard, AI-DRAFT tag, weakest-pillar dot.
- [ ] Extract `EmptyState` + `AIChatDock` from the prototypes into reusable components.
- [ ] Formalize `AgentStatusIndicator` states (idle · thinking · streaming · awaiting-approval).

## ⬜ Next — build queue (all specs are v3-ready in `prompts/`)

Build order follows the milestones in `plan.md`. Each screen = one `*.v2.image-first.dc.html`, 3-panel shell (onboarding standalone), all 5 states, global AI chat dock, image-first from `app/design/images`.

- [ ] **Brand List** (`/app/brand`, `brand-intelligence`) — 16:9 cover-first `BrandCard` grid (3-col → 2 at 1280px), DNA score + weakest-pillar `*` flag, status chip on image, portfolio-health IntelligencePanel, filter/sort, illustrated empty (faded card preview). *(spec: `prompts/04-brand-list.md`)* — **finishes M2**
- [ ] **Brand List** — ✅ built `Brand List.v2.image-first.dc.html` (finishes M2). *(2026-06-28)*
- [ ] **Shoot Wizard** (`/app/shoots/new`, `production-planner`) — 4 steps (Basics · Brief · Shot List · Review), black step track, AI drafts as white ApprovalCards (brief + shot list), per-step IntelligencePanel suggestions + 4:3 reference-shoot thumbs. *(spec: `prompts/05-shoot-wizard.md`)* — **finishes M3**
- [ ] **Shoot Wizard** — ✅ built `Shoot Wizard.v2.image-first.dc.html` (10-step AI Production Planner; finishes M3). *(2026-06-28)*
- [ ] **Campaigns** — ✅ built `Campaigns.v2.image-first.dc.html` (creative-director). *(2026-06-28)*
- [ ] **Assets** — ✅ built `Assets.v2.image-first.dc.html` (visual-identity; masonry + table). Finishes M4. *(2026-06-28)*
- [ ] **Matching** — ✅ built `Matching.v2.image-first.dc.html` (social-discovery; swipe deck + table). Closes M5. *(2026-06-28)*
- [ ] **Channel Preview** — ✅ built `Channel Preview.v2.image-first.dc.html` (visual-identity; 4-channel device studio). All 10 screens now built. *(2026-06-28)*
- [ ] **Campaigns (placeholder)** (`/app/campaigns`, `creative-director`) — 16:9 cover-first full-width `CampaignCard` rows, deliverables progress + platform breakdown in IntelligencePanel, new-campaign HITL draft. *(spec: `prompts/06-campaigns.md`)*
- [ ] **Assets** (`/app/assets`, `visual-identity`) — masonry `AssetCard` gallery (DNA overlay on dark gradient), multi-select + bulk bar, single-asset detail panel, low-score HITL. *(spec: `prompts/07-assets.md`)* — **finishes M4**
- [x] **Onboarding** (`/onboarding`, standalone) — built `Onboarding.v2.zeely.dc.html`: 13-screen Zeely-style flow, green accent confirmed. *(2026-06-28)*
- [ ] **Matching** (`/app/matching`, `social-discovery`) — Creator/Asset/Product tabs, full-width match rows with avatar + DNA bar + rationale, match-in-progress scan counter, shortlist HITL. *(spec: `prompts/09-matching.md`)* — **finishes M5**
- [ ] **Channel Preview** (`/app/preview`, `visual-identity`) — CSS device frames per platform (IG Feed/Story · TikTok · Amazon · Shopify), DNA overlay outside frame, crop-fix HITL, export panel. *(spec: `prompts/10-channel-preview.md`)* — **with mobile pass = M6**

## 🧩 Shared components to extract while building

- [ ] `BrandCard` · `CampaignCard` · `AssetCard` (image-first card variants — 16:9 / full-width / masonry)
- [ ] `AIChatDock` (context greeting + quick chips + streaming status + black send) — used on every operator screen; extract after Brand List
- [ ] `WizardStep` + black step track (Shoot Wizard + Onboarding)
- [ ] `FilterBar` / `<Select>` cluster (Brand List, Campaigns, Assets, Matching)
- [ ] `DeviceFrame` (CSS-border phone/desktop mocks — Channel Preview)
- [ ] `MatchRow` + `DNAOverlayBadge`

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
- [ ] **Image-first set** (prototyped in v2 — extract for reuse): `ImageThumb` · `MediaCard` · `AIPreviewCard` · `Moodboard` · `PaletteStrip` · `AssetGallery` · `EmptyPreview`.

## 🧩 Cross-cutting (apply across all screens)

- [ ] **Error recovery actions** — `Retry` · `Report` · `Go back` on every error state; no dead ends.
- [ ] **Permission states** — read-only / operator / admin; gate write actions (Approve, Edit, generate) and show a why-disabled hint.
- [ ] **Realtime states** — connected / reconnecting / stale-data banners; never present dropped-stream output as live.

## 🔧 Production parity (codebase ↔ design rules)

- [ ] Capture baseline screenshots into `app/design/screenshots/*` (all 9 folders are empty) — at least command-center, brand, shoots, nav (collapsed + expanded), approval.
- [ ] Migrate production NavSidebar emoji icons → Lucide (Rule 9 compliance).
- [ ] Decide `ThreadsDrawer` fate — fold into IntelligencePanel or keep as a separate side-sheet.
- [ ] Reconcile suggestion chips: rules say "3 max", production registers 5 global suggestions — pick one and align.

## ✅ Recently done

- [x] **Onboarding plan + wireframes** (`prompts/08-onboarding-plan.md`) — Zeely-faithful 13-screen flow (ask→reassure→educate cadence), full visual system (black backdrop + striped-globe motif, green local accent, white cards, black pill CTAs), component patterns, per-screen ASCII wireframes, interactions, build notes. One open decision flagged: green accent vs pure B/W. *(2026-06-28)*

- [x] **Reviewed + adopted the 7 uploaded v3 page specs** (`04-brand-list`, `05-shoot-wizard`, `06-campaigns`, `07-assets`, `08-onboarding` [10-screen Zeely], `09-matching`, `10-channel-preview`) as source of truth in `prompts/`. Fixed stragglers (Geist Sans → Inter in matching/channel-preview, weakest-pillar amber→muted in brand-list, 72px→16:9 in campaigns, onboarding token-footer wording) and reconciled the Channel Preview agent (`creative-director`→`visual-identity`) across README + plan. *(2026-06-28)*

- [x] **v3 "Zeely Editorial" design-system decision** — pure white/grey/black, Inter, black actions, orange retired, 20px radii, global AI chat dock, editorial-fashion image rules. Propagated across `DESIGN.md`, `tokens.css`, `redesign-spec.md`, `image-strategy.md`, `00-README.md`, `prompts/00-universal.md`, and all page prompts. *(2026-06-28)*

- [x] **Shoots List v2** (`Shoots List.v2.image-first.dc.html`) — Zeely-pure, cover-first ShootCard grid, filter chips (All/Draft/Confirmed/In Production/Complete), search bar, floating + New shoot, selected-shoot preview + shot-list in IntelligencePanel, mobile bottom-sheet; 5 states + selected. Real `images/` photos. *(2026-06-28)*
- [x] **Command Center v2 → Zeely-pure** (matched to Brand Detail: white/grey/charcoal, Inter, grey AI badges, 20px images). *(2026-06-28)*
- [x] **Brand Detail v2 → Zeely-pure restyle** (white/grey/charcoal, Inter, grey AI badges, 20px images) + **real uploaded fashion photos** wired into both v2 prototypes via `images/`. *(2026-06-28)*
- [x] **v2 "Atelier" visual system** — white-forward, charcoal primary, borders-over-shadows, 16px radii + **image-first** layer (DESIGN.md §5H, `image-strategy.md`, image tokens in `tokens.css`). *(2026-06-28)*
- [x] **Command Center v2 image-first** + **Brand Detail v2 image-first** prototypes (brand-hero cards, Recent-work moodboard, large AI-preview card, before/after image strips, Visual-identity palette strip, live crawl thumbnails). *(2026-06-28)*
- [x] **Retired the orange accent → charcoal** to match the benchmark; amber kept for HITL only. *(2026-06-28)*
- [x] **Brand Detail (base)** — all 5 states (Populated · No-DNA · Analysing · Loading · Error) with inline HITL DNA draft. *(2026-06-28)*

- [x] Rev-2 audit of `plan.md` + `todo.md` vs live codebase (`design-audit-2026-06-28-rev2.md`) — scores 90 / 92. *(2026-06-28)*
- [x] `app/DESIGN.md` — single upload entry point for all Claude Design sessions. *(2026-06-28)*
- [x] `tokens.css` + `design-system-rules.md` merged to main (PR #132). *(2026-06-28)*
- [x] 10 shadcn/ui primitives merged (badge, dialog, input, progress, select, separator, sheet, skeleton, sonner, tabs — PR #132). *(2026-06-28)*
- [x] `21-component-dependencies.md` — full component dependency tree. *(2026-06-28)*
- [x] `prompts/02-brand-detail.md` — Brand Detail full screen spec. *(2026-06-28)*
- [x] `prompts/03-shoots.md` — Shoots List full screen spec. *(2026-06-28)*
- [x] Command Center (`/app`) — shell + nav + intel panel + all 5 states. *(2026-06-28)*
- [x] Added `--nav-width-collapsed` / `--nav-width-expanded` to prototype `:root` (already present in `tokens.css`). *(2026-06-28)*
