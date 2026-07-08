# iPix / FashionOS — Design Build Plan

> ⚠️ **SUPERSEDED (2026-07-01).** This is a historical build plan from the initial screen-generation effort (10 operator screens, pre-Analytics). It is **no longer maintained** and contains stale status (e.g. EvidenceBlock/DataTable marked unbuilt — EvidenceBlock is now built and reused on 7 screens; DataTable was never built). **Current source of truth:** `docs/design/DESIGN-TASKS.md §0` (the single design tracker). See also `changelog.md` and `docs/design/DESIGN-AUDIT-2026-07-01.md`. Kept for provenance only.

> Living plan for the Claude Design screen-generation effort. Tracks every operator screen, its required states, and the shared component layer. Pair with `todo.md` (near-term actions) and `changelog.md` (what shipped).

**Product:** iPix / FashionOS — AI-native operator workspace for fashion brands (`fashionos.co`)
**Output format:** HTML prototypes, 3-panel shell, token-driven from `tokens.css`
**Session entry point:** `app/DESIGN.md` — upload this first in every Claude Design session
**Last updated:** 2026-06-28

---

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Done — built and verified |
| 🟡 | In progress |
| 🔵 | Next up |
| ⬜ | Not started |
| ➖ | Not applicable to this screen |

---

## Progress Tracker — Screens

Every operator screen ships with all 5 states: **Populated · Loading · Empty · Error · Approval-pending**.

| # | Screen | Route | Agent | Spec | Status | Populated | Loading | Empty | Error | Approval |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Command Center | `/app` | `production-planner` | ✅ | ✅ Done | ✅ | ✅ | ✅ | ✅ | ✅ |
| 02 | Brand List | `/app/brand` | `brand-intelligence` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 03 | Brand Detail | `/app/brand/[id]` | `brand-intelligence` | ✅ | 🔵 Next | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 04 | Shoots List | `/app/shoots` | `production-planner` | ✅ | 🔵 Next | ⬜ | ⬜ | ⬜ | ⬜ | ➖ |
| 05 | Shoot Wizard | `/app/shoots/new` | `production-planner` | ⬜ | ⬜ | ⬜ | ⬜ | ➖ | ⬜ | ⬜ |
| 06 | Campaigns | `/app/campaigns` | `creative-director` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 07 | Assets | `/app/assets` | `production-planner` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 08 | Onboarding | `/app/onboarding` | `production-planner` | ⬜ | ⬜ | ⬜ | ⬜ | ➖ | ⬜ | ⬜ |
| 09 | Matching | `/app/matching` | `production-planner` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ➖ |
| 10 | Channel Preview | `/app/preview` | `production-planner` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ➖ |

> **Agent note:** `visual-identity` and `social-discovery` are registered in Mastra but not yet wired to routes in `route-agent-map.ts`. Agent column reflects current production routing.

**Completed: 1 / 10 screens.**

---

## Progress Tracker — Shared Component Layer

Shell + composite components reused across screens. Built inline in the Command Center prototype; extract to standalone, reusable components once reused ≥4 times.

| Component | Level | Status | First used | Notes |
|---|---|---|---|---|
| OperatorShell (3-panel grid) | Layout | ✅ | Command Center | `auto · minmax(0,1fr) · auto` |
| NavSidebar (rail + expand) | Layout | ✅ | Command Center | Brand switcher, badges, RECENT |
| IntelligencePanel | Feature | 🟡 | Command Center | Currently bare CopilotSidebar — full build (context→approvals→tabs) is IPI-242+ |
| ApprovalCard (HITL) | Composite | ✅ | Command Center | Amber border, before/after, confidence, evidence |
| DNAScoreBar | Composite | ✅ | Command Center | Overall + Brand/Visual/Voice pillars |
| StatusChip | Composite | ✅ | Command Center | `active` chip; extend to all status values |
| Quick-action chips | Composite | ✅ | Command Center | 3 max, static |
| Chat input | Composite | ✅ | Command Center | Mic + send, center workspace |
| Skeleton states | Primitive | ✅ | Command Center | Shimmer, matches populated layout |
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
4. Every AI write goes through an **ApprovalCard** (amber border `var(--approval-border)`, amber bg `var(--approval-bg)`).
5. Zero hardcoded hex — only semantic tokens from `tokens.css`.
6. All 5 states per screen. Skeleton for loading, never a spinner for content.
7. Agent greeting names the active brand + next action — never "How can I help?".
8. Mobile at `max-width: 1024px`: IntelligencePanel hidden, NavSidebar collapses to rail.
9. Geist Sans body / Geist Mono numbers. Lucide icons. No gradients, no heavy shadows.

---

## Cross-cutting states (design into every screen)

Beyond the 5 data states, every screen must account for:

- **Error recovery** — every error state offers concrete actions: `Retry`, `Report`, `Go back`. Never a dead end.
- **Permissions** — handle `read-only` (viewer), `operator`, and `admin`. Hide or disable write actions (Approve, Edit, generate) for read-only and show a why-disabled hint.
- **Realtime / connection** — handle `connected`, `reconnecting`, and `stale data`. Surface a quiet banner when data is stale or the agent stream drops; never present stale AI output as live.

---

## Milestones

| Milestone | Scope | Status |
|---|---|---|
| **M1 — Shell + Command Center** | 3-panel shell, nav, intel panel, HITL pattern, all 5 states | ✅ Done |
| **M2 — Brand surface** | Brand List + Brand Detail (DNA, approvals, assets, activity) | 🔵 Next |
| **M3 — Production surface** | Shoots List + Shoot Wizard | ⬜ |
| **M4 — Content surface** | Campaigns + Assets | ⬜ |
| **M5 — Acquisition surface** | Onboarding wizard + Matching | ⬜ |
| **M6 — Preview + polish** | Channel Preview, mobile pass | ⬜ |

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
