---
id: SHOOT-PLAN-001
title: "iPix Shoot System — Verified Implementation Plan"
version: "1.0"
date: "2026-06-21"
status: "Canonical — supersedes older loose notes"
owner: "Product + Engineering"
source_of_truth:
  - docs/prd/shoot-prd.md          # canonical PRD (binding)
  - docs/prd/prd-intelligence.md   # intelligence layer contract
  - docs/shoot/README.md           # task map
  - docs/shoot/00-ai-native-shoot-system.md
skills_required:
  - copilotkit    # CopilotKit v2 L1–L5, useInterrupt HITL
  - mastra        # production-planner agent, workflows, suspend/resume
  - gemini        # gemini-2.5-flash (current), gemini-3.5-flash (target AI-018)
  - ipix-supabase # schema, RLS, migrations, edge functions
mcps_required:
  - copilotkit    # mcp__claude_ai_copilotkit__* — search-docs, explore-code
  - supabase      # mcp__plugin_supabase_supabase__* — apply_migration, list_tables
---

# iPix Shoot System — Verified Implementation Plan

## 0. North Star

The shoot system turns a blank-page content calendar into a channel-complete production plan
in minutes. The operator opens a wizard; the AI drafts deliverables + shot list from the
brand's DNA and products; the operator edits and **approves**; the shoot becomes a live
workspace where assets upload, get DNA-scored, and hand off to commerce.

**Non-negotiable invariant:** Humans decide. AI assists. Nothing reaches `shoots`, `shot_list`,
`shoot_deliverables`, or crew tables without explicit HITL approval. Same spine as `brand_intake_drafts`.

---

## 1. Current codebase state (verified 2026-06-21)

| Area | State | Evidence |
|---|---|---|
| Routes `/app/shoots*` | **Not in codebase** | `src/App.tsx` — missing |
| `production-planner` Mastra agent | **Not in codebase** | no `services/agent/` dir |
| AI-native shoot schema | **Not migrated** | no `shoots(brand_id)`, `shot_list`, `shoot_deliverables` |
| Legacy FashionOS `shoots` table | **Exists** — wrong FK semantics (`designer_id`) | migrations history |
| HITL `brand_intake_drafts` pattern | **Shipped** (AIOR-003) | template for shoot |
| Wireframes | **Complete** | `tasks/wireframes-ipix/new/02,03,W1` |
| `docs/shoot/` docs | **Complete** (00–32 docs) | shoot docs dir |
| `docs/prd/shoot-prd.md` | **Canonical PRD** — binding | this file |
| CopilotKit v2 provider | **Not wired** | AIOR-002 prerequisite |
| Mastra service (`services/agent/`) | **Not wired** | AIOR-001 prerequisite |

**D-1 Decision (required before IPI2-111):** Legacy FashionOS `shoots` table uses `designer_id`.
iPix operator model uses `brands.user_id`. Resolution: create **new AI-native tables** with fresh
names (`shoots` if safe to extend, else `brand_shoots`). Do not silently reuse `designer_id` semantics.

---

## 2. Architecture summary

### Runtime topology (shoot routes)

```
Browser (/app/shoots*)
  └── <CopilotKit> → L1 useAgentContext (route, brandId, shootId, tab, channels)
                   → L2 Right panel alerts (DNA risks, coverage gaps, schedule)
                   → L3 CopilotChat → agentId: "production-planner"
                   → L4 useCoAgent<ShotListState> (editable artifact)
                   → L5 useInterrupt → HitlApprovalCard
                         │
                         SSE / AG-UI
                         ▼
services/agent/ (Hono, port 4111)
  └── production-planner (Mastra)
        ├── tools: recommendShootType, planDeliverables, generateShotListDraft,
        │          estimateShootBudget, explainShootDnaAlerts,
        │          saveApprovedShootDraft, approveShotList
        └── workflow: suspend(shoot_plan_approval) → resume on operator decision
              │
              ├── Gemini 2.5 Flash (reasoning + structured output)
              └── Supabase Edge wrappers (DB writes — service role only)
```

### HITL data flow

```
Operator wizard input
  → production-planner: planDeliverables → generateShotListDraft
  → suspend(shoot_plan_approval)           ← operator reviews
  → operator approves (edited or as-is)
  → saveApprovedShootDraft + approveShotList
  → shoot_intake_drafts (status=approved)  ← edge function writes
  → shoots + shot_list + shoot_deliverables (durable rows)
```

---

## 3. Deliverables-first wizard (key PRD addition)

The shot list is **derived from deliverables**, not invented first. This is the core
architectural difference from older shoot docs and the reason reshoots happen.

```
Operator picks target channels (IG, Shopify PDP, Amazon, TikTok)
  → planDeliverables → editable deliverables plan
      e.g.: IG feed: 10 · IG stories: 5 · Shopify PDP: 20 · Amazon hero: 6 · TikTok: 3
  → HITL: operator approves deliverables plan
  → generateShotListDraft: each shot maps to ≥1 deliverable
      un-covered deliverables flagged: "Deliverable X has 0 shots"
  → HITL: operator approves shot list
  → estimateShootBudget: crew + studio/equipment + looks + deliverables → editable estimate
  → HITL: operator approves budget
  → all three persist to durable tables
```

**Wizard steps (6):** Basics → Brief → **Deliverables** → Crew → Shot List → Review

---

## 4. Competitor intelligence context

The `docs/intelligence/dashboards/03-ai-native-shoot-prompt.md` is a forensic analysis
prompt for Soona + Squareshot screenshots in `docs/screenshots/`. Screenshots are available
but the analysis has not been executed.

**Soona workflows reverse-engineered:**
Brand → Creative Brief → Shoot Booking → Asset Review → Delivery

**Squareshot workflows reverse-engineered:**
Brand → Production Planning → Studio Execution → Asset Delivery → Approval

**iPix advantage:** Neither Soona nor Squareshot have AI-native deliverables planning.
iPix uses `planDeliverables` → `generateShotListDraft` to guarantee multi-channel coverage
before the shoot, eliminating the reshoot loop.

---

## 5. Task verification — existing SHOOT-UX-001 through 009

### ✅ CORRECT tasks (scope is right)

| Task | Status | Notes |
|---|---|---|
| IPI2-104 · SHOOT-UX-001 — Design Review + Scope Alignment | ✅ Correct | Must resolve D-1 and enum/RLS reconciliations |
| IPI2-105 · SHOOT-UX-002 — Shoots Dashboard UI/UX | ✅ Correct | `/app/shoots` grid/list/calendar + right-panel DNA alert queue |
| IPI2-106 · SHOOT-UX-003 — Shoot Detail Page UI/UX | ✅ Correct | 7+ tabs including **Deliverables** tab (see §3 addition) |
| IPI2-109 · SHOOT-UX-006 — Frontend Routes + Components | ✅ Correct | Routes, ProtectedRoute, DashboardLayout nesting |
| IPI2-110 · SHOOT-UX-007 — Backend Services + Edge Wrappers | ✅ Correct | Edge functions as DB write boundary; Mastra tools call edge fns |
| IPI2-112 · SHOOT-UX-009 — Shot List Generator Refactor | ✅ Correct | Now deliverables-driven (see §3); `useCoAgent` artifact + HITL |

### ⚠️ NEEDS UPDATE — scope gaps identified

| Task | Issue | Required addition |
|---|---|---|
| IPI2-107 · SHOOT-UX-004 — Wizard UI/UX + Playbook Flow | Wizard step count is wrong in some older docs | Must specify **6 steps**: Basics → Brief → **Deliverables** → Crew → Shot List → Review; `estimateShootBudget` is part of Review step |
| IPI2-108 · SHOOT-UX-005 — Agents + HITL Workflows | Missing 2 core tools | Add `planDeliverables` (channels → deliverables) and `estimateShootBudget` to tool registry; update workflow to 3 HITL gates (deliverables, shot list, budget) |
| IPI2-111 · SHOOT-UX-008 — Data Model + RLS Plan | Missing tables from PRD | Add `shoot_deliverables`, `shot_deliverable_links`, `shoot_intake_drafts`; budget fields on `shoots`; dual-FK constraint on `shoot_crew`; D-1 resolution before migration |

### ❌ MISSING tasks (not in README task map)

| New task | What it covers | Prerequisite for |
|---|---|---|
| **SHOOT-PRE-001 — D-1 Schema Decision** | Explicit written decision: create new tables OR migrate FashionOS `shoots`. Arch decision doc, no code. | IPI2-111 |
| **DATA-020** (cross-cutting, not SHOOT-specific) | Unified `ai_drafts` + `approvals` + `activity_log` migration — generalizes `brand_intake_drafts`. Without this, shoot drafts need their own table. | IPI2-111, IPI2-108 |

**Note:** DATA-020 is tracked in `docs/prd/prd-intelligence.md §13`. It should be its own
Linear task under the DATA-* epic, not a SHOOT task. It is a hard prerequisite for IPI2-111.

---

## 6. Implementation roadmap (phased)

### Phase 0 — Prerequisites (not shoot-specific)

These must be green before shoot work starts.

| Task | What | Linear |
|---|---|---|
| AIOR-001 | `services/agent/` Hono + CopilotRuntime + Mastra instance | IPI-81 |
| AIOR-002 | CopilotKit v2 provider in `AppLayout.tsx` + Vite proxy | IPI-82 |
| DATA-020 | `ai_drafts` + `approvals` migration | New — DATA-020 |

### Phase 1 — Design review + decisions (IPI2-104)

- Run forensic analysis on Soona/Squareshot screenshots using `03-ai-native-shoot-prompt.md`
- Resolve D-1 (new tables vs migrate)
- Resolve enum alignment (`approved|review|blocked` vs `pending|approved|flagged|rejected`)
- Resolve RLS approach (single-owner `brands.user_id` — confirmed; no `brand_users` needed for v1)
- Write SHOOT-PRE-001 decision doc

### Phase 2 — Data model + RLS (IPI2-111)

Migration: `shoots(brand_id)`, `shot_list`, `shoot_deliverables`, `shot_deliverable_links`,
`shoot_assets`, `shoot_crew` (dual-FK), `shoot_intake_drafts`.

Run after:
- D-1 and enum reconciliations resolved (Phase 1)
- DATA-020 applied (for `ai_drafts` generalization, or `shoot_intake_drafts` standalone)

### Phase 3 — Agent + HITL (IPI2-108)

`production-planner` Mastra agent with 7 core tools (§2). Three HITL suspend points:
1. `deliverables_approval`
2. `shot_list_approval`
3. `budget_approval`

Gemini: `gemini-2.5-flash` (current); migrate to `gemini-3.5-flash` after AI-018.

### Phase 4 — Frontend shells (IPI2-105, 106, 107, 109)

Build in order: routes → shell → wizard → detail.

| Task | Route | CopilotKit layer |
|---|---|---|
| SHOOT-UX-002 | `/app/shoots` | L1 `useCopilotReadable` shoot summaries; L2 DNA alert queue |
| SHOOT-UX-004 | `/app/shoots/new` | L3 route agent; L4 `useCoAgent` draft artifact; L5 `useInterrupt` × 3 |
| SHOOT-UX-003 | `/app/shoots/:id` | L1 `useAgentContext` tab+shoot; L4 shot list; L5 HITL overrides |
| SHOOT-UX-006 | All shoot routes | `DashboardLayout` nesting, `ProtectedRoute`, `production-planner` agentId |

### Phase 5 — Shot list + AI-native refactor (IPI2-112)

`generateShotListDraft` → `useCoAgent<ShotListState>` editable artifact.
Every shot maps to ≥1 deliverable. Un-covered deliverables flagged in right panel.
`explainShootDnaAlerts` after asset upload.

### Phase 6 — Backend service wrappers (IPI2-110)

Thin Supabase Edge Functions as write surface for Mastra tools:
- `save-shoot-draft` — write to `shoot_intake_drafts`
- `commit-approved-shoot` — promote draft to durable `shoots` + `shot_list` + `shoot_deliverables`
- `score-shoot-asset` — DNA scoring + `shoot_assets.dna_*` write

Mastra tools call these; they never write durable tables directly.

---

## 7. Supabase schema (authoritative — implements §9 of shoot-prd.md)

```sql
-- shoots: AI-native, keyed to brands
shoots (
  id uuid, brand_id → brands.id, name, type shoot_type_enum,
  status shoot_status_enum, start_date, location, brief text,
  target_channels text[], dna_score numeric,
  estimated_budget numeric, actual_cost numeric, currency text default 'USD',
  budget_breakdown jsonb, created_by → auth.users, created_at
)

-- shoot_deliverables: channel requirements the shot list must satisfy
shoot_deliverables (
  id uuid, shoot_id → shoots.id, channel channel_enum, format text,
  quantity int, aspect_ratio text,
  status text check (status in ('planned','covered','delivered')),
  origin text check (origin in ('manual','ai_approved'))
)

-- shot_list: individual shots derived from deliverables
shot_list (
  id uuid, shoot_id → shoots.id, description, channel, aspect_ratio,
  style_notes, priority, status shot_status_enum, order int,
  origin text check (origin in ('manual','ai_approved'))
)

-- shot_deliverable_links: many-to-many proof of coverage
shot_deliverable_links (
  shot_id → shot_list.id, deliverable_id → shoot_deliverables.id,
  unique(shot_id, deliverable_id)
)

-- shoot_assets: uploaded assets with DNA scores
shoot_assets (
  id uuid, shoot_id → shoots.id, cloudinary_id, url, dna_score,
  dna_scores jsonb, dna_flags jsonb, dna_suggestions jsonb,
  status asset_status_enum, override_by → auth.users, override_reason
)

-- shoot_crew: internal contact OR marketplace vendor (exactly one)
shoot_crew (
  id uuid, shoot_id → shoots.id, role crew_role_enum, confirmed bool,
  internal_contact_id → contacts.id nullable,
  marketplace_vendor_id uuid nullable,
  check (num_nonnulls(internal_contact_id, marketplace_vendor_id) = 1),
  unique(shoot_id, role, internal_contact_id, marketplace_vendor_id)
)

-- shoot_intake_drafts: HITL spine (mirrors brand_intake_drafts)
shoot_intake_drafts (
  id uuid, user_id → auth.users, brand_id → brands.id,
  status text check (status in ('pending','approved','rejected')),
  draft_shoot jsonb, draft_shot_list jsonb, draft_deliverables jsonb,
  agent_run_id text, source_context jsonb,
  approved_at, rejected_at, expires_at
)
```

**RLS:** All tables scope through `brand_id → brands.user_id = auth.uid()`.
Service role writes via edge functions. Authenticated users SELECT own rows.

---

## 8. Gemini integration

| Tool | Gemini call | Output schema |
|---|---|---|
| `recommendShootType` | Structured output — shoot type enum | `{type, rationale, confidence}` |
| `planDeliverables` | Structured output — deliverables array | `{channel, format, quantity, aspect_ratio}[]` |
| `generateShotListDraft` | Structured output — shots array | `{description, channel, aspect_ratio, style_notes, deliverable_ids}[]` |
| `estimateShootBudget` | Structured output — budget breakdown | `{crew, studio, equipment, post, total, currency}` |
| `explainShootDnaAlerts` | URL Context + structured output | `{asset_id, issues[], suggestions[]}` |

Model: `gemini-2.5-flash` (as-built). Migrate to `gemini-3.5-flash` after AI-018.
Thinking level: `high` for shot-list generation (multi-channel coverage reasoning).

---

## 9. CopilotKit L1–L5 checklist per route

### `/app/shoots` (D5)
| Layer | Implementation |
|---|---|
| L1 | `useCopilotReadable`: visible shoot cards, DNA summaries, date range |
| L2 | Right panel: DNA exception queue, upcoming deadlines |
| L3 | `agentId: "production-planner"` |
| L4 | N/A (list view — no generative artifact) |
| L5 | N/A (no writes from list view) |

### `/app/shoots/new` (wizard)
| Layer | Implementation |
|---|---|
| L1 | `useAgentContext`: brandId, selected channels, campaign goal, products |
| L2 | Right panel: channel coverage gaps, suggested shoot types |
| L3 | `agentId: "production-planner"` |
| L4 | `useCoAgent<ShotListDraftState>` — editable deliverables + shot list artifact |
| L5 | `useInterrupt` × 3 (deliverables, shot list, budget) |

### `/app/shoots/:id` (detail, 7 tabs)
| Layer | Implementation |
|---|---|
| L1 | `useAgentContext`: shootId, activeTab, brandId, uploaded assets, channels |
| L2 | Right panel per tab: DNA flags (Assets tab), crew gaps (Crew tab), coverage (Shot List tab) |
| L3 | `agentId: "production-planner"` |
| L4 | Shot list tab: `useCoAgent` for regen/edit. Deliverables tab: coverage matrix. |
| L5 | `useInterrupt` for DNA override, shot regen, crew addition |

---

## 10. Skills + MCPs — when to invoke

| Task | Skill / MCP |
|---|---|
| `production-planner` agent code | `/mastra` skill — load `references/workflows.md` for suspend/resume |
| CopilotKit `useInterrupt` wiring | `/copilotkit` skill — load `references/integrations/mastra.md` |
| Schema migration + RLS | `/ipix-supabase` skill — load `references/supabase-core/` |
| Gemini tool calls + structured output | `/gemini` skill — `references/structured-output.md` |
| MCP doc lookup (CopilotKit) | `mcp__claude_ai_copilotkit__search-docs` or `explore-docs` |
| MCP migration apply | `mcp__plugin_supabase_supabase__apply_migration` |
| Before any Mastra code | Check `node_modules/@mastra/` first — APIs change rapidly |

---

## 11. Definition of Done (shoot system core)

- [ ] All shoot routes use `/app/shoots*` — zero `/dashboard/shoots` in new code
- [ ] `production-planner` is the sole route agent for `/app/shoots*`
- [ ] Wizard has 6 steps including Deliverables step
- [ ] Shot list is derived from deliverables (`generateShotListDraft` gets approved deliverables)
- [ ] Three distinct HITL gates (deliverables → shot list → budget) before any durable write
- [ ] `shoot_intake_drafts` models draft state separately from approved records
- [ ] D-1 (legacy vs new schema) resolved and documented before IPI2-111 migration
- [ ] All shoot tables have RLS scoped to `brands.user_id`
- [ ] `ai_agent_logs` records every Gemini + Mastra tool call
- [ ] Advanced features (crew marketplace, PDF export, Postiz) explicitly fenced

---

## 12. Anti-patterns (do not repeat from brand intake)

| ❌ Don't | ✅ Do |
|---|---|
| Write `shoots` or `shot_list` directly from Mastra | Write to `shoot_intake_drafts`; edge fn commits on approval |
| Generate shot list before deliverables are approved | `planDeliverables` + HITL → `generateShotListDraft` |
| Reuse FashionOS `designer_id` semantics | New tables keyed to `brand_id` |
| Build shot-list UI without generative artifact | `useCoAgent<ShotListDraftState>` with inline edit |
| Auto-approve any draft | DB trigger: no self-approval; `approver_id` required |
| Scope crew marketplace into core | Hard boundary — Advanced only |
| Use `/dashboard/shoots` anywhere | `/app/shoots` only |
