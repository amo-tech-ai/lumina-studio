# FashionOS / iPix — Design Handoff (Single Source of Truth)

> Implementation handoff for Claude Code / any coding agent. Built from the verified Claude Design prototypes (`*.v2.image-first.dc.html`). **Read this index first, then `12-production-handoff.md`.**
> Design language: **Zeely Editorial v3** — pure white / grey / black, Inter, black primary actions, image-first, a global AI chat dock on every operator screen.
>
> ⚠️ **Scope note — design vs. code repo.** This project is the **design** source (DC prototypes + specs). There is **no `app/` React code here** — "React vs Design drift" and production/`app/` parity must be audited **in the code repo**, against these specs (`09-react-implementation-map.md`, `13-react-mobile-verification.md`), not within this project. See `docs/design/DESIGN-AUDIT-2026-07-01.md` (R1).

## Document summary

| # | Doc | Covers | Read when |
|---|-----|--------|-----------|
| — | **handoff.md** (this) | Index, summary table, coverage | First |
| 01 | [overview](01-overview.md) | Purpose, philosophy, Zeely v3, desktop/mobile layout, AI-first + image-first | Orientation |
| 02 | [screen-map](02-screen-map.md) | All 13 screens (11 operator + Analytics Overview + Campaign Performance): route, agent, entries/exits, components, states, priority + nav diagram | Planning |
| 03 | [component-map](03-component-map.md) | 20 shared components (incl. **EvidenceBlock**): props, variants, states, React target, deps | Before building UI |
| 04 | [user-journeys](04-user-journeys.md) | 8 end-to-end flows with Mermaid | Planning |
| 05 | [feature-map](05-feature-map.md) | Every feature: user/business value, AI, backend, order | Scoping |
| 06 | [ai-workflows](06-ai-workflows.md) | Docks, greetings, quick actions, HITL, confidence/evidence, retry + sequence diagrams | AI wiring |
| 07 | [navigation-map](07-navigation-map.md) | Routes, links, deep links, mobile nav, More sheet + Mermaid | Routing |
| 08 | [state-map](08-state-map.md) | Per-screen states + transitions | State logic |
| 09 | [react-implementation-map](09-react-implementation-map.md) | Per screen: page, components, APIs, agent, Supabase, Cloudinary, CopilotKit, Mastra, Gemini, acceptance | Implementation |
| 10 | [implementation-order](10-implementation-order.md) | Recommended build sequence + Mermaid | Sequencing |
| 11 | [screen-checklists](11-screen-checklists.md) | Per-screen implementation checklists | Per-screen build |
| 12 | [production-handoff](12-production-handoff.md) | How to read the design, order, tokens, responsive, testing, pitfalls, do/don't | Kickoff |
| 13 | [react-mobile-verification](13-react-mobile-verification.md) | Mobile parity checklist for the React port (per screen @390/768/1024) | Mobile QA |
| 14 | [ai-runtime-contract](14-ai-runtime-contract.md) | **AI-native runtime + backend contract** — Screen→Agent→Workflow→Approval→DB matrix, CopilotKit + Mastra + Supabase ownership, AI approval state machine, RT-1..8 tasks | **AI/backend wiring** |

## Coverage at a glance

| Area | Count | Documented |
|---|:--:|:--:|
| Screens | 11 | ✅ 11/11 |
| Shared components | 21 | ✅ 21/21 (EvidenceBlock added; reused on Brand Detail, Assets, Matching, Campaigns, Channel Preview) |
| User journeys | 8 | ✅ 8/8 |
| AI docks / agents | 5 agents | ✅ |
| Routes | 11 + deep links | ✅ |
| State types | 8 | ✅ |
| Mermaid diagrams | 12+ | ✅ |

**Implementation coverage: 100% of the prototype surface is documented.** The **AI-native runtime + backend contract** (agent↔workflow↔approval↔DB per screen, CopilotKit/Mastra/Supabase ownership, AI approval state machine) is scaffolded in **`14-ai-runtime-contract.md`** — columns are correct + grounded, exact schema/tool signatures are marked _TBD_ for Claude Code to fill against the live repo (tasks **RT-1..8**). Design-side performance budget: `docs/design/PERFORMANCE.md`.

### Canonical reusable patterns (apply across screens — do not fork)
- **EvidenceBlock** (`components/EvidenceBlock.dc.html`) — the single AI-explainability surface (score→potential, confidence, why, AI reasoning, evidence, suggestions, before/after, Approve→re-score). Reused on Brand Detail (per-pillar DNA), Assets (DNA match), Matching (creator fit), Campaigns (campaign health), Channel Preview (channel readiness). Spec: `AI-EXPLAINABILITY.md`. **Never build a second explainability component.**
- **Selectable + draggable cards** (D-DS5) — Select toggle + per-card checkbox + sticky bulk-action bar + drag-to-target drop dock, driven through each card's `onSelect`/`selected`/`border` props (no card fork). Reference build: Assets masonry; also Matching table, Campaigns grid. Spec: `PATTERNS.md#selection`.

## Source prototypes (canonical)

`Command Center` · `Brand List` · `Brand Detail` · `Shoots List` · `Shoot Detail` · `Shoot Wizard` · `Campaigns` · `Assets` · `Matching` · `Channel Preview` (`.v2.image-first.dc.html`) + `Pages/Onboarding.v2.zeely.dc.html`. Shared components in `components/`. Pre-v2 files are archived in `archive/` (do not use).

## Companion design docs (also source of truth)
`DESIGN.md` (visual system) · `tokens.css` (design tokens) · `components/COMPONENTS.md` (component reference) · `AI-EXPLAINABILITY.md` (mandatory AI-review/EvidenceBlock standard) · `docs/design/PATTERNS.md` (forms · tables · charts · KPI · **selection** · notifications) · `docs/design/DESIGN-TASKS.md` (§0 Progress Task Tracker) · `MOBILE-PLAN.md` (mobile strategy) · `checklist.md` (QA + audit) · `PLAN.md` (build plan).
