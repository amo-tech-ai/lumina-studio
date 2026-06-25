---
id: PRD-CAMPAIGN-001
title: "iPix Campaign & Creative Layer — Product Requirements Document"
version: "0.2"
status: Draft — Phase 7 (post shoot workspace)
priority: P2 (Phase 7 in intelligence roadmap — after Phase 5 shoots)
date: "2026-06-25"
owner: Product + Engineering
relationship: "Sits ABOVE docs/prd/shoot-prd.md. A campaign fans out to many shoots; this PRD owns planning entities, the shoot PRD owns execution."
relatedDocs:
  - docs/prd/prd-intelligence.md
  - docs/prd/shoot-prd.md
  - docs/copilotkit/12-mastra-plan.md
  - docs/copilotkit/todo.md
source_of_truth:
  - docs/prd/shoot-prd.md              # shoot execution (sibling, below this layer)
  - docs/shoot/00-ai-native-shoot-system.md
  - prd.md                              # product north star (campaign concept appears here)
verified_against:
  - app/src/app/(operator)/app/campaigns/page.tsx  # placeholder shell
  - app/src/mastra/agents/index.ts                 # creative-director registered (smoke)
  - docs/shoot/01-shoots-dashboard.md
  - supabase/migrations                  # no campaigns / briefs / moodboards tables exist
linear_epic: "TBD — CAMPAIGN-UX-00x (create after Phase 5 shoot proves)"
note: "Phase 7 in prd-intelligence.md §12. Land campaigns + campaign_shoots first; briefs/moodboards when a flow needs them."
---

# iPix Campaign & Creative Layer — PRD

## 0. Why this is a separate PRD

The shoot system (`docs/prd/shoot-prd.md`) executes **one shoot**. But fashion brands don't think in
shoots — they think in **campaigns**: "Summer Collection 2026" = 4 shoots, 40 assets, 100 social
posts, 12 ads, 2 landing pages. A single **creative brief** often fans out to several shoots
(studio / lifestyle / product).

The campaign concept already appears throughout the docs as *context* — `docs/shoot/01:118`
("6 active shoots across Summer Campaign, E-commerce refresh, Influencer collab"), the
"Campaign Launch" wizard type (`03:129`), `campaign_goals` agent input (`11:168`) — but it is
**not a modeled entity**. This PRD makes it one.

It is kept **separate from the shoot PRD on purpose**, mirroring the marketplace/shoot split:
bolting 9 tables + a creative-direction agent into the shoot PRD would break its deliberate
"deferred, design-ready, MVP-disciplined" scope. Same principle, applied consistently.

**Boundary:** this PRD owns *planning* entities (campaign, brief, moodboard, creative concepts,
deliverables-at-campaign-level). The shoot PRD owns *execution* (wizard, shot list, crew, DNA).
The seam is: **Campaign → Creative Brief → (fan out) → Shoots**.

> Inherits intelligence-layer non-negotiables from [`prd-intelligence.md`](./prd-intelligence.md):
> Next.js operator app (`app/`), in-process Mastra, CopilotKit v2, route-selected agents
> (Phases 1–6), **operator-supervisor** (**AIOR-020**) from Phase 4 for cross-workspace intents,
> **HITL before every write**, draft/approval (`*_drafts`) pattern, and
> `Agent → Workflow → HITL → Tool → Edge Fn → Supabase` — never direct DB writes.

---

## 1. Goals & non-goals

### Goals
- Make **campaign** a first-class entity that organizes shoots, assets, and performance.
- Make **creative brief** a first-class entity that can fan out to multiple shoots.
- Promote **moodboards** from a `shoots.mood_board_urls text[]` array to a structured entity
  (board + items + references/inspiration/competitors).
- Add a **Creative Director Agent** (`creative-director` — registered smoke-level in `app/src/mastra/`)
  that produces creative direction (moodboards, concepts, palettes, styling) **before** the shoot's
  `production-planner` runs.
- Feed the existing performance loop (`prd.md` US-08) with campaign-level rollup.

### Non-goals
- Shoot execution, shot lists, crew, DNA scoring → `shoot-prd.md`.
- Booking marketplace → `shoot-research.md` / `prompt-plan.md`.
- Publishing/scheduling automation → content-calendar track.
- **Google ADK as a third orchestration layer** — explicitly out. Long-running campaign
  workflows use **Mastra suspend/resume** + **AIOR-018** snapshots + **AIOR-017** durable agents
  when needed. ADK stays an open question (§7), not a dependency.

---

## 2. The corrected product flow

```
Brand
 → Brand Intelligence (Brand DNA)          [shipped]
 → Campaign                                 [this PRD]
 → Creative Brief                           [this PRD]
 → Moodboard / References / Concepts        [this PRD — Creative Director Agent]
 → Deliverables (campaign-level)            [this PRD; per-shoot deliverables in shoot-prd §8.3]
 → (fan out) Shoots                         [docs/prd/shoot-prd.md — Phase 5]
 → Shot List → Assets → DNA Scoring         [shoot-prd.md]
 → Product Linking → Publishing             [other tracks]
 → Performance Analytics → Learning Loop    [campaign rollup, this PRD §6]
```

One campaign → many briefs (optional) → many shoots → many assets → channel deliverables →
performance, rolled back up to the campaign.

---

## 3. Routes & screens

| Screen | Route | Purpose | As-built (2026-06-25) |
|---|---|---|---|
| Campaigns | `/app/campaigns` | List/grid: shoot count, asset count, DNA pass-rate, status | **Placeholder** (`SectionPlaceholder`) |
| Campaign Detail | `/app/campaigns/:id` | Workspace: shoots, deliverables, briefs, moodboards, performance | Not implemented |
| Briefs | `/app/briefs` · `/app/briefs/:id` | Creative briefs; a brief can spawn N shoots | Not implemented |
| Moodboards | `/app/moodboards` · `/app/moodboards/:id` | Structured boards (items, references, inspirations) | Not implemented |

All under the Operator Hub three-panel cockpit (`OperatorPanel` + `CopilotSidebar`). Default
route agent: **`creative-director`** (target via **IPI-51** map). Right panel runs campaign
workflows + agent assist.

---

## 4. Data model (proposed — keyed to `brands`, draft/final split)

Final (approved) entities, all `brand_id → brands.id`, RLS via `brands.user_id = auth.uid()`:

| Table | Purpose / key columns |
|---|---|
| `campaigns` | brand_id, name, season, status[enum], goal, start/end dates, budget, created_by |
| `campaign_shoots` | campaign_id, shoot_id → links shoots (`docs/prd/shoot-prd.md` §9.1) to a campaign |
| `campaign_assets` | campaign_id, asset_id → asset attribution & rollup |
| `campaign_performance` | campaign_id, metric, value, channel, recorded_at (rollup of `post_analytics`) |
| `briefs` | brand_id, campaign_id (nullable), title, objective, audience, key_messages, status[enum] |
| `brief_shoots` | brief_id, shoot_id → one brief fans out to many shoots |
| `moodboards` | brand_id, campaign_id/brief_id (nullable), title, status[enum] |
| `moodboard_items` | moodboard_id, type: `reference\|inspiration\|competitor\|palette`, url, source, notes, position |
| `creative_concepts` | brand_id, campaign_id, concept, palette[jsonb], styling_notes, origin: `manual\|ai_approved` |
| `campaign_deliverables` | campaign_id, channel[enum], format, quantity, mapped to per-shoot `shoot_deliverables` (`shoot-prd.md` §8.3) |

Draft spine (mirrors `brand_intake_drafts` / `shoot_intake_drafts`):
`campaign_intake_drafts` (draft_campaign, draft_brief, draft_moodboard, draft_concepts jsonb;
status `pending|approved|rejected`; agent_run_id; approved/rejected_at). The Creative Director
Agent writes drafts freely; commit promotes approved drafts to the tables above.

> No migrations from this PRD. Schema ships under a dedicated data task after approval, reusing
> the shoot system's enum/RLS reconciliations (DNA status vocabulary, single-owner `brands`).

---

## 5. Agents & workflows

Distinct Mastra route agents sharing brand context — **not** one mega-agent. Cross-workspace
intents ("create campaign from latest DNA") may route through **`operator-supervisor`**
(**AIOR-020**, Phase 4) once brand + shoot workflows are stable.

### 5.1 Creative Director Agent
| Field | Value |
|---|---|
| Agent id | `creative-director` |
| Home | `app/src/mastra/agents/index.ts` (registered; tools TBD) |
| Runs | **Before** shoot `production-planner` on campaign surfaces |
| Routes | `/app/campaigns/:id`, `/app/briefs/:id`, `/app/moodboards/:id` |
| Inputs | Brand DNA, campaign goal, products, season |
| Outputs (drafts, HITL) | Moodboard items, creative concepts, palettes, styling, references |
| Tools (target) | `draftMoodboard`, `generateCreativeConcepts`, `suggestPalette`, `gatherReferences` — all via `callEdgeFunction` |
| Workflow | `campaign-brief` Mastra workflow (create) — suspend at concept/moodboard approval |
| Guardrail | **AIOR-022** — cannot delete assets, modify billing, or commit without HITL |

### 5.2 Handoff to the shoot system
Approved campaign + brief + creative direction become **L1 context** the shoot wizard
pre-loads (`shoot-prd.md` §8.1: brand, products, channels, campaign goal). Campaign-level
`campaign_deliverables` map down to per-shoot `shoot_deliverables` (`shoot-prd.md` §8.3).

> **Channel planning** = campaign-level `campaign_deliverables` + shoot `planDeliverables` tool —
> no separate agent; consistent with anti-soup principle.

### 5.3 Intelligence layer placement

| Item | Phase | Spec |
|------|-------|------|
| Campaign routes + placeholder | 7 | This PRD |
| `creative-director` tools + workflow | 7 | CAMPAIGN-UX-* (create) |
| Supervisor "plan my season" | 4 | **AIOR-020** · Command Center |
| Browser competitor research | 9 | **AIOR-024** |
| Campaign knowledge RAG | 9 | **AIOR-026** |

---

## 6. KPI / Campaign Intelligence rollup

Closes the learning loop the existing `/app/analytics` + `post_analytics` already started:

`cost per asset` · `cost per approved asset` · `assets per shoot` · `DNA pass-rate` ·
`revenue per asset` · `revenue per shoot` · `top shoot types` · `top photographers / models /
studios` (the latter three pull from the marketplace track once it exists).

---

## 7. Open questions & risks

- Q-1: Is the **brief** layer always present, or optional (campaign → shoots directly for simple cases)?
- Q-2: Do moodboards attach to campaign, brief, *or* shoot — or all three (polymorphic parent)?
- Q-3: **Google ADK** vs Mastra — defer; default is Mastra + **AIOR-017/018**.
- Q-4: Does the Creative Director Agent generate images or only curate URLs in v1?
- R-1: **Phase 7** — sequence after **Phase 5 shoot workspace** proves deliverables→shot-list HITL.
- R-2: Entity sprawl (10 tables). Land `campaigns` + `campaign_shoots` first.
- R-3: Requires **IPI-129**, **AIOR-018**, and brand workflow pattern from Phase 3 before campaign workflows ship.

---

## 8. Roadmap (Phase 7)

Canonical sequencing: [`prd-intelligence.md`](./prd-intelligence.md) §12 · [`todo.md`](../copilotkit/todo.md).

| Order | Deliverable | Depends on |
|-------|-------------|------------|
| 1 | `campaigns` + `campaign_shoots` schema + RLS | Shoot schema (Phase 5) or parallel data task |
| 2 | `/app/campaigns` list + detail shells | **IPI-110**, **IPI-51** |
| 3 | `creative-director` tools → edge drafts | **IPI-113**, **IPI-129** |
| 4 | `campaign-brief` workflow + HITL | **AIOR-018**, **IPI-111** |
| 5 | Briefs + moodboards entities (if flow needs) | Step 4 proven |
| 6 | Campaign performance rollup | `post_analytics` + shoot assets |

**Do not start before:** Phase 5 shoot wizard HITL is green; Phase 2 agent platform (PG storage, snapshots) shipped.

---

## 9. Definition of Done (PRD acceptance)

- [ ] `campaign` is a modeled entity that organizes shoots (`campaign_shoots`), not just context.
- [ ] `brief` can fan out to multiple shoots (`brief_shoots`).
- [ ] Moodboards are structured (`moodboards` + `moodboard_items`), superseding `shoots.mood_board_urls`.
- [ ] Creative Director Agent runs before `production-planner`, drafts-only, HITL before write.
- [ ] Campaign-level deliverables map down to shoot-level deliverables (no duplication of the shoot PRD).
- [ ] Mastra orchestration; ADK explicitly deferred (no third layer).
- [ ] Routes added: `/app/campaigns*`, `/app/briefs*`, `/app/moodboards*`.
- [ ] Aligned with intelligence **Phase 7** and Mastra platform specs (**AIOR-017–022**).
- [ ] `creative-director` is the route agent; supervisor (**AIOR-020**) handles cross-workspace only.
- [ ] No production code, migrations, or schema changed by this PRD pass.
