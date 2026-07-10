# IPI-483 · PLN-008 — Workflow engine v2: dependencies & approvals

**Role:** You are implementing this as an iPix engineer. One concern per PR.

**Linear:** https://linear.app/amo100/issue/IPI-483
**Track:** Platform
**Blocked by:** IPI-476, IPI-477, IPI-478, IPI-479 · **Unblocks:** —
**Skills:** ipix-task-lifecycle · ipix-supabase · mastra · worktrees · pr-workflow
**MVP proof:** #1

---

## The problem this solves

- Today, tasks in a plan are independent; moving one task does not update dependent tasks.
- Approval gates are not enforced in the data model, so teams can advance phases before required sign-offs.
- There is no formal dependency graph (finish-start, start-start, etc.) for the production workflow.

**Fix:** Add dependency edges, automatic forward/backward shifting, and phase gate conditions that block progression until approved.

---

## User story

> As a producer, when I move "Item delivery" later,
> dependent tasks automatically shift and gates block phase advance until the right role approves,
> so the schedule stays consistent and accountable.

---

## Flow

```mermaid
flowchart TD
    A[Task "Item delivery" end_date moved +2 days] --> B[Engine queries planner.dependencies]
    B --> C{Successor exists?}
    C -->|Yes| D[Calculate forward shift + lag]
    D --> E[Update successor start/end dates]
    E --> F{Successor has successors?}
    F -->|Yes| D
    F -->|No| G[Mark plan as AtRisk if deadline missed]
    C -->|No| H[No propagation]
    G --> I[Notify affected assignees]
    H --> J[Done]
```

---

## Acceptance criteria

- **A — Dependency edges:** `planner.dependencies` supports `finish_start`, `start_start`, `finish_finish`, and `start_finish` with `lag_days`.
- **B — Auto-shift:** Changing a task's dates propagates forward to successors and backward to predecessors when needed, respecting business days.
- **C — Cycle prevention:** Engine rejects dependency edits that would create a cycle.
- **D — Gate conditions:** `planner.gate_conditions` defines exit criteria per phase (e.g., all tasks done, approval recorded, payment confirmed).
- **E — Approval workflow:** Phase advance is blocked until a user with the required role submits an approval; denial records reason and returns phase to previous state.
- **F — Delay explanation:** A Mastra tool `explainDelay` can summarize why a plan is late based on events + dependencies.

---

## Technical notes

**Files to touch:**
- `app/src/lib/planner/dependencies.ts` — graph builder, cycle detection, shift propagation.
- `app/src/lib/planner/gates.ts` — gate condition evaluator.
- `app/src/lib/planner/engine.ts` — extend `shiftTask` and `checkGate`.
- `supabase/functions/planner-update-task/index.ts` — edge function that applies shift + gate logic service-side.
- `app/src/components/planner/GateApprovalCard.tsx` — inline approval UI.
- `app/src/components/planner/DependencyLine.tsx` — SVG dependency lines in timeline.

**Do NOT:** Compute shift propagation purely in the browser; the edge function must be the source of truth to avoid race conditions.

**Known data / constraints:** Dependency types map to standard FS/SS/FF/SF; lag can be negative (lead); gate conditions use a JSON Schema-like DSL.

---

## Out of scope

- Critical-path highlighting (future)
- Resource leveling / capacity planning
- Undo / redo history beyond `planner.events`

---

## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/lib/planner/dependencies.ts` | Graph + shift logic |
| Create | `app/src/lib/planner/gates.ts` | Gate evaluator |
| Create | `supabase/functions/planner-update-task/index.ts` | Service-side update |
| Create | `app/src/components/planner/GateApprovalCard.tsx` | Approval UI |
| Create | `app/src/components/planner/DependencyLine.tsx` | SVG lines |
| Modify | `app/src/lib/planner/engine.ts` | Integrate new modules |

---

## Verify

### Per-task (Phase 3)
| Task | Test command | Proof |
|------|--------------|-------|
| 1 — Dependency graph | `cd app && npx vitest run src/lib/planner/dependencies.test.ts` | Cycle detection passes |
| 2 — Auto-shift | Edge fn smoke: shift item delivery | Successor dates update |
| 3 — Gate block | Browser: advance phase without approval | Button disabled + error |

### Aggregate (Phase 4)
- [ ] `cd app && npm run lint && npm run typecheck && npm test`
- [ ] `cd app && npm run build`
- [ ] `npm run supabase:verify-rls`
- [ ] Browser smoke: `/app/planner/[id]` drag + gate flow
- [ ] `tasks/plan/todo.md` row → green · Linear → Done
