---
title: "iPix Intelligence Layer PRD"
version: "2.2"
lastUpdated: "2026-06-25"
status: "Canonical — implementation-ready"
owner: "Platform / AI"
stack: "Next.js 16 (operator) · Vite (marketing) · CopilotKit v2 · Mastra · Gemini 3.5 Flash (target) · Supabase"
sources:
  - docs/intelligence/06-ai-native-master-plan.md
  - docs/intelligence/ai/02-ai-native-dashboards-plan.md
  - docs/copilotkit/12-mastra-plan.md
  - docs/copilotkit/todo.md
  - docs/gemeni/gemeni-plans.md
  - docs/intelligence/mastra-agent-catalog.md
  - docs/intelligence/mastra-workflows.md
  - docs/intelligence/00-intelligence-layer-index.md
  - .claude/skills/copilotkit/SKILL.md
  - .claude/skills/mastra/SKILL.md
  - https://docs.copilotkit.ai/integrations/mastra/human-in-the-loop/interrupt-flow
  - https://docs.ag-ui.com/introduction
---

# iPix Intelligence Layer — Product Requirements Document

> **One rule across every surface:** Humans decide. AI assists.
> Nothing is written to Supabase without explicit human approval.

---

## 1. Problem Statement

iPix operators manage brand analysis, asset review, and product linking through disconnected
manual steps. The gap between "AI proof works" (edge functions ship) and "operator uses AI
daily" is the UX layer — a 3-panel workspace where every screen explains, suggests, approves,
and acts without context-switching.

**This PRD specifies that UX layer:** CopilotKit v2 front-of-house + Mastra back-of-house,
wired into the **Next.js operator app** (`app/`), driving existing Supabase edge functions.

---

## 2. Ground Truth (as of 2026-06-25)

| Layer | Status |
|-------|--------|
| Supabase schema + RLS | ✅ ~97 migrations; `brands`, `brand_scores`, `commerce_product_links`, `ai_agent_logs`, `brand_intake_drafts` |
| Edge: `brand-intelligence` | ✅ `gemini-2.5-flash`, structured output |
| Edge: `audit-asset-dna` | ✅ scaffolded (DNA-001) |
| Edge: `health`, `edge-test` | ✅ |
| **Operator app** (`app/`) | ✅ Next.js 16 · `/app/*` routes · 3-panel shell · `OperatorPanel` + `CopilotSidebar` |
| CopilotKit v2 runtime | 🟡 **IPI-110 · AIOR-002** — `/api/copilotkit` live; panel + L1 context; route→agent map pending |
| Mastra in-process | 🟡 **IPI-48 · AIOR-001** Done — `app/src/mastra/`; agents `production-planner`, `creative-director` |
| Operator auth boundary | ✅ **IPI-114 · AIOR-002b** — `withOperatorAuth` + ALS on `/api/copilotkit` |
| Mastra Postgres storage | ❌ **IPI-129 · AIOR-013** — still `LibSQLStore` `:memory:` |
| Brand intake HITL workflow | ❌ **[IPI-132](https://linear.app/amo100/issue/IPI-132) AIOR-003** — requires **IPI-134** snapshots |
| Durable agents + workflow snapshots | ❌ **IPI-133** AIOR-017 · **IPI-134** AIOR-018 — blocked on IPI-129 |
| Agent memory architecture | ❌ **IPI-135** AIOR-019 — working/semantic/observational threads |
| `brand-intelligence` Mastra agent | ❌ **IPI-130 · AIOR-014** |
| Shared Gemini client | ❌ **[IPI-47](https://linear.app/amo100/issue/IPI-47) AI-009** (`_shared/gemini.ts`) + **GEMINI-001–018** (IPI-164–181) |
| `ai_drafts` unified table | ❌ DATA-020 (generalizes `brand_intake_drafts`) |
| Marketing CopilotKit | ✅ **IPI-100 · DASH-010** — `public-marketing` + `/api/marketing-chat` |

**Critical stack fact:** The **operator hub is Next.js 16** in `app/`, not the root Vite SPA.
Mastra runs **in-process** via `MastraAgent.getLocalAgents({ mastra, resourceId })` on
`app/src/app/api/copilotkit/[[...slug]]/route.ts`. There is **no** standalone `services/agent/`
Hono server on `:4111` and **no** Vite proxy to a separate agent port.

**Repo split:**

| Surface | Stack | Path |
|---------|-------|------|
| Marketing + legacy Vite | Vite + React Router | repo root `src/` |
| Operator Hub + AI runtime | Next.js 16 App Router | `app/` |

---

## 3. Product Vision

Three workspaces, one AI spine:

| Workspace | Routes | Status |
|-----------|--------|--------|
| **Operator Hub** | `/app`, `/app/brand*`, `/app/assets*`, `/app/products*`, `/app/analytics` | Shell live in `app/`; intelligence wiring P1 |
| **Shoot OS** | `/app/shoots*` | Placeholder route live; full OS specced |
| **Contest/Event OS** | `/app/contests*` + public `/contests/*` | Specced, unbuilt |

All three share: one CopilotKit provider (operator layout), one Mastra registry, one HITL
drafts/approvals spine, one 3-panel shell.

---

## 4. Architecture

### 4.1 Runtime topology (canonical)

```
Browser (Next.js operator — app/)
  └── app/(operator)/layout.tsx
        └── <CopilotKit runtimeUrl="/api/copilotkit">
              ├── L1  useAgentContext / useConfigureSuggestions
              ├── L2  Right panel proactive suggestions
              ├── L3  CopilotSidebar / CopilotChat
              ├── L4  useFrontendTool / generative artifacts (Advanced)
              └── L5  useInterrupt / approval cards (HITL)
                    │
                    │ SSE / AG-UI
                    ▼
app/src/app/api/copilotkit/[[...slug]]/route.ts
  ├── withOperatorAuth (JWT → user.id → resourceId)
  ├── createCopilotEndpoint({ runtime: "mastra", agents: async () =>
  │     MastraAgent.getLocalAgents({ mastra, resourceId: user.id }) })
  └── app/src/mastra/index.ts
        ├── agents/   (registry key === useAgent({ agentId }))
        ├── workflows/ (target: brand-intake, etc.)
        ├── tools/    (Zod → callEdgeFunction → Supabase edge fns)
        └── storage/  (target: PostgresStore @mastra/pg — IPI-129)
              │
              ├── Gemini 3.5 Flash (target; edge still `gemini-2.5-flash` until AI-018 / IPI-107)
              ├── Supabase Edge Functions (write surface)
              ├── Supabase Postgres (system of record)
              ├── Cloudinary (media)
              └── Mercur/Medusa (commerce facts)
```

**Marketing (separate):** `app/(marketing)/` + `/api/marketing-chat` with `publicMastra` and
`public-marketing` agent — no operator auth.

**AG-UI protocol:** CopilotKit v2 ↔ Mastra via AG-UI event types (`TEXT_MESSAGE_*`,
`TOOL_CALL_*`, `STATE_*`, `RUN_*`, etc.).

### 4.2 Two execution paths

| Path | When | Stack |
|------|------|-------|
| **Deterministic (MVP)** | 8 proofs, no Mastra workflow | UI → Supabase Edge Fn → Gemini → drafts → human approve → Edge applies |
| **Orchestrated (MVP+)** | Multi-step, memory, streaming | UI → CopilotKit → Mastra workflow → tools (same edge fns) → suspend HITL → resume → apply |

Edge functions are the **shared write surface**. Mastra tools call edge fns via
`callEdgeFunction` — never write durable rows with service role from the client.

### 4.3 CopilotKit v2 provider (operator)

```tsx
// app/src/app/(operator)/layout.tsx — pattern
<CopilotKit runtimeUrl="/api/copilotkit">
  <OperatorPanel>{children}</OperatorPanel>
</CopilotKit>
```

**Invariant:** `useAgent({ agentId })` and `CopilotChatConfigurationProvider agentId` must
match a key in `app/src/mastra/index.ts` `agents` map exactly.

---

## 5. CopilotKit L1–L5 Layering

| Layer | Hook / Component | Purpose | Phase |
|-------|-----------------|---------|-------|
| **L1 Context** | `useAgentContext` (+ `useCopilotReadable` where needed) | Route, brand/asset/shoot ids, visible rows | MVP |
| **L2 Proactive** | `useConfigureSuggestions` + right panel | Gaps, next action | MVP |
| **L3 Chat** | `CopilotSidebar` / `CopilotChat` | Route-scoped `agentId` | MVP |
| **L4 Generative UI** | `useFrontendTool`, `useRenderTool` | Artifacts in center when work product | Advanced |
| **L5 HITL** | `useInterrupt` + approval cards | Suspend workflow → human → resume | MVP |

### L5 — HITL (Mastra + CopilotKit)

Brand intake and all durable writes use **workflow suspend/resume** (not chat-only approval).
Panel chat uses **agents**; brand intake uses **workflows** first (see `12-mastra-plan.md` §6).

---

## 6. Agent Registry

Model default: `google/gemini-2.5-flash` in edge fns; Mastra agents use `@ai-sdk/google`
with `GEMINI_API_KEY`. Target upgrade: AI-018 → Gemini 3.x when verified.

### As-built (`app/src/mastra/index.ts`)

| `agentId` | Purpose | Linear |
|-----------|---------|--------|
| `default` | Alias → `production-planner` (CopilotKit prebuilt UI) | — |
| `production-planner` | Shoot planning, operator default today | IPI-48 · AIOR-001 |
| `creative-director` | Creative direction | IPI-48 · AIOR-001 |

### Target architecture (Phase 4+)

```text
operator-supervisor (AIOR-020 · IPI-109)
├── brand-intelligence
├── production-planner (shoots)
├── asset-dna
├── creative-director (campaigns)
└── matching-engine (TBD)

Per agent: Agent → Workflow → HITL → Tool → Edge Fn → Supabase
Never: Agent → direct database write
```

Phases 1–3 use **route-selected specialists** (IPI-51); supervisor lands Phase 4 after brand workflow proves.

### Target MVP specialists (route-selected until Phase 4)

| `agentId` | Purpose | Phase | Linear |
|-----------|---------|-------|--------|
| `brand-intelligence` | URL → profile + scores + citations | 3 | IPI-130 · AIOR-014 |
| `asset-dna` | Image → DNA score + pillars | 6 | IPI-19 · DNA-001 |
| `product-linking` | Asset → Mercur SKU matches | 6 | IPI-25 · UI-004 |
| `brand-strategy` | Profile → Lean Canvas | 3+ | AIOR-004 / IPI-113 tools |
| `analytics` | Metrics → narrated insights | 4 | DASH-011 |
| `operator-supervisor` | Route intent → delegate specialists | **4** | **AIOR-020** · IPI-109 |

**Invariant:** Agents propose drafts; humans approve. No self-approval. DB triggers enforce
agent role = INSERT drafts only.

### Route → Agent map (target)

| Route | Default `agentId` | Notes |
|-------|-------------------|-------|
| `/app` | `brand-intelligence` (target) · `production-planner` (as-built) | IPI-51 wires map |
| `/app/brand`, `/app/brand/[id]`, `/app/onboarding` | `brand-intelligence` | Intake = workflow + agent assist |
| `/app/assets` | `asset-dna` | |
| `/app/products`, `/app/products/links` | `product-linking` | Routes TBD in `app/` |
| `/app/analytics` | `analytics` | Advanced |
| `/app/shoots` | `production-planner` | Placeholder page exists |
| `/app/campaigns`, `/app/matching` | `production-planner` / TBD | As-built sections |

---

## 7. Workflow Catalog

Target location: `app/src/mastra/workflows/`. Suspend → `useInterrupt` → resume.

| # | Workflow | Trigger | HITL gate | Phase | Linear |
|---|----------|---------|-----------|-------|--------|
| W1 | **Brand Intake** | URL on brand/onboarding | Approve profile | MVP | **IPI-132** AIOR-003 |
| W2 | Lean Canvas | Approved profile | Section + full approve | MVP+ | AIOR-004 |
| W3 | Asset DNA | Upload / Cloudinary | Override review/blocked | MVP | DNA-001 |
| W4 | Product Linking | Approved asset | Pick SKU | MVP | UI-004 |
| W5 | Production Package | Approved canvas | Package sign-off | MVP+ | SHOOT-* |
| W6 | Performance Feedback | Scheduled / ask | Approve recs only | Advanced | ANA-* |

**MVP shortcut:** Direct POST to edge `brand-intelligence` still valid; add W1 on AIOR-003.
`brand_intake_drafts` is the preview of unified `ai_drafts` (DATA-020).

---

## 8. HITL Data Model

Unify `brand_intake_drafts` → `ai_drafts` + `approvals` (DATA-020). See
`docs/data/02-hitl-approvals-model.md` for DDL.

**Principle:** One spine for all domains; edge fns apply after human `approver_id`.

---

## 9. 3-Panel Shell

```
┌──────────────┬──────────────────────────┬───────────────────────┐
│  LEFT        │       CENTER             │      RIGHT            │
│  Threads /   │  Page workspace          │  CopilotSidebar       │
│  nav         │  (human-first)           │  suggestions + HITL   │
└──────────────┴──────────────────────────┴───────────────────────┘
```

**As-built:** `OperatorPanel` in `app/src/components/operator-panel/` — threads drawer left,
`CopilotSidebar` right. Center = route `page.tsx`.

---

## 10. Dashboard Inventory (MVP routes)

Canonical routes: **`/app/*` only** (never `/dashboard/*`). Detail: `docs/intelligence/ai/02-ai-native-dashboards-plan.md`.

| Route | Dashboard | Default agent | Linear (iPix1) |
|-------|-----------|---------------|----------------|
| `/app` | Command Center | `production-planner` → `brand-intelligence` | IPI-122 · DASH-002 |
| `/app/brand`, `/app/brand/[id]` | Brand Hub | `brand-intelligence` | IPI-123 · DASH-003 |
| `/app/onboarding` | Brand Intake | `brand-intelligence` + W1 workflow | AIOR-003 |
| `/app/assets` | Assets + DNA | `asset-dna` | UI-003 / DNA-001 |
| `/app/products*` | Products / Links | `product-linking` | IPI-25 · UI-004 |
| `/app/analytics` | Analytics | `analytics` | DASH-011 (deferred route) |
| `/app/shoots` | Shoots | `production-planner` | SHOOT-UX-* |
| `/app/campaigns`, `/app/matching` | Campaign / Matching | TBD | campaign PRD |

---

## 11. Gemini Configuration

| Surface | Model (as-built) | Target |
|---------|------------------|--------|
| Edge `brand-intelligence` | `gemini-2.5-flash` | **gemini-3.5-flash** via [IPI-107](https://linear.app/amo100/issue/IPI-107) AI-018 registry |
| Mastra agents | `@ai-sdk/google` + `GEMINI_API_KEY` | Same |
| Vision / DNA | `gemini-2.5-flash` | Structured output + Batch ([IPI-170](https://linear.app/amo100/issue/IPI-170)) |

Shared client: `supabase/functions/_shared/gemini.ts` — **[IPI-47](https://linear.app/amo100/issue/IPI-47) AI-009** foundation.

**Platform capability matrix (P0–P3):** `docs/gemeni/gemeni-plans.md` · Linear **GEMINI-001–018** → **IPI-164–181** · execution queue in `docs/copilotkit/todo.md` § Gemini platform.

| P0 Gemini (with brand MVP) | Linear |
|----------------------------|--------|
| SDK foundation | IPI-47 |
| URL Context on brand edge | IPI-165 GEMINI-002 |
| Structured output hardening | IPI-167 GEMINI-004 |
| Interactions API (operator) | IPI-164 GEMINI-001 |
| Citations → `ai_agent_logs` | IPI-172 GEMINI-010 |

**Dedup:** [IPI-32](https://linear.app/amo100/issue/IPI-32) (BRAND project Mastra workflow) is exploratory — **IPI-132 AIOR-003** is the canonical brand-intake workflow on AI INTELLIGENCE.

---

## 12. Phased Roadmap (9 phases — canonical)

Aligned with `docs/copilotkit/12-mastra-plan.md` and `todo.md`. **Overall architecture score: 89/100.**

### Phase 1 — Foundation

**Output:** One agent works reliably.

IPI-48 ✅ · IPI-110 · IPI-127 · IPI-129 · IPI-51 · IPI-125

### Phase 2 — Agent platform

**Output:** Production-safe agents.

| Spec | Capability | Linear |
|------|------------|--------|
| **AIOR-017** | Durable agents — checkpoint/recovery after restart | [IPI-133](https://linear.app/amo100/issue/IPI-133) |
| **AIOR-018** | Workflow snapshots — resume mid-flow, not from Step 1 | [IPI-134](https://linear.app/amo100/issue/IPI-134) |
| **AIOR-019** | Memory foundation — working + semantic + observational + threads | [IPI-135](https://linear.app/amo100/issue/IPI-135) |
| **AIOR-022** | Guardrails — tool/write/role restrictions per agent | [IPI-137](https://linear.app/amo100/issue/IPI-137) |
| IPI-113 | Tool registry → edge fns | [IPI-113](https://linear.app/amo100/issue/IPI-113) |
| IPI-104 | Thread scoping + `memory.ts` | [IPI-104](https://linear.app/amo100/issue/IPI-104) |

**Rule:** Do not ship **IPI-132** AIOR-003 without **IPI-134** AIOR-018.

### Phase 3 — Brand intelligence MVP

**Output:** First complete AI workspace.

IPI-130 · **IPI-132** AIOR-003 · IPI-111 · IPI-104 · IPI-50 · IPI-128 · IPI-165 · IPI-167

### Phase 4 — Command center

**Output:** Operator AI control center.

IPI-122 · IPI-123 · **IPI-109** AIOR-020 (supervisor) · **IPI-136** AIOR-021 (goals)

### Phases 5–8 — Workspaces

| Phase | Workspace | Key specs | Linear |
|-------|-----------|-----------|--------|
| 5 | Shoots | SHOOT-UX-*, SHOOT-AI-*, `production-planner` | IPI-84–87 · IPI-148–151 |
| 6 | Assets | DNA-002–005, edge `audit-asset-dna` | IPI-152–155 |
| 7 | Campaigns | CAMP-001–004, `creative-director` | IPI-156–159 |
| 8 | Matching | MATCH-001–004 | IPI-160–163 |

### Phase 9 — Platform advanced

**IPI-138** AIOR-023 MCP · **IPI-139** AIOR-024 browser · **IPI-140** AIOR-025 observability 2.0 · **IPI-141** AIOR-026 RAG · **IPI-142–145** MASTRA-RAG · **IPI-146–147** MASTRA-GOV

### P0 execution queue (now)

Per `docs/copilotkit/todo.md` § Master execution order:

1. IPI-126 → IPI-125 → IPI-127  
2. IPI-110 → IPI-50 → IPI-51 → **IPI-129**  
3. **IPI-47** (Gemini foundation)  
4. **IPI-134** AIOR-018 → **IPI-133** AIOR-017 → **IPI-135** AIOR-019  
5. **IPI-167** + **IPI-165** (Gemini structured + URL)  
6. IPI-113 tools slice → **IPI-132** AIOR-003 → IPI-130  
7. IPI-105 observability slice  

**Canceled:** IPI-4, IPI-7 (standalone `:4111`).

### Legacy P1–P3 (Vite proofs + defer)

P1 — 8 MVP proofs via edge where Mastra not required. P3 — Contest OS, Postiz (post Phase 9 RAG gate).

---

## 13. Linear Task Map (iPix1 team)

**Canonical task order:** `docs/copilotkit/todo.md`. **Filename `IPI-NN` ≠ Linear issue number.** Use **Spec ID** + iPix1 URL.

| Spec | iPix1 issue | Status |
|------|-------------|--------|
| AIOR-001 | IPI-48 | Done |
| AIOR-002 | IPI-110 | In Progress |
| AIOR-002b | IPI-114 | Done |
| AIOR-003 | IPI-132 | Backlog |
| AIOR-004 | IPI-113 | Done (tools empty) |
| AIOR-005 | IPI-104 | Backlog |
| AIOR-008 | IPI-111 | Backlog |
| AIOR-009 | IPI-109 | Superseded by **AIOR-020** (supervisor) |
| AIOR-010 | IPI-105 | Backlog (slice in P0; **AIOR-025** Phase 9) |
| AIOR-011–015 | IPI-127–131 | Backlog |
| AIOR-017 | IPI-133 | Todo — P0 durable agents |
| AIOR-018 | IPI-134 | Todo — P0 workflow snapshots |
| AIOR-019 | IPI-135 | Todo — P0 memory foundation |
| AIOR-020 | IPI-109 | Backlog — P1 supervisor (Phase 4) |
| AIOR-021 | IPI-136 | Todo — P1 goals |
| AIOR-022 | IPI-137 | Todo — P1 guardrails (Phase 2) |
| AIOR-023 | IPI-138 | Todo — Phase 9 MCP |
| AIOR-024 | IPI-139 | Todo — Phase 9 browser |
| AIOR-025 | IPI-140 | Todo — Phase 9 observability 2.0 |
| AIOR-026 | IPI-141 | Todo — Phase 9 RAG |
| MASTRA-RAG-001–004 | IPI-142–145 | Backlog — Phase 9 |
| MASTRA-GOV-002/003 | IPI-146–147 | Backlog — Phase 9 |
| SHOOT-AI-001–004 | IPI-148–151 | Backlog — Phase 5 |
| DNA-002–005 | IPI-152–155 | Backlog — Phase 6 |
| CAMP-001–004 | IPI-156–159 | Backlog — Phase 7 |
| MATCH-001–004 | IPI-160–163 | Backlog — Phase 8 |
| GEMINI-001–018 | IPI-164–181 | Backlog — platform |
| AI-009 | IPI-47 | Backlog — Gemini foundation |
| DASH-004 | IPI-50 | Backlog |
| DASH-005 | IPI-51 | Backlog |
| DASH-010 | IPI-100 | Done (marketing) |

Legacy mirrors on team **IPix-OLD** (e.g. IPI-81–90, IPI-91–102) — do not use for new work.

---

## 14. Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|-------|
| Standalone `services/agent/` on `:4111` | In-process Mastra in `app/src/mastra/` |
| Vite proxy to agent server | Next.js `/api/copilotkit` route |
| `/dashboard/*` routes | `/app/*` only |
| Supervisor before specialists | Route map Phases 1–3; **AIOR-020** Phase 4 |
| Ship brand workflow without snapshots | **IPI-134** AIOR-018 required with IPI-132 |
| Long runs without durable agents | **IPI-133** AIOR-017 after IPI-129 |
| `:memory:` Mastra storage in prod | `@mastra/pg` PostgresStore (IPI-129) |
| Chat-only brand intake saves | Workflow suspend/resume (IPI-132) |
| Mastra tools writing DB directly | `callEdgeFunction` → edge fns + RLS |
| `useCoAgent` / v1 CopilotKit APIs | v2: `useAgent`, `useAgentContext`, `useFrontendTool` |
| Build all dashboards before D1–D4 | MVP routes + proofs first |

---

## 15. Success Metrics

| Metric | Target | Proof |
|--------|--------|-------|
| URL → approved brand profile | < 10 min | Proof #6 |
| DNA blocked → explained | < 30 sec | Proof #7 |
| HITL bypass on durable writes | **0%** | DB audit |
| Agent cites on-screen context | No re-typing KPIs | L1 smoke |
| Asset → linked product | Human confirms each | Proof #8 |

---

## 16. Key References

| Doc | What it adds |
|-----|-------------|
| `docs/copilotkit/12-mastra-plan.md` | **Canonical Mastra audit** — in-process pattern, gaps, phases |
| `docs/copilotkit/todo.md` | **Canonical task tracker** — master execution order + full catalog |
| `docs/gemeni/gemeni-plans.md` | Gemini capability matrix + GEMINI-001–018 |
| `docs/prd/shoot-prd.md` | Phase 5 shoot workspace PRD |
| `docs/intelligence/ai/02-ai-native-dashboards-plan.md` | Per-dashboard L1–L5, route inventory |
| `docs/intelligence/06-ai-native-master-plan.md` | Unified architecture |
| `docs/intelligence/mastra-agent-catalog.md` | Agent I/O and tools |
| `docs/intelligence/mastra-workflows.md` | Workflow steps and suspend points |
| `docs/data/02-hitl-approvals-model.md` | `ai_drafts` / `approvals` DDL |
| `.claude/skills/copilotkit/SKILL.md` | v2 conventions |
| `.claude/skills/mastra/SKILL.md` | Mastra + MCP |

---

*When in doubt: `12-mastra-plan.md` (runtime truth) → this PRD (what to build) → domain docs (how).*
