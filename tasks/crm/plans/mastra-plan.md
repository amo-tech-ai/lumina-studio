---
title: CRM Mastra Plan
version: "1.1"
lastUpdated: "2026-07-04"
baseline: origin/main
audit: tasks/crm/03-crm-existing-state-audit.md
---

# CRM Mastra Plan

## Purpose

One new agent, `crm-assistant`, built on `brand-intelligence-agent.ts`'s proven shape (page-context injection, `navigateTo` frontend tool, HITL via `applyDraft`) — not a new agent pattern.

**Wave ownership:** **IPI-368** ships Mastra agent + wave-1 tools **and** minimal CopilotKit wiring (`route-agent-map`, `useAgentContext`, `navigateTo`). **IPI-369** adds wave-2 tools + IntelligencePanel sections. See [`copilotkit-plan.md`](./copilotkit-plan.md).

## Current setup

| Component | Status | Notes |
|-----------|:------:|-------|
| `crm-assistant` agent | 🔴 | New entry in `app/src/mastra/agents/index.ts` — wire tools via `agentTools` like `booking-agent.ts` / `model-match-agent.ts`, not ad-hoc inline tool arrays |
| CRM tool registry | 🔴 | Register wave-1 tools in `app/src/mastra/tools/index.ts` (or `tools/crm/*` barrel exported through `agentTools`) — same SSOT as booking/model-match |
| Tools: `searchContacts`, `searchCompanies` | 🔴 | New under `app/src/mastra/tools/crm/` |
| Tool: `summarizeRelationship` | 🔴 | Gemini via `resolveModel()` — wave 2 (IPI-369) |
| Tool: `scoreDealHealth` | 🔴 | **Deterministic formula** — wave 2 (IPI-369); `focus: "all"\|"at_risk"` |
| Tool: `draftFollowUp` | 🔴 | Gemini via `resolveModel()`; draft only — wave 2 (IPI-369) |
| Tool: `logActivity` | 🔴 | Writes to `crm_activities` — wave 1 |
| Tool: `moveDealStage` | 🔴 | Ungated stages only in wave 1; `won`/`lost` via HITL (IPI-367) |
| Enrichment reuse | 🟢 (existing) | `social-discovery` agent/tool reused, not rebuilt |

**Model:** `resolveModel()` → `gemini-3.1-flash-lite` (`models.ts`), same as every other agent — no dedicated Gemini plan needed.

**Registry pattern (mandatory):**

```text
app/src/mastra/tools/crm/*.ts  →  tools/index.ts (agentTools)
app/src/mastra/agents/crm-assistant-agent.ts  →  tools: agentTools subset (like booking-agent)
app/src/mastra/agents/index.ts  →  export crm-assistant
app/src/mastra/index.ts  →  agents map includes crm-assistant (id must NOT be in REQUIRED_AGENT_IDS)
```

- **`getMastra()`** — call only inside route/handler bodies; never at module top-level.
- **`REQUIRED_AGENT_IDS`** — `crm-assistant` is a route agent, not a required alias; must not collide with `default`, `production-planner`, `creative-director`.

**Context injection — precise, not exhaustive (standing decision):** `crm-assistant` is injected with the **current record only** (company/contact/deal id from the URL), same as `brand-intelligence-agent.ts`. CopilotKit side: CRM list/detail layouts call `useAgentContext` (mirror `brand-context.tsx`). Do **not** widen to a global relationship-graph dump.

## Existing registry (for reference — do not duplicate)

| Key | Agent | Routes | CRM relevance |
|-----|-------|--------|----------------|
| `production-planner` (default) | Shoot planning | `/app`, `/app/shoots/*` | Owns the shoot a won deal hands off to |
| `brand-intelligence` | Page-context brand assistant | `/app/brand/*` | **Direct template for `crm-assistant`** |
| `model-match` | Talent search/score | `/app/matching` | Same defer-the-gated-transition pattern for `moveDealStage` |
| `booking` | Booking quotes/drafts | `/app/booking/*` | **Agent wiring template** — `agentTools` import |
| `social-discovery` | Social profile discovery | `/app/matching` | Reused for contact/company enrichment |

Full agent audit: [`../03-crm-existing-state-audit.md`](../03-crm-existing-state-audit.md#ai-agents--copilotkit)

## Related work

| Item | Scope | Issue |
|------|-------|-------|
| Deal `won`/`lost` HITL gate | `ApprovalCard` + convert API | IPI-367 |
| `crm-assistant` route mapping | `/app/crm/*` → `crm-assistant` | **IPI-368** (wave 1) |
| CopilotKit context + `navigateTo` | `useAgentContext` providers, frontend tool safety | **IPI-368** (wave 1) |
| IntelligencePanel CRM sections | `panel-contract.ts` order | IPI-369 (wave 2) |
| Registry guard | `REQUIRED_AGENT_IDS` check before merge | IPI-368 |

## Implementation phases

**Tool-count phasing:** 7 Mastra tools across two waves; wave 1 also ships minimal CopilotKit wiring so the agent is usable on `/app/crm/*` before IntelligencePanel sections land.

| Phase | Wave | Deliverable | Issue |
|-------|------|-------------|-------|
| 1 | 1 | `crm-assistant` registered; tools via `agentTools`; page-context + `useAgentContext` | IPI-368 |
| 2 | 1 | `route-agent-map.ts`: `/app/crm/*` → `crm-assistant` | IPI-368 |
| 3 | 1 | `navigateTo` for CRM (extend `operator-panel` or CRM-specific frontend tool) | IPI-368 |
| 4 | 1 | Read/write core tools: `searchContacts`, `searchCompanies`, `logActivity`, `moveDealStage` (ungated only) | IPI-368 |
| 5 | 2 | `scoreDealHealth`, `summarizeRelationship`, `draftFollowUp` | IPI-369 |
| 6 | 2 | IntelligencePanel sections (deal health, next-best-action) | IPI-369 |
| — | — | `moveDealStage` `won`/`lost` HITL → convert route | IPI-367 (not wave 1) |

## Acceptance criteria

- [ ] `crm-assistant` key doesn't collide with `REQUIRED_AGENT_IDS`
- [ ] CRM tools registered through `tools/index.ts` / `agentTools`; agent wired like `booking-agent.ts`
- [ ] `moveDealStage` cannot set `won`/`lost` without HITL (IPI-367); wave 1 rejects at tool layer
- [ ] Mastra tools return `{ ok: false, error }` on failure — never re-throw
- [ ] CopilotKit frontend tools catch handler errors and return safe failure objects (separate from Mastra tool returns)
- [ ] `draftFollowUp` never calls a send path (IPI-369)
- [ ] Uses `resolveModel()`, no raw Gemini client instantiation
- [ ] `getMastra()` not called at module top-level in any new route
- [ ] `scoreDealHealth` uses explicit formula, not LLM scoring (IPI-369)
- [ ] No per-deal tool loops — use `scoreDealHealth(focus: …)` batch param (IPI-369)

## Verification

**IPI-368 (wave 1):**

```bash
cd app && npm run lint
cd app && npm test src/mastra
cd app && npm test src/lib/route-agent-map.test.ts
cd app && npx vitest run src/app/api/copilotkit/[[...slug]]/route.test.ts
```

**IPI-369 (wave 2):** add IntelligencePanel tests + full `src/app/api/copilotkit` suite per [`copilotkit-plan.md`](./copilotkit-plan.md).
