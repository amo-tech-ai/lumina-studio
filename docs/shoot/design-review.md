---
id: SHOOT-DR-001
title: "Shoot System — Design Review & Direction Sign-off"
issue: IPI-84 · SHOOT-UX-001
status: Signed Off
date: 2026-06-25
reviewed_by: "S K — Product Lead, AMO Tech AI"
unblocks: IPI-85 · IPI-86 · IPI-87
sources:
  - docs/screenshots/soona/soona.md
  - docs/screenshots/squareshot/squareshot.md
  - docs/screenshots/squareshot/shotlists.md
  - docs/prd/shoot-prd.md
  - docs/shoot/shoot-system-plan.md
  - github/CopilotKit/examples/canvas/mastra-pm/src/app/page.tsx
---

# Shoot System — Design Review & Direction Sign-off

**IPI-84 · SHOOT-UX-001**  
**Date:** 2026-06-25  
**Reviewed by:** S K — Product Lead, AMO Tech AI  
**Status:** ✅ Signed Off — IPI-85, IPI-86, IPI-87 unblocked

---

## 1. Purpose

Lock design direction for the iPix shoot system before implementation begins.
Prevents mid-sprint UX pivots by confirming: what Soona/Squareshot workflows to replicate,
which to skip, and where iPix's AI-native + commerce integration creates an uncopyable moat.

---

## 2. Competitor Comparison Matrix

| Dimension | Soona | Squareshot | iPix (planned) |
|---|---|---|---|
| **Shoot creation wizard** | Multi-step: Build → Quantity → Scenes → Models → Upgrades → Payment (6 steps, 1 CTA per step) | Multi-step: Service Selection → Shot List → Details → Add-Ons → Submit (human-driven, no HITL) | 6-step AI-driven: Context → Brief → **Gate 1: Deliverables** → Crew → **Gate 2: Shot List** → **Gate 3: Budget/Review** — 3 explicit HITL suspend gates |
| **Shot list generation** | Manual. User selects scene type, quantity, angle from gallery. Zero AI. | Manual. User adds items, picks angles from 527-image DISCOVER library. Zero AI. | AI-generated from `approved_deliverables`. `generateShotListDraft` cannot run without Gate 1 approval. References from `shot_type_references` table. |
| **Deliverables planning** | Post-shoot mental model — user selects output type at creation but no channel-aware planning | No concept. User picks "product shoot" or "model shoot" without channel context. | **Pre-shoot and binding.** Deliverables (channel × format × quantity) are Gate 1. Shot list is DERIVED from approved deliverables — not invented first. |
| **Asset delivery / gallery** | Gallery + DAM. No quality scoring. Listing Insights (Amazon score, Shopify score) at listing level, not asset level. | Delivered images + My Assets tab. No quality scoring, no feedback loop. | DNA-scored gallery on upload. Per-asset badge (approved `#059669` / review `#D97706` / blocked `#DC2626`). `explainShootDnaAlerts` tool. HITL override with justification. |
| **Commerce integration** | Shopify + Amazon catalog sync. Links products to assets. Manual. No AI gap detection. | None. Brief submission is decoupled from product catalog. | `commerce_product_links` table. `explainProductLinkingGaps` tool surfaces unlinked commerce assets in the right panel. |
| **AI assistance** | AI Studio: background replacement, scene generation for existing product photos. Listing Insights uses AI scoring. No planning AI. | AI Services as a paid shoot type ($95/image). No brief AI, no planning AI, no quality AI. | AI throughout: Brand URL → `analyzeBrandDna` → deliverables → shot list → budget → DNA scoring → gap explanation. L1–L5 CopilotKit integration at every screen. |
| **Visual concept / creative direction** | Not offered as distinct service. | $995/concept — premium paid add-on for art direction. | **Free.** Built into brand intelligence. iPix moat: what Squareshot charges $995 for, iPix gives every operator automatically from `brand_scores.style_profile`. |
| **Reference library** | Visual inspiration but not integrated into brief builder directly. | 527-image DISCOVER library, manually browsed, organized by 8 categories. | `shot_type_references` table (IPI-184) — living library. Grows via `promote-to-reference` flywheel (DNA ≥ 80). `lookupShotReferences` returns matches automatically. |

### Gap Analysis — What They Miss That iPix Owns

| Gap | Soona | Squareshot | iPix Response |
|---|---|---|---|
| Brand context carryover | ✗ Every brief starts blank | ✗ Every brief starts blank | ✓ `brand_scores` pre-fills brief from DNA |
| Channel-aware planning | ✗ No channel intelligence | ✗ User guesses channel specs | ✓ Deliverables derived from channel needs |
| Shot list coverage validation | ✗ No coverage check | ✗ Can submit missing Amazon angles | ✓ Gate 2 blocks submission if coverage incomplete |
| Post-delivery quality verification | Listing Insights only (listing-level) | ✗ None | ✓ Per-asset DNA score on upload |
| Feedback loop | ✗ Static library | ✗ No learning | ✓ Approved assets → `shot_type_references` flywheel |
| Commerce connection | Shopify/Amazon import, manual linking | ✗ None | ✓ `commerce_product_links` + gap detection |
| AI planning agent | ✗ None | ✗ None | ✓ `production-planner` in-process via CopilotKit |
| HITL approval before commit | ✗ None | ✗ None | ✓ 3 explicit gates — nothing durable without approval |

---

## 3. CopilotKit Layout Compatibility

### 3-Panel Layout

**Source reviewed:** `github/CopilotKit/examples/canvas/mastra-pm/src/app/page.tsx`

**Pattern confirmed:**
```tsx
<CopilotSidebar defaultOpen={true} clickOutsideToClose={false}>
  <YourMainContent />
</CopilotSidebar>
```

`CopilotSidebar` renders a right-side panel. Default width renders at ~380px on desktop. Main content fills remaining viewport width. This is the confirmed iPix layout pattern.

**iPix shoots layout:**

| Region | Width | Content |
|---|---|---|
| Left nav | 240px (fixed) | Operator sidebar (`OperatorPanel`) |
| Main canvas | calc(100% - 240px - 380px) | Shoot list / detail / wizard |
| Right AI panel | ~380px | CopilotSidebar (chat + tool renders + HITL cards) |

**Decision:** ✅ 3-panel layout is compatible with `<CopilotSidebar>`. Minimum main canvas width at 1280px viewport: ~660px — sufficient for the shoot table, detail tabs, and wizard steps.

### HITL Approval Card Placement

**Source reviewed:** `canvas/mastra-pm/` pattern — approval cards render inside `CopilotSidebar` as `useRenderToolCall` results.

**iPix wizard gates:** Each HITL card (DeliverableApprovalCard, ShotListApprovalCard, BudgetApprovalCard) renders inside the right panel, NOT as a full-page modal. This keeps the wizard step visible alongside the approval.

**Decision:** ✅ Confirmed. Cards live in the right panel. The wizard's Step panel (left of sidebar) remains visible during approval — operator can cross-reference before deciding.

### Editable Shot List Artifact

**Pattern:** `showcases/spreadsheet/` editable artifact. `useAgent` streams state into a table component; inline edits write back via agent.

**iPix mapping:** Shot List tab (`/app/shoots/:id`) renders as editable table (not card grid), driven by `useAgent`. Inline edit support required. Confirmed table layout.

### Wizard Right Panel Width

Minimum 320px right panel is required for CopilotKit's HITL cards to render all three action buttons (Approve / Edit / Reject) without wrapping. At default ~380px, this is satisfied. No wireframe adjustment needed.

**Decision:** ✅ CopilotKit layout fully compatible with all four design questions raised in IPI-84.

---

## 4. Wireframe Fidelity Check

**Finding:** `tasks/wireframes-ipix/new/02-shoot-detail-page.*` and `03-shoot-wizard.*` do not exist on disk as of 2026-06-25.

**Resolution:** The design review substitutes specification parity — the IPI-84 issue description, `docs/prd/shoot-prd.md`, `docs/shoot/shoot-system-plan.md`, and the squareshot.md competitor audit together provide complete design intent. The absence of pixel wireframes does not block IPI-85/86/87 because:

1. The 6-step wizard flow is fully specified in `shoot-system-plan.md` with conversation flow, field inventory, and HITL gate definitions.
2. The 8-tab detail page is specified in `docs/shoot/02-shoot-detail-page.md`.
3. CopilotKit layout is confirmed above — no wireframe measurement needed.
4. All 8 design decisions are answered below with written specs that serve as wireframe-equivalent intent.

**Required action (IPI-84 open item):** `02-shoot-detail-page.*` and `03-shoot-wizard.*` wireframe files should be created post-sign-off using `/ipix-wireframe` skill. This is a documentation task, not a blocker for IPI-85/86/87 implementation.

---

## 5. Eight Design Decisions — Confirmed Answers

### Decision 1 — Wizard Flow Order

**Confirmed:** 6 steps in this order:

| Step | Name | HITL Gate? | Key AI action |
|---|---|---|---|
| 1 | Context | No | `getShootContext` pre-fills from brand DNA |
| 2 | Brief / Creative Direction | No | Style profile from `brand_scores` |
| 3 | Deliverables | **Gate 1** | `generateDeliverablesDraft` → `DeliverableApprovalCard` |
| 4 | Crew | No | `matchShootCrew` recommendation (MVP: manual) |
| 5 | Shot List | **Gate 2** | `generateShotListDraft` (requires Gate 1) → `ShotListApprovalCard` |
| 6 | Review / Budget | **Gate 3** | `estimateShootBudget` → `BudgetApprovalCard` → `commit-approved-shoot` |

Rationale: Deliverables before shot list is the non-negotiable invariant. Crew between them allows channel-aware model selection before shot list generates. Review last ensures full plan is visible before budget approval.

### Decision 2 — Deliverables Table Columns

**Confirmed:** 5 columns.

| Column | Type | Source |
|---|---|---|
| Channel | Select (`instagram_feed`, `shopify_pdp`, `amazon`, `tiktok`, `pinterest`, `email`) | AI-generated from brand DNA |
| Format | Display (`4:5`, `1:1`, `9:16`, `16:9`, `white_bg`) | Derived from channel |
| Quantity | Number input | AI-generated, operator-editable |
| Aspect Ratio | Display (redundant with format but explicit) | Channel rule |
| Notes | Text input (optional) | Operator |

No additional columns for MVP. Add "Assigned Shots" count (read-only) after Gate 2 as a post-fill column on the Deliverables tab of the detail page.

### Decision 3 — Shot List Coverage Column

**Confirmed:** Both — show deliverable count AND channel name.

Format: `2 deliverables · Instagram Feed, Shopify PDP`

Rationale: Deliverable count alone is opaque. Channel name provides context for operators reviewing shot list. Single compact cell; wrap on overflow.

### Decision 4 — Gallery DNA Badge Style

**Confirmed:** Three-tier, threshold-based.

| Score | Label | Color | Hex |
|---|---|---|---|
| ≥ 80 | Approved | Green | `#059669` |
| 60–79 | Review | Amber | `#D97706` |
| < 60 | Blocked | Red | `#DC2626` |

These map to `shoot_assets.status` values: `approved`, `review`, `blocked`. (NOT `flagged` or `pending` — those are not valid status values in the schema.)

Badge renders as a pill with score number + label: `✓ 84 Approved`. Blocked badge triggers `explainShootDnaAlerts` CTA.

### Decision 5 — Tabs Order on Detail Page

**Confirmed:** 8 tabs in this order.

| # | Tab Name | Primary Content |
|---|---|---|
| 1 | Overview | Shoot brief summary, status, agent context |
| 2 | Shot List | Editable table, reference thumbnails, coverage status |
| 3 | Assets | DNA-scored gallery grid with badge overlay |
| 4 | Crew | Assigned crew, sourcing status |
| 5 | Deliverables | Channel × format × quantity table |
| 6 | Product Links | Commerce asset linking, gap alerts |
| 7 | Timeline | Schedule, milestones (MVP: read-only) |
| 8 | Notes | Free-form notes, history |

Rationale: Overview first for quick status read. Shot List + Assets are the primary working tabs — 2 and 3. Product Links is Decision 6. Timeline and Notes are reference/admin.

### Decision 6 — Product Links Tab Name

**Decision:** "Product Links"

Rationale: "Commerce" is abstract — operators won't know what it means at a glance. "Product Links" directly describes the action (linking assets to products). Consistent with `commerce_product_links` table name and `explainProductLinkingGaps` tool name.

### Decision 7 — Empty State Strategy

**Confirmed per context:**

| State | Empty State Treatment |
|---|---|
| Empty gallery (no uploads yet) | Illustration + "Upload shoot assets to start DNA scoring." Upload button. |
| Empty shot list (pre-Gate 2) | Inline agent message: "Approve your deliverables first, then I'll generate your shot list." CTA → back to Deliverables tab. |
| No crew assigned | "No crew assigned. Add crew manually or let the agent recommend based on your shot list." Two CTAs. |
| No shoots on dashboard | Hero empty state: "Plan your first shoot. I'll build your shot list from your brand DNA." CTA → `/app/shoots/new`. |
| No product links | "No products linked yet. I'll surface gaps as assets are approved." — passive, non-blocking. |

All empty states display agent contextual guidance. No generic "Nothing here yet" placeholders.

### Decision 8 — Mobile Priority

**Confirmed:** The following tabs/steps are mobile-critical for MVP:

| Screen | Mobile Priority | Rationale |
|---|---|---|
| Shoots dashboard | ✅ Mobile | Operators check shoot status on mobile |
| Shoot detail: Overview tab | ✅ Mobile | Status at a glance |
| Shoot detail: Assets tab | ✅ Mobile | Upload from phone camera roll |
| Wizard Step 1 (Context) | ✅ Mobile | Quick shoot initiation |
| Shoot detail: Shot List tab | 🟡 Simplified mobile | Table → card list on mobile |
| Wizard Steps 2–6 (full wizard) | ⬜ Desktop-first | Complex editing; desktop OK for MVP |
| Shoot detail: Product Links | ⬜ Desktop-first | Linking workflow requires precision |
| Shoot detail: Timeline | ⬜ Desktop-first | Admin task |

Mobile-critical screens must be tested at 390px (iPhone 14 Pro) before IPI-85/86 are marked Done.

---

## 6. iPix Differentiation Summary

| iPix differentiator | Soona parity? | Squareshot parity? |
|---|---|---|
| Brand DNA pre-fills brief | ✗ | ✗ |
| Channel-driven deliverables | ✗ | ✗ |
| Shot list derived from deliverables | ✗ | ✗ |
| 3 HITL approval gates | ✗ | ✗ |
| Per-asset DNA scoring on upload | Partial (listing-level only) | ✗ |
| Commerce product linking + gap alerts | Partial (manual linking only) | ✗ |
| Living shot reference library | ✗ | ✗ |
| In-process AI agent (no separate server) | ✗ | ✗ |
| Free visual concept via brand intelligence | ✗ ($995 at Squareshot) | ✗ |

No competitor replicates this stack. The moat is the vertical integration: Brand DNA → AI planning → HITL approval → DNA scoring → commerce links — in one continuous workflow.

---

## 7. What NOT to Build (Scope Exclusions)

| Feature | Decision | Reason |
|---|---|---|
| Vendor booking / availability marketplace | ❌ Deferred — separate track | `shoot-research.md` / `prompt-plan.md` |
| Stripe Connect for crew payments | ❌ Deferred | Booking marketplace track |
| Autonomous brief refresh (no HITL) | ❌ Never in core | HITL invariant — humans approve |
| Postiz/calendar publishing | ❌ Deferred | Content calendar track |
| UGC creator marketplace | ❌ Post-core | Soona pattern, separate product |
| AI-generated model images | ❌ Post-core | Squareshot AI Services equivalent; different workflow |
| Multi-vendor quoting | ❌ Deferred | Shoot research track |
| `generateProductionPackage` | ❌ Advanced | IPI-151 scope note — deferred |

---

## 8. Definition of Done — Verified

- [x] `docs/shoot/design-review.md` written with competitor matrix
- [x] All 8 design decisions documented with written answers
- [x] CopilotKit 3-panel layout compatibility confirmed
- [x] HITL card placement in right panel confirmed
- [x] Editable shot list artifact pattern confirmed (table, not card grid)
- [x] Wireframe gap noted with resolution path
- [x] Scope exclusions documented
- [x] Sign-off name and date present
- [ ] IPI-85, IPI-86, IPI-87 assignees confirm they have read — **required before coding starts**

---

## 9. Sign-off

**Product Lead sign-off:** S K — AMO Tech AI  
**Date:** 2026-06-25  
**Verdict:** ✅ Design direction confirmed. IPI-85, IPI-86, and IPI-87 are unblocked.

**Required reading for IPI-85/86/87 implementors:**

1. This document (full)
2. `docs/prd/shoot-prd.md` §2–§5 (goals, current state, HITL invariant)
3. `docs/shoot/shoot-system-plan.md` §2–§3 (runtime topology, deliverables-first)
4. `docs/screenshots/squareshot/squareshot.md` §"Production Planner Agent Design" (wizard conversation flow)
5. CLAUDE.md — `production-planner` in-process rule (never `:4111`)
