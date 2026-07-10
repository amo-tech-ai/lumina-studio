# IPI-482 · PLN-007 — Mastra planner AI tools + CopilotKit HITL

**Role:** You are implementing this as an iPix engineer. One concern per PR.

**Linear:** https://linear.app/amo100/issue/IPI-482
**Track:** AI
**Blocked by:** IPI-476, IPI-477 · **Unblocks:** IPI-483
**Skills:** ipix-task-lifecycle · mastra · copilotkit · gemini · worktrees · pr-workflow
**MVP proof:** #1

---

## The problem this solves

- Building a production schedule manually is repetitive and error-prone.
- Producers need to know which tasks are at risk, but there is no automated analysis.
- AI-generated schedules should not be written to the database without explicit approval.

**Fix:** Extend the existing `production-planner` Mastra agent with scheduling tools and a 4-gate HITL workflow that drafts, reviews, and commits plans through CopilotKit.

---

## User story

> As a producer, when I open a shoot plan,
> I can ask the AI to build the schedule, review its proposal,
> and approve it before it writes anything to the database.

---

## Flow

```mermaid
flowchart TD
    A[User asks agent: "Build a 5-week schedule for Summer Lookbook"] --> B[Mastra production-planner agent]
    B --> C[Tool: buildSchedule]
    C --> D[Read workflow template + deliverables]
    D --> E[Generate proposed tasks + dependencies]
    E --> F[Return draft to chat]
    F --> G{User approves?}
    G -->|Yes| H[Tool: commitSchedule]
    H --> I[Edge function: schedule-shoot-plan]
    I --> J[INSERT planner.tasks + dependencies]
    J --> K[Notify subscribers]
    G -->|No| L[User edits / cancels]
    L --> M[Agent revises draft]
    M --> F
```

---

## Acceptance criteria

- **A — New tools:** Add Mastra tools `buildSchedule`, `detectScheduleRisks`, `suggestDependencies`, `shiftTimeline`, `assignTasks`, `commitSchedule`, `explainDelay`, `summarizeTimeline`.
- **B — Schedule draft:** `buildSchedule` reads the shoot brief, deliverables, and workflow template and returns a proposed `planner.tasks` + `planner.dependencies` array without writing to the DB.
- **C — Risk detection:** `detectScheduleRisks` flags tasks that miss deadlines, have no assignee, or depend on late tasks.
- **D — Natural-language commands:** Users can type "Move Production 2 days earlier", "Who is blocked?", "Approve final delivery" in the CopilotKit chat dock.
- **E — HITL commit:** `commitSchedule` only runs after explicit user approval and calls a service-role edge function to persist the plan.
- **F — Agent identity:** The Mastra registry key, agent `id`, and frontend `useAgent({ agentId })` all remain `production-planner`.

---

## Technical notes

**Files to touch:**
- `app/src/mastra/tools/index.ts` — register new planner tools.
- `app/src/mastra/agents/production-planner.ts` — bind tools; ensure `id: 'production-planner'`.
- `app/src/mastra/workflows/production-plan-wizard.ts` — 4-gate HITL workflow.
- `supabase/functions/schedule-shoot-plan/index.ts` — persistance edge function.
- `app/src/components/operator/OperatorChatDock.tsx` — planner-aware system prompts.
- `app/src/lib/route-agent-map.ts` — already maps `/app/shoots` and `/app/planner` to `production-planner`.

**Do NOT:** Call Supabase service role from a Mastra tool directly; route durable writes through the edge function after HITL approval.

**Known data / constraints:** Default model `gemini-3.1-flash-lite`; agent logs go to `ai_agent_logs`; memory thread keyed by `planner_instance_id`.

---

## Out of scope

- Fine-grained resource leveling / PERT optimization
- Auto-assignment based on availability/calendar
- A2UI inline timeline widgets rendered by agent (future)

---

## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Modify | `app/src/mastra/tools/index.ts` | Add planner tools |
| Modify | `app/src/mastra/agents/production-planner.ts` | Bind tools |
| Create | `app/src/mastra/workflows/production-plan-wizard.ts` | HITL workflow |
| Create | `supabase/functions/schedule-shoot-plan/index.ts` | Persist approved plan |
| Modify | `app/src/components/operator/OperatorChatDock.tsx` | Planner context |

---

## Verify

### Per-task (Phase 3)
| Task | Test command | Proof |
|------|--------------|-------|
| 1 — Tool tests | `cd app && npx vitest run src/mastra/tools/planner-tools.test.ts` | Draft returned |
| 2 — HITL commit | Chat smoke: approve schedule | Rows inserted via edge fn |
| 3 — Agent ID sync | `grep -R "production-planner" app/src/mastra app/src/lib/route-agent-map.ts` | Three keys match |

### Aggregate (Phase 4)
- [ ] `cd app && npm run lint && npm run typecheck && npm test`
- [ ] `cd app && npm run build`
- [ ] Chat smoke: `/app/shoots/[id]/schedule` → ask agent → approve → verify DB
- [ ] `tasks/plan/todo.md` row → green · Linear → Done
