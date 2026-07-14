# iPix / FashionOS — Design Build Plan

> 📍 **Single source of truth for status = `docs/design/DESIGN-TASKS.md §0`** (the one design tracker). This file holds strategy/history; do not track live progress here — read counts, scores, and per-task status from `DESIGN-TASKS.md §0`.

> Living plan for the Claude Design screen-generation effort. Tracks every operator screen, its required states, and the shared component layer. Pair with `todo.md` (near-term actions) and `changelog.md` (what shipped).

**Product:** iPix / FashionOS — AI-native operator workspace for fashion brands (`fashionos.co`)
**Output format:** HTML prototypes, 3-panel shell, token-driven from `tokens.css`
**Visual language:** **v3 "Zeely Editorial"** — pure white / light-grey / charcoal / black, **Inter** UI font (Geist Mono numbers only), **black** primary actions (orange retired), borders over shadows, 20px radii, **image-first** editorial fashion photography, and a **global AI chat dock** on every operator screen. Amber kept for HITL only. See `DESIGN.md` + `redesign-spec.md` + `image-strategy.md`.
**Session entry point:** `app/DESIGN.md` — upload this first in every Claude Design session
**Completion plan:** `checklist.md` §9 — phased plan (E–L) to close the remaining audit items; §0 has the live progress tracker.
**Last updated:** 2026-06-29 (rev 7 — cross-screen dead-ends fixed; completion plan E–L drafted, K/L gated on approval)

---

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Done — built and verified |
| 🟡 | In progress |
| 🔵 | Next up |
| ⬜ | Not started |
| ➖ | Not applicable to this screen |

> **✅ on a screen or milestone = Claude Design HTML prototype complete and verified — NOT production-shipped.** Production React / CopilotKit / Mastra wiring is tracked separately in Linear.

---

## Progress Tracker — Screens

Every operator screen ships with all 5 states: **Populated · Loading · Empty · Error · Approval-pending**.

| # | Screen | Route | Agent | Spec | Status | v3 | Populated | Loading | Empty | Error | Approval |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Command Center | `/app` | `production-planner` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 02 | Brand List | `/app/brand` | `brand-intelligence` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 03 | Brand Detail | `/app/brand/[id]` | `brand-intelligence` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 04 | Shoots List | `/app/shoots` | `production-planner` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4b | Shoot Detail | `/app/shoots/[id]` | `production-planner` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 05 | Shoot Wizard | `/app/shoots/new` | `production-planner` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ➖ | ✅ | ✅ |
| 06 | Campaigns | `/app/campaigns` | `creative-director` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 07 | Assets | `/app/assets` | `visual-identity` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ |
| 08 | Onboarding | `/onboarding` | `brand-intelligence` | ✅ | ✅ Done | ✅ | ✅ | ➖ | ➖ | ✅ | ✅ |
| 09 | Matching | `/app/matching` | `social-discovery` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ |
| 10 | Channel Preview | `/app/preview` | `visual-identity` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ |

> **v3 column** — all 10 screens are fully v3 "Zeely Editorial" (pure white/grey/black, Inter, black actions, image-first, global chat dock).

> **Agent note:** Verified against `route-agent-map.ts`. `visual-identity` and `social-discovery` are registered in Mastra (`mastra/index.ts`) but not yet wired to any route — agent column reflects current production routing (default fallback = `production-planner`).
>
> **Durability note:** Only `production-planner` and `creative-director` are durable agents (`durable.ts`). `brand-intelligence` has no resumable stream — screens on that agent (Brand List, Brand Detail) must use error+retry, not stream-reconnect UI.
>
> **Right panel today:** the production right slot is a bare `CopilotSidebar` (welcome text + **5** static global suggestions). The IntelligencePanel build (context → approvals → tabs) replaces it — see `todo.md` Now.

**Completed: 10 / 10 screens** — all built as v2 image-first "Zeely Editorial" prototypes, verified clean, each with the global AI chat dock and the M6 mobile pass (bottom tab bar · IntelligencePanel-as-sheet · More sheet · persistent chat dock above tabs).

---

## Progress Tracker — Shared Component Layer

Shell + composite components reused across screens. Built inline in the Command Center HTML prototype; extract to standalone prototype components once reused ≥4 times.

| Component | Level | Status | First used | Notes |
|---|---|---|---|---|
| OperatorShell (3-panel grid) | Layout | ✅ | Command Center | `auto · minmax(0,1fr) · auto` |
| NavSidebar (rail + expand) | Layout | ✅ | Command Center | **Prototype:** brand switcher, badges, RECENT. **Production** (`nav-sidebar.tsx`): 6 plain links + Threads, emoji icons → migrate to Lucide |
| IntelligencePanel | Feature | 🟡 | Command Center | Production right slot is still a bare `CopilotSidebar` chatbot. Full build (context→approvals→tabs) is IPI-242+ |
| ThreadsDrawer | Feature | ✅ (prod) | Shell | Chat-thread history side-sheet, toggled from NavSidebar (`operator-panel.tsx`). Not yet in prototype |
| ApprovalCard (HITL) | Composite | ✅ | Command Center | v2: white card + amber hairline + dot (no orange fill); before/after as **image strips** (Brand Detail); confidence + evidence |
| DNAScoreBar | Composite | ✅ | Command Center | Overall + Brand/Visual/Voice pillars |
| StatusChip | Composite | ✅ | Command Center | `active` chip; extend to all status values |
| Quick-action chips | Composite | ✅ | Command Center | 3 max in workspace (production CopilotKit registers 5 global suggestions — see parity tasks) |
| AIChatDock | AI | 🟡 | Command Center | Persistent base-of-workspace chat: context greeting + quick chips + streaming status + black send. Built inline on 3 screens; extract after Brand List |
| Chat input | Composite | ✅ | Command Center | Mic + send, center workspace |
| Skeleton states | Primitive | ✅ | Command Center | Shimmer, matches populated layout; aspect-ratio blocks for images (v2) |
| ImageThumb / MediaCard | Composite | ✅ (v2) | Command Center | Image-first card: photo + metadata + corner status chip |
| AIPreviewCard | Composite | ✅ (v2) | Command Center | Large uncropped AI output above approval actions |
| Moodboard row | Composite | ✅ (v2) | Command Center | Recent-work justified thumbnail row |
| PaletteStrip | Composite | ✅ (v2) | Brand Detail | Visual-identity swatches + sample frames |
| BrandCard | Composite | ⬜ | Brand List | Logo, DNA badge, status, thumbnail |
| ShootCard | Composite | ⬜ | Shoots List | DNA badge + status chip |
| CampaignCard | Composite | ⬜ | Campaigns | Date range, deliverables count |
| AssetCard | Composite | ⬜ | Assets | Image, DNA match %, masonry |
| EmptyState (generic) | Layout | ✅* | Command Center | *Inline; extract for reuse |
| PageHeader | Layout | ⬜ | Brand List | Breadcrumb + actions |
| WizardStep | Feature | ⬜ | Shoot Wizard | Multi-step progress |
| EvidenceBlock | Composite | 🔵 P0 | Brand Detail | Collapsible citations — needed for M2 |
| AgentStatusIndicator | AI | 🟡 | Command Center | Thinking dots present; formalize states |
| DataTable | Composite | ⬜ | Assets | Sortable table for assets, campaigns, matching |
| FilterBar | Composite | ⬜ | Assets | Status + brand + date filters |
| ActivityTimeline | AI | ⬜ | Brand Detail | Shared AI activity feed component |
| GlobalSearch | Feature | 🔵 P1 | Command Center | `⌘K` command palette — extract to standalone before M6 |

---

## Non-negotiable rules (apply to every screen)

1. 3-panel shell: `NavSidebar · Workspace · IntelligencePanel`.
2. IntelligencePanel is always white — never dark, never a bare chatbox. It contains compact context (brand, DNA, approvals, evidence, activity, chat) — it must not become a separate fourth column or a full detail workspace.
3. Every AI-generated recommendation shows **confidence % + evidence source**. Every AI-generated edit or draft also shows **before/after diff**.
4. Every AI write goes through an **ApprovalCard** — **white card + amber hairline** (`var(--approval-border)`) + amber status dot (no fill); **Approve button is black**.
5. Zero hardcoded hex — only semantic tokens from `tokens.css`.
6. All 5 states per screen. Skeleton for loading, never a spinner for content.
7. Agent greeting names the active brand + next action — never "How can I help?".
8. Mobile at `max-width: 1024px`: IntelligencePanel hidden, NavSidebar collapses to rail.
9. **Inter** UI font / Geist Mono numbers. Lucide icons used sparingly (note: production nav still uses emoji — migration tracked in `todo.md`). No gradients, no heavy shadows, no beige.
10. **Pure white / grey / black only** — no beige, no warm tints, no orange chrome (orange retired; opt-in only for a project-approved AI action). Black primary buttons; white + hairline secondaries.
11. **Content objects lead with editorial fashion photography** (female models in apparel); prefer uploaded `app/design/images`; never random stock / illustration / office / glamour.
12. **Every operator screen has a persistent, context-aware AI chat dock** at the base of the center workspace — greeting names the active object, never "How can I help?". (Onboarding is standalone — no shell, no dock.)

---

## Cross-cutting states (design into every screen)

Beyond the 5 data states, every screen must account for:

- **Error recovery** — every error state offers concrete actions: `Retry`, `Report`, `Go back`. Never a dead end.
- **Permissions** — handle `read-only` (viewer), `operator`, and `admin`. Hide or disable write actions (Approve, Edit, generate) for read-only and show a why-disabled hint.
- **Realtime / connection** — handle `connected`, `reconnecting`, and `stale data`. Surface a quiet banner when data is stale or the agent stream drops; never present stale AI output as live. **Note:** only `production-planner` + `creative-director` are durable (`durable.ts`); `brand-intelligence` has no stream reconnect.

---

## Milestones

| Milestone | Scope | Status |
|---|---|---|
| **M1 — Shell + Command Center** | 3-panel shell, nav, intel panel, HITL pattern, all 5 states | ✅ Done |
| **M2 — Brand surface** | Brand List + Brand Detail (DNA, approvals, assets, activity) | ✅ Done |
| **M3 — Production surface** | Shoots List + Shoot Wizard + Shoot Detail | ✅ Done |
| **M4 — Content surface** | Campaigns + Assets | ✅ Done |
| **M5 — Acquisition surface** | Onboarding wizard + Matching | ✅ Done |
| **M6 — Preview + polish** | Channel Preview, mobile pass | ✅ Done |

> ✅ on a milestone = Claude Design prototype built and verified. Production React / CopilotKit wiring is tracked separately in Linear (e.g. IPI-242 for the IntelligencePanel full build).

---

## QA gate (run before marking a screen Done)

- [ ] 3-panel shell correct; right panel white; active nav item highlighted
- [ ] Zero hardcoded hex; semantic tokens only; Button variants only
- [ ] All 5 states present and matching populated layout
- [ ] Every AI recommendation: confidence % + evidence. Every AI edit/draft: before/after diff.
- [ ] ApprovalCard: warning icon, diff, confidence, evidence, Approve/Edit/Reject
- [ ] Focus rings, 44px touch targets, color never the only signal
- [ ] `prefers-reduced-motion` respected
- [ ] Mobile ≤1024px: panel hidden, nav collapsed
- [ ] Verified clean (no console errors)
- [ ] **v3 "Zeely Editorial":** pure white/grey/black (no beige, no orange chrome); Inter UI / Geist Mono numbers; black primary + white secondary buttons; 20px card + image radii
- [ ] **Image-first:** content objects lead with editorial fashion photography (female models in apparel) from `app/design/images`; no stock/illustration/office/glamour
- [ ] **Global AI chat dock** present at the base of the workspace (operator screens), context-aware greeting, quick chips, streaming status — never "How can I help?"
