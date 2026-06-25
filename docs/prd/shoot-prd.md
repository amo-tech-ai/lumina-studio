---
id: PRD-SHOOT-001
title: "iPix Shoot System — Product Requirements Document"
version: "1.2"
status: Draft — design-ready, Phase 5 (post brand MVP)
priority: P1 (post-MVP core — Phase 5 in intelligence roadmap)
date: "2026-06-25"
owner: Product + Engineering
relatedDocs:
  - docs/prd/prd-intelligence.md
  - docs/copilotkit/12-mastra-plan.md
  - docs/copilotkit/todo.md
  - docs/intelligence/ai/02-ai-native-dashboards-plan.md
supersedes_language_in:
  - docs/shoot/*  (legacy /dashboard/shoots routing and per-agent Gemini specs)
source_of_truth:
  - docs/shoot/00-ai-native-shoot-system.md   # AI-native contract (binding)
  - docs/shoot/README.md                        # doc index + task map
  - docs/shoot/12-shoot-schema.md               # data model (planning)
  - docs/shoot/shoot-research.md                # marketplace/competitive research (sibling)
  - prd.md                                       # product north star
  - docs/07-user-journeys.md                     # shoot journey
verified_against:
  - app/src/app/(operator)/app/shoots/page.tsx   # placeholder shell (SectionPlaceholder)
  - app/src/mastra/agents/index.ts               # production-planner registered (smoke-level)
  - app/src/components/operator-panel/operator-panel.tsx
  - supabase/migrations (no AI-native shoot tables yet; legacy FashionOS tables exist)
linear_epic: "IPI-84 … IPI-87 (SHOOT-UX-001 … 004) · IPI-148 … IPI-151 (SHOOT-AI-001 … 004) · iPix1 team"
note: "Canonical PRD at docs/prd/shoot-prd.md. Sequenced as Phase 5 in prd-intelligence.md §12 (after brand MVP + agent platform)."
---

# iPix Shoot System — PRD

## 0. How to read this document

This PRD is the **canonical product spec** for the iPix shoot system. It synthesizes the
existing shoot docs (`docs/shoot/00`–`14`), the product north star (`prd.md`), and the
verified state of the codebase into one approvable contract.

It is **scoped to production execution** — planning, briefing, shot-list generation, shoot
execution, and the asset/DNA handoff. It is **not** the booking marketplace. The vendor
directory, availability, quotes, Stripe Connect, and multi-vendor booking are a **separate
track**, researched in `docs/shoot/shoot-research.md` and prompted in `docs/shoot/prompt-plan.md`.
The only seam between the two is advanced crew matching (§7, deferred). Keep the two PRDs
distinct.

Where this PRD and a legacy doc disagree, **this PRD and `00-ai-native-shoot-system.md` win.**

---

## 1. Executive summary

Fashion and DTC brands run 10–20 content shoots a year and start every one from a blank page:
vague briefs, copy-pasted shot lists, Googled channel specs, guessed budgets, and no
post-shoot measurement (`prd.md:45`). The iPix shoot system turns that into an **operator
cockpit**: the operator opens a wizard, the AI drafts a channel-aware shot list from the
brand's DNA and products, the operator edits and **approves**, and the shoot becomes a live
workspace where assets are uploaded, DNA-scored, and handed to commerce.

The product principle is fixed and non-negotiable: **humans decide, AI assists, nothing
writes production data silently** (`docs/shoot/00:41`). Every AI output is a reviewable draft;
nothing reaches `shoots`, `shot_list`, crew, or package tables without an explicit
human-in-the-loop (HITL) approval. This mirrors the **`brand_intake_drafts`** pattern
(**[IPI-132](https://linear.app/amo100/issue/IPI-132) AIOR-003**; requires **[IPI-134](https://linear.app/amo100/issue/IPI-134) AIOR-018** workflow snapshots), which is the proven
template this system extends.

**Status today:** design-ready, **Phase 5** in the intelligence roadmap. The operator
Next.js app (`app/`) has a `/app/shoots` placeholder, `production-planner` is registered
in-process with smoke-level tools/memory (`:memory:` until **IPI-129**), but shoot schema,
wizard UI, core tools, and `shoot-wizard` workflow do **not** exist yet (§3).

---

## 2. Problem, opportunity, and goals

### 2.1 Problem
- Briefs start blank every shoot; no institutional memory (`prd.md:117`).
- Amazon, Shopify, and social teams each demand different crops of the *same* shoot, so brands
  reshoot instead of planning multi-channel coverage once (`prd.md:118,136`).
- Reshoots cost $2K+ because the brief was wrong (`prd.md:174`).
- Nobody can answer "what should we shoot next month?" with data (`prd.md:191`).

### 2.2 Opportunity
Make the shoot the place where Brand DNA becomes a concrete, channel-complete production plan
in minutes, and where every captured asset is measured against that DNA — closing the
`Brand Intelligence → Production → Performance → next brief` loop (`prd.md:62`).

### 2.3 Goals (binding — from `docs/shoot/00:47`)

| Goal | Requirement |
|---|---|
| Canonical routes | `/app/shoots`, `/app/shoots/:id`, `/app/shoots/new` (never `/dashboard/shoots`) |
| Agent architecture | One Mastra `production-planner` route agent owns all shoot routes |
| UI runtime | CopilotKit v2 in `app/` — `useAgent`, `useAgentContext`, `useRenderToolCall`, HITL interrupt |
| Runtime topology | In-process Mastra via `/api/copilotkit` — **never** standalone `:4111` server |
| Write boundary | Agent → Workflow → HITL → Tool → Edge Fn → Supabase — **never** direct DB write |
| Human approval | Persist shoots, shot lists, crew, and packages **only** after approval |
| Draft/final split | Model agent drafts separately from approved records (reuse the `*_drafts` pattern) |
| MVP discipline | Stay deferred/design-ready until explicitly pulled into scope |

### 2.4 Non-goals (this PRD)
- Booking marketplace, vendor onboarding, availability truth, quotes, Stripe Connect → `shoot-research.md` / `prompt-plan.md`.
- Autonomous/batch actions or a supervisor agent mesh → advanced, post-core.
- Postiz/calendar publishing automation → follows the content-calendar track.
- Net-new DNA scoring engine → consumes the existing `asset-dna` / DNA-001 work, does not redefine it.

---

## 3. Current state (verified)

| Area | State | Evidence |
|---|---|---|
| Operator app (`app/`) | **Live** | Next.js 16 · `/app/*` under `(operator)` layout |
| Route `/app/shoots` | **Placeholder** | `SectionPlaceholder` — no grid/wizard/detail yet |
| Routes `/app/shoots/:id`, `/app/shoots/new` | **Not implemented** | — |
| `production-planner` Mastra agent | **Registered (smoke)** | `app/src/mastra/agents/index.ts` · empty `agentTools` · `:memory:` LibSQL |
| CopilotKit operator panel | **Live** | `OperatorPanel` hardcodes `AGENT_ID = "production-planner"` until **IPI-51** route map |
| Route → agent map | **Pending** | **IPI-51 · DASH-005** — all routes use `production-planner` today |
| AI-native shoot schema | **Not migrated** | no `shoots(brand_id…)`/`shot_list` in platform migrations |
| Legacy FashionOS shoot tables | **Exist in migration history** | `shoots.designer_id`, `shoot_items`, etc. |
| HITL draft/commit pattern | **Proven for brand** | `brand_intake_drafts` — shoot uses `shoot_intake_drafts` (spec) |
| Mastra PG storage | **Blocked** | **IPI-129 · AIOR-013** — required before shoot workflows |
| Wireframes | **Complete** | `tasks/wireframes-ipix/new/02,03,10,W1` |
| Linear (iPix1) | **Created** | **IPI-84…87** SHOOT-UX · **IPI-148…151** SHOOT-AI · **IPI-112** SHOOT-UX-000 ✅ |

**Decision required (D-1):** the legacy `shoots` table is keyed to `designer_id` (FashionOS
service booking); the iPix operator model is keyed to `brands.user_id` (single-owner, per the
MVP schema `20260614000000_ipix_platform_mvp.sql`). This PRD specifies a **new AI-native
schema keyed to `brand_id`** and treats the FashionOS shoot tables as **legacy/superseded**.
The data task must either (a) create new tables under fresh names, or (b) migrate
the legacy tables, but must not silently reuse the `designer_id` semantics. See §9.
Track as a dedicated data issue after **Phase 2 agent platform** (IPI-129) lands.

---

## 4. Personas & top user stories

Personas inherit from `prd.md`. The shoot system's primary user is the **brand operator /
content lead**, with the **producer/photographer** as a downstream consumer of the plan.

| ID | As a… | I want… | So that… | Acceptance |
|---|---|---|---|---|
| SH-01 | Operator | to start a shoot from a wizard pre-filled with my brand, products, and channels | I don't start from a blank page | Wizard step 1 shows brand DNA + product context via `useAgentContext` |
| SH-02 | Operator | the AI to draft a channel-aware shot list I can edit | I get multi-channel coverage in one shoot, not reshoots | `generateShotListDraft` renders an editable artifact with per-channel rationale |
| SH-03 | Operator | to approve, edit, or reject every AI draft before it saves | nothing is written behind my back | HITL card; DB write only on approve (`docs/shoot/00:113`) |
| SH-04 | Operator | a shoot workspace with tabs (overview, shot list, assets, crew, package) | I can run the shoot end-to-end | `/app/shoots/:id` with tabbed layout |
| SH-05 | Operator | uploaded assets scored against Brand DNA with flags explained | I know which shots are on-brand before publishing | `shoot_assets.dna_*` populated; `explainShootDnaAlerts` |
| SH-06 | Growth lead | to see which shoot style drove conversion | I can justify next month's creative direction | asset → channel → metric link (advanced; ties to performance loop) |

---

## 5. Scope — Core vs Advanced

Core = an executable plan that ships after the approved MVP surfaces. Advanced = useful
production features that must **not** block the MVP proof chain (`docs/shoot/README.md:62`).

| Core (this PRD targets) | Advanced (explicitly deferred) |
|---|---|
| `/app/shoots` grid/list/calendar shell | Crew marketplace automation (needs vendor/availability truth) |
| `/app/shoots/:id` workspace (tabs) | Location map planning co-agent |
| `/app/shoots/new` wizard + playbooks | Production package PDF export/send |
| `production-planner` route-agent contract + core tools | Calendar/Postiz publishing automation |
| `shoot-wizard` Mastra workflow + **AIOR-018** snapshots | Autonomous batch actions |
| Shot-list draft generation + HITL approval | Video packs/overlays/ecommerce expansion |
| `useAgentContext` shoot context (**IPI-50**) | **AIOR-020** supervisor routing (Phase 4) |
| HITL approval cards (**IPI-111 · AIOR-008**) | Observational memory (**AIOR-019**) at scale |
| Deliverables → shot list workflow (§8.3) | Browser-based location research (**AIOR-024**) |

---

## 6. Surfaces, routes & screens

| Screen | Route | Purpose | Wireframe |
|---|---|---|---|
| Shoots Dashboard | `/app/shoots` | Grid/list/calendar of shoot cards (status, date, location, DNA score); right-panel risk queue | `02-shoots-dashboard.md` |
| Shoot Wizard | `/app/shoots/new` | 6 steps: Basics → Brief → **Deliverables** → Crew → Shot List → Review (+ budget estimate) | `W1-shoot-wizard.md`, `03-shoot-wizard.md` |
| Shoot Detail | `/app/shoots/:id` | Tabs: Overview · **Deliverables** · Shot List · Assets/Gallery · Crew · Mood Board · Documents · DNA Audit | `02-shoot-detail-page.md` |
| Production Package | `/app/package` | Call sheet/brief/docs (Advanced) | `10-production-package.md` |

Layout follows the approved Operator Hub three-panel cockpit: left nav (production context),
center human work surface, right intelligence panel (explains, recommends, asks for approval)
(`docs/shoot/00:205`).

---

## 7. AI architecture (Mastra + CopilotKit v2)

Aligned with [`prd-intelligence.md`](./prd-intelligence.md) and [`12-mastra-plan.md`](../copilotkit/12-mastra-plan.md).

### 7.0 Execution chain (non-negotiable)

```text
production-planner → shoot-wizard (Mastra) → HITL suspend/resume → createTool → Edge Fn → Supabase
```

Never: agent or tool writes production tables directly. All mutations go through edge functions with RLS.

### 7.1 Route agent
| Field | Value |
|---|---|
| Agent id | `production-planner` |
| Home | `app/src/mastra/agents/` (in-process; registry in `app/src/mastra/index.ts`) |
| Runtime | `/api/copilotkit` · `MastraAgent.getLocalAgents({ mastra, resourceId })` |
| Routes | `/app/shoots`, `/app/shoots/:id`, `/app/shoots/new` |
| Guardrail | **Never commit final records without HITL approval** (**AIOR-022** guardrails when wired) |
| Model | Gemini via `@ai-sdk/google` + `GEMINI_API_KEY` (registry in `mastra/models`) |
| Memory | Working memory enabled (smoke); **IPI-129** + **AIOR-019** for durable threads |
| Logging | Tool calls + approvals → `ai_agent_logs` (**IPI-105** slice → **AIOR-025**) |

### 7.2 Tools
| Tool | Tier | Purpose |
|---|---|---|
| `recommendShootType` | Core | Suggest shoot type from brief, products, channels, brand DNA |
| `planDeliverables` | Core | Turn target channels into a **deliverables plan** (counts per channel/format, e.g. 10 IG feed · 5 Stories · 20 PDP) that the shot list must satisfy |
| `generateShotListDraft` | Core | Derive structured draft shots **from the approved deliverables** (deliverables → shots, not the reverse), with channel specs + coverage rationale |
| `estimateShootBudget` | Core | Estimate shoot cost from crew rates, studio/equipment, looks count, and deliverables; returns an editable estimate (HITL) |
| `explainShootDnaAlerts` | Core | Explain why a shoot/asset set needs review |
| `saveApprovedShootDraft` | Core | Persist approved shoot draft after HITL |
| `approveShotList` | Core | Persist approved shot rows after HITL |
| `matchShootCrew` | Advanced | Recommend crew once network/availability data is reliable (seam to marketplace) |
| `generateProductionPackage` | Advanced | Draft call sheet / brief / package docs |
| `scheduleShootContent` | Advanced | Calendar/Postiz handoff after approval |

### 7.3 CopilotKit v2 contract (operator `app/`)
| Layer | Shoot usage | Hook / pattern |
|---|---|---|
| L1 context | Brand, shoot, tab, deliverables, shot rows | `useAgentContext` (**IPI-50**) |
| L2 right-panel intelligence | Risks, gaps, suggestions, approval cards | `useRenderToolCall` (**IPI-128**) |
| L3 route agent | `/app/shoots*` → `production-planner` via **IPI-51** map | `useAgent({ agentId })` |
| L4 generative artifacts | Editable shot-list & deliverables in center workspace | Gen UI + workflow state |
| L5 HITL before writes | Approve/reject/edit before saving final records | Workflow `suspend`/`resume` + **IPI-111** |

**Forbidden:** `useCoAgent`, `useCopilotReadable`, v1 CopilotKit APIs (`app/eslint.config.mjs` guard).

### 7.4 Mastra ↔ Edge boundary
Mastra owns agent/tool/**workflow** orchestration with suspend/resume (**AIOR-018** snapshots
after **IPI-129**). Supabase Edge Functions remain **secure service wrappers** (DB writes,
secret-bound Gemini) called by Mastra tools via `callEdgeFunction` — **not** independent
browser-facing AI agents (`docs/shoot/13`, audit `:51`).

### 7.5 Platform dependencies (shoot-specific)

| Spec | Why shoot needs it |
|------|-------------------|
| **IPI-129 · AIOR-013** | Postgres storage — workflows + memory survive restart |
| **AIOR-018** | `shoot-wizard` suspend/resume without losing operator edits |
| **AIOR-017** | Long budget/shot-list generation runs (optional Phase 5+) |
| **AIOR-022** | Tool restrictions — planner cannot delete assets or touch billing |
| **IPI-113 · AIOR-004** | `agentTools` registry populated with shoot tools |
| **IPI-51 · DASH-005** | Route map wires `/app/shoots*` → `production-planner` |

---

## 8. Core workflows

### 8.1 Shoot wizard (happy path)
```
Open /app/shoots/new
  → L1 context: brand, products, channels, campaign goal
  → production-planner: recommendShootType
  → operator edits brief + channels
  → tool: generateShotListDraft → editable artifact (L4)
  → operator approves?  ──Revise──> edit brief
                        ──Approve─> saveApprovedShootDraft + approveShotList
  → navigate to /app/shoots/:id
```
(Mermaid source in `docs/shoot/00:83`.)

### 8.2 Shot-list HITL (the core safety property)
Agent drafts a channel-specific shot list → UI renders an editable approval artifact →
operator approves/edits/rejects → workflow resumes with the decision → **only approved rows**
are written to `shot_list` (`docs/shoot/00:96`). Rejected/edited drafts persist as draft state
so a suspended workflow can resume without losing operator edits.

### 8.3 Deliverables → Shot List (coverage-driven planning)
The shot list is **derived from deliverables, not invented first**. This guarantees every
required channel asset is covered and makes budget/coverage gaps explicit before the shoot.

```
Operator picks target channels
  → planDeliverables: channels → deliverables plan
      (e.g. Instagram: 10 feed + 5 stories · Shopify PDP: 20 · Amazon: 6 + hero · TikTok: 3)
  → operator edits deliverables (add/remove/retarget)  ── HITL ──> approve deliverables
  → generateShotListDraft: deliverables → shots that satisfy each line
      (each shot maps to ≥1 deliverable; un-covered deliverables flagged)
  → operator approves shot list  ── HITL ──> write shot_list + shoot_deliverables links
  → estimateShootBudget: crew + studio/equipment + looks + deliverables → estimate (HITL)
```

**Why this direction:** deliverables are the brand's actual requirement (what channels need);
shots are the means. Inverting the flow (shots→deliverables) is how brands end up under-covering
a channel and paying for reshoots — the exact pain in `prd.md:118,136`. Coverage warnings in the
existing contract (`docs/shoot/00:123`) become *precise*: "deliverable X has 0 shots."

---

## 9. Data model

**Principle:** draft state is modeled **separately** from final approved records, with full
auditability (agent run id, approving user, decision, timestamp, source context)
(`docs/shoot/12:39`). Reuse the shipped `brand_intake_drafts` shape as the template.

### 9.1 Final (approved) tables — AI-native, keyed to `brands`
Per `docs/shoot/12`, corrected for the real platform schema:

- `shoots` (brand_id → **brands.id**, name, type[enum], status[enum], dates, location, brief,
  target_channels[], dna_score, created_by,
  **budget fields:** `estimated_budget numeric`, `actual_cost numeric`, `currency text default 'USD'`,
  `budget_breakdown jsonb` (crew/studio/equipment/post line items))
- `shot_list` (shoot_id, description, channel, aspect_ratio, style_notes, priority, status,
  order, origin: `manual|ai_approved`)
- `shoot_deliverables` (shoot_id, channel[enum], format, **quantity int**, aspect_ratio,
  status: `planned|covered|delivered`, origin: `manual|ai_approved`) — the channel-requirement
  rows that `shot_list` must satisfy (workflow §8.3)
- `shot_deliverable_links` (shot_id, deliverable_id) — many-to-many; proves coverage and powers
  "deliverable has 0 shots" warnings — unique(shot_id, deliverable_id)
- `shoot_assets` (shoot_id, cloudinary_id, url, dna_score, dna_scores/flags/suggestions[jsonb],
  status[enum], override_by/reason)
- `shoot_crew` (shoot_id, role[enum], confirmed, **`internal_contact_id` → contacts.id (nullable)**,
  **`marketplace_vendor_id` uuid (nullable)** — exactly one required via
  `check (num_nonnulls(internal_contact_id, marketplace_vendor_id) = 1)`; future-proofs the
  marketplace seam (Q-4) without coupling to it now) — unique(shoot_id, role, internal_contact_id, marketplace_vendor_id)
- support: `asset_tags`, `asset_channels`, `channel_specs` (seeded), `media_collections`
- professional/scheduling tables (`photographers`, `models`, `studios`,
  `professional_availability`, `scheduled_posts`, `post_analytics`) → **Advanced**, gated on the
  marketplace/network track, not core.

### 9.2 Draft / workflow-state table (new — the HITL spine)
`shoot_intake_drafts` (mirrors `brand_intake_drafts`): user_id, brand_id, status
(`pending|approved|rejected`), `draft_shoot`(jsonb), `draft_shot_list`(jsonb),
`agent_run_id`, `source_context`(jsonb), approved_at/rejected_at, expires_at. The route agent
writes here freely; commit promotes approved drafts into §9.1 tables.

### 9.3 RLS (corrected — D-1)
The legacy schema doc uses a `brand_users` join (`docs/shoot/12:213`). **The live platform has
no `brand_users` table** — `brands` is single-owner via `brands.user_id`. Core RLS must scope
all shoot rows through `brand_id → brands.user_id = auth.uid()`, matching the existing
`brands`/`brand_scores`/`assets` policies. A future multi-tenant `brand_users` table is an
**open question (Q-2)**, not a core dependency.

### 9.4 Enums (from `docs/shoot/12`)
`shoot_type`, `shoot_status`, `asset_status`, `shot_status`, `crew_role`, `channel`,
`post_status`. Note the DNA status vocabulary must align with the platform standard
(`approved|review|blocked`, per CLAUDE.md design system) — reconcile the doc's
`pending|approved|flagged|rejected` against the shipped `assets.dna_status` before migrating.

> No migrations are created by this PRD. Schema ships under the dedicated data task **IPI2-111**
> after D-1 and the enum/RLS reconciliations are approved (`docs/shoot/12:47`).

---

## 10. Functional requirements

| # | Requirement | Tier |
|---|---|---|
| FR-1 | `/app/shoots` lists shoots for the operator's brand with status/date/DNA; supports grid/list/calendar | Core |
| FR-2 | `/app/shoots/new` 5-step wizard with brand/product context pre-loaded | Core |
| FR-3 | `recommendShootType` suggests a type; operator can override | Core |
| FR-4 | `planDeliverables` turns target channels into an editable deliverables plan (counts per channel/format) — approved before shots (§8.3) | Core |
| FR-5 | `generateShotListDraft` derives shots **from approved deliverables**; every deliverable maps to ≥1 shot, un-covered deliverables flagged | Core |
| FR-6 | `estimateShootBudget` produces an editable cost estimate (crew/studio/equipment/post); approved estimate persists to `shoots` budget fields | Core |
| FR-7 | Every AI draft requires explicit approve/edit/reject; DB write only on approve | Core |
| FR-8 | Approved shoot + deliverables + shot list persist to §9.1 tables; rejected drafts retained as draft state | Core |
| FR-9 | `/app/shoots/:id` workspace with tabs incl. Deliverables, Shot List, Assets (DNA), Crew | Core |
| FR-10 | Crew rows accept an internal contact **or** a marketplace vendor (dual-FK, exactly one); marketplace side stays inert until that track ships | Core |
| FR-11 | Uploaded assets DNA-scored; flags explained via `explainShootDnaAlerts` | Core |
| FR-12 | All agent tool calls + approval decisions logged to `ai_agent_logs` | Core |
| FR-13 | Crew matching, package export, calendar publishing | Advanced |

---

## 11. Non-functional requirements

- **Security/HITL:** no silent writes; service-role writes bounded to approved workflows (`docs/shoot/12:44`).
- **RLS:** every shoot-scoped table enforces brand ownership; unauthenticated reads return empty.
- **Auditability:** draft + decision history reconstructable per shoot.
- **Performance:** dashboard list query indexed on `brand_id`, `status`, `start_date`; shot-list draft round-trip target ≤ a few seconds (Gemini Flash).
- **Resilience:** suspended Mastra workflows resume without losing operator-edited drafts.
- **Stack conformance:** Next.js 16 operator app + React/TS/Tailwind/shadcn; Vite marketing site; Supabase + Edge; Cloudinary for media.

---

## 12. Dependencies

| Depends on | Why | Status |
|---|---|---|
| **prd-intelligence Phases 1–3** | Operator shell, PG storage, brand workflow pattern | In progress |
| `brands` / `brand_scores` (MVP schema) | Brand ownership + DNA context | Shipped |
| **IPI-129 · AIOR-013** | Mastra Postgres storage for workflows/memory | Backlog |
| **AIOR-018** | Workflow snapshots for wizard HITL | Create |
| **IPI-51 · DASH-005** | Route → `production-planner` | Backlog |
| **IPI-113 · AIOR-004** | Tool registry + edge-backed tools | Shell only |
| Asset DNA pipeline (DNA-001 / IPI-19) | `shoot_assets.dna_*` scoring | In progress |
| Cloudinary architecture (IPI-30) | Asset upload/delivery | Planned |
| `contacts` table | Crew links | Exists (FashionOS) — verify shape |
| CopilotKit v2 + in-process Mastra | `app/` runtime | **IPI-48** ✅ · **IPI-110** 🟡 |
| `ai_agent_logs` | Tool/approval logging | Shipped |
| Campaign layer (optional) | Campaign goal pre-loads wizard L1 | **campaign-prd.md** Phase 7 |

---

## 13. Roadmap

### 13.1 Intelligence layer sequencing (canonical)

Shoot work is **Phase 5** in [`prd-intelligence.md`](./prd-intelligence.md) §12 — after
Phases 1–4 (foundation → agent platform → brand MVP → command center).

| Phase | Name | Shoot relevance |
|-------|------|-----------------|
| 1–2 | Foundation + agent platform | **IPI-129**, **IPI-133–135** (AIOR-017–019), **IPI-113** — blocks shoot workflows |
| 3–4 | Brand MVP + command center | Brand DNA feeds shoot wizard L1 context; **IPI-132** brand-intake pattern |
| **5** | **Shoots workspace** | **This PRD** — SHOOT-UX-001–004 + SHOOT-AI-001–004 |
| 6 | Assets | DNA handoff from shoot gallery (IPI-152–155) |
| 7 | Campaigns | Optional campaign goal → wizard pre-load (IPI-156–159) |

**Task tracker:** [`docs/copilotkit/todo.md`](../copilotkit/todo.md) § Master execution order + Shoot AI.

### 13.2 Linear map (iPix1 team)

| Phase | Spec | Linear | Deliverable |
|---|---|---|---|
| **0 · Design review** | SHOOT-UX-001 | [IPI-84](https://linear.app/amo100/issue/IPI-84) | Approve this PRD + scope; resolve D-1 |
| **1 · Data + RLS** | SHOOT-DATA-001 (create) | TBD | AI-native schema (§9) incl. `shoot_intake_drafts` |
| **2 · Agent + tools** | SHOOT-AI-001 | [IPI-148](https://linear.app/amo100/issue/IPI-148) | Shoot planner agent + `production-planner` tools |
| **2b · Tools** | AIOR-004 slice | [IPI-113](https://linear.app/amo100/issue/IPI-113) | Core tools in `agentTools` + edge wrappers |
| **3 · Workflow** | SHOOT-AI-002 | [IPI-149](https://linear.app/amo100/issue/IPI-149) | `shoot-wizard` Mastra workflow + **IPI-134** snapshots |
| **3b · UX workflow** | SHOOT-UX-004 | [IPI-87](https://linear.app/amo100/issue/IPI-87) | 6-step wizard UI bound to workflow |
| **4 · Frontend shells** | SHOOT-UX-002/003 | [IPI-85](https://linear.app/amo100/issue/IPI-85), [IPI-86](https://linear.app/amo100/issue/IPI-86) | Dashboard, detail under `/app/shoots*` |
| **5 · Shot-list AI** | SHOOT-UX-004 AC | IPI-87 | `generateShotListDraft` artifact + HITL |
| **6 · HITL UI** | SHOOT-AI-003 | [IPI-150](https://linear.app/amo100/issue/IPI-150) | Approval gates + [IPI-111](https://linear.app/amo100/issue/IPI-111) cards |
| **7 · Deliverables** | SHOOT-AI-004 | [IPI-151](https://linear.app/amo100/issue/IPI-151) | PDF/brief export |
| **Gemini** | GEMINI-011 / 017 | [IPI-174](https://linear.app/amo100/issue/IPI-174), [IPI-180](https://linear.app/amo100/issue/IPI-180) | Document processing + code exec (after IPI-148) |
| **Advanced** | — | new issues | Crew matching, package export, publishing |

**Prerequisites before Phase 5 starts:** IPI-129 Postgres storage, **IPI-134** snapshot pattern proven on **IPI-132** brand workflow, IPI-51 route map, IPI-110 shell.

**Dedup:** Legacy **IPI-115** “shoot-planner-workflow” (if present) → superseded by **SHOOT-AI-002 (IPI-149)**.

**Legacy IPix-OLD IDs (IPI2-104…112):** mirrored on iPix1 as IPI-84…87, IPI-112 — use iPix1 for new work.

---

## 14. Success metrics

| Metric | Target | Source |
|---|---|---|
| Shot-list creation time | week → ≤ 1 hour | `prd.md:132` |
| Multi-channel coverage per shoot | ≥ 3 channels planned in one shoot | reshoot reduction (`prd.md:118`) |
| Draft → approved without major edits | ≥ 80% usable | `prd.md:73` |
| Reshoots caused by wrong brief | trending to zero | `prd.md:133` |
| % assets DNA-scored at upload | 100% | DNA gating |

---

## 15. Risks & open questions

**Risks**
- R-1: Legacy FashionOS shoot tables collide semantically with the new `brand_id` model (D-1). Mitigation: explicit migrate-or-supersede decision in IPI2-111.
- R-2: Mastra/CopilotKit v2 package APIs may have moved; verify before coding (audit `:106`).
- R-3: DNA status vocabulary mismatch (`flagged` vs `review/blocked`). Mitigation: reconcile to platform standard before migrating.
- R-4: Scope creep from the marketplace track (crew/booking). Mitigation: hard boundary in §0/§2.4.

**Open questions**
- Q-1 (D-1): create new tables or migrate the FashionOS `shoots`/`shoot_items`/`shoot_assets`?
- Q-2: do we need multi-user brands (`brand_users`) for shoot collaboration, or is single-owner enough for v1?
- Q-3: is `/app/package` in core or strictly advanced for the first operator release?
- Q-4: does crew come from `contacts` (internal) only, or eventually the marketplace vendor pool?

---

## 16. Definition of Done (PRD acceptance)

- [ ] All shoot routes specified as `/app/shoots*` — zero `/dashboard/shoots` in new scope.
- [ ] `production-planner` named as the single route agent for all shoot routes.
- [ ] Every core flow has an explicit HITL gate before persistence.
- [ ] Draft state modeled separately from approved records (`shoot_intake_drafts`).
- [ ] D-1 resolved before shoot data migration task.
- [ ] Aligned with **Phase 5** intelligence roadmap and **IPI-134** AIOR-018 workflow requirement.
- [ ] SHOOT-AI-001–004 (IPI-148–151) referenced in roadmap §13.
- [ ] Mastra home is `app/src/mastra/` (not `services/agent` or `:4111`).
- [ ] Advanced features explicitly fenced off from the core proof chain.
- [ ] No production code, migrations, or schema files changed by this PRD pass.
