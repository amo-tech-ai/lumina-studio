# crm-assistant Agent — Wave 1 Implementation Plan

**Linear:** IPI-368 · CRM-AI-002
**Goal:** Register the `crm-assistant` Mastra agent with search/log/move tools **and** minimal CopilotKit wiring so chat works on `/app/crm/*` before wave 2 IntelligencePanel work.
**Architecture:** Built on `brand-intelligence-agent.ts` + **`booking-agent.ts` registry pattern** (`agentTools` from `tools/index.ts`). CopilotKit: `route-agent-map`, `useAgentContext` (mirror `brand-context.tsx`), `navigateTo` frontend tool.
**Tech stack:** Mastra (`app/src/mastra/`) · CopilotKit v2 (`route-agent-map.ts`, `useAgentContext`, `useFrontendTool`).

**Verify (app changes):**

```bash
cd app && npm run lint
cd app && npm test src/mastra
cd app && npm test src/lib/route-agent-map.test.ts
cd app && npx vitest run src/app/api/copilotkit/[[...slug]]/route.test.ts
```

**Depends on:** IPI-362, IPI-363, IPI-364 merged. IPI-365/366 are soft dependencies — do not wait on them.

---

## Task 1: Register the agent + tool registry

**Maps to AC:** "`crm-assistant` id does not collide with `REQUIRED_AGENT_IDS`" · tools via `agentTools` · "`getMastra()` is not called at module top-level"

**Files:**

- Create: `app/src/mastra/tools/crm/index.ts` (barrel) + wave-1 tool modules
- Modify: `app/src/mastra/tools/index.ts` — export CRM tools through `agentTools`
- Create: `app/src/mastra/agents/crm-assistant-agent.ts` — `tools: { … }` subset from `agentTools` (like `booking-agent.ts`)
- Modify: `app/src/mastra/agents/index.ts`, `app/src/mastra/index.ts`
- Test: `app/src/mastra/agents/crm-assistant-agent.test.ts`

**Test:**

- Type: vitest
- Command: `cd app && npx vitest run src/mastra/agents/crm-assistant-agent.test.ts`
- Pass when: `crm-assistant` ∉ `REQUIRED_AGENT_IDS`; agent module imports from `agentTools`; no top-level `getMastra()`

**Step 3: Minimal implementation** — mirror `brand-intelligence-agent.ts` instructions for page-context-first behavior. Wire tools from `agentTools`, not duplicated inline definitions.

---

## Task 2: Wave-1 Mastra tools — structured error returns

**Maps to AC:** "`moveDealStage` cannot set `won`/`lost`" · **Mastra** tools return `{ ok: false, error }` on failure — never re-throw

**Files:**

- Create: `app/src/mastra/tools/crm/search-contacts.ts`
- Create: `app/src/mastra/tools/crm/search-companies.ts`
- Create: `app/src/mastra/tools/crm/log-activity.ts`
- Create: `app/src/mastra/tools/crm/move-deal-stage.ts`
- Test: `app/src/mastra/tools/crm/move-deal-stage.test.ts`

**Note:** This is **Mastra server tool** error handling only. CopilotKit **frontend** tool safety is Task 4.

---

## Task 3: CopilotKit route map + page context

**Maps to AC:** `/app/crm/*` resolves to `crm-assistant` · `useAgentContext` injects current record id on CRM list/detail routes

**Files:**

- Modify: `app/src/lib/route-agent-map.ts`
- Create or modify: CRM context provider(s) — e.g. `app/src/components/crm/crm-record-context.tsx` calling `useAgentContext` (pattern: `brand-context.tsx`)
- Test: `app/src/lib/route-agent-map.test.ts`

**Pass when:** `resolveAgentId("/app/crm/companies") === "crm-assistant"`; CRM detail routes expose `{ companyId | contactId | dealId }` via `useAgentContext`.

---

## Task 4: `navigateTo` + CopilotKit frontend tool error safety

**Maps to AC:** CRM navigation via frontend tool · frontend handlers never re-throw

**Files:**

- Modify: `app/src/components/operator-panel/operator-panel.tsx` — extend `navigateTo` sections for CRM routes (`companies`, `contacts`, `pipeline`, `deals`), **or** add CRM-scoped `useFrontendTool` with the same audited wrapper pattern
- Reference: `tasks/crm/04-reference-implementations-analysis.md` (atomic-crm `useAuditedFrontendTool.ts`)

**Pass when:** handler exceptions return `{ ok: false, error: string }` — uncaught throws cannot abort the CopilotKit run.

---

## Task 5: Integration smoke

**Manual:** login → `/app/crm/companies` → chat responds as `crm-assistant` with injected context (no "which company?" when on a detail page).

---

## iPix rules

- Branch: `ipi/368-crm-assistant-wave1`
- Deliberately **not** blocked by IPI-367 — wave-1 `moveDealStage` never touches terminal stages; IPI-362 DB trigger is backstop
- Model access via `resolveModel()` only — no raw Gemini client (wave 2 tools not in this PR)
- IntelligencePanel CRM sections → **IPI-369**, not this PR

## Execution Handoff

1. **This session** — Task 1→4 via `ipix-task-lifecycle` Phase 3
2. **New session** — worktree `ipi/368-crm-assistant-wave1`
