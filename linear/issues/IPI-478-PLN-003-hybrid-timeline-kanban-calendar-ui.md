# IPI-478 · PLN-003 — Hybrid timeline / kanban / calendar UI shell

**Role:** You are implementing this as an iPix engineer. One concern per PR.

**Linear:** https://linear.app/amo100/issue/IPI-478
**Track:** UI
**Blocked by:** IPI-476, IPI-477 · **Unblocks:** IPI-479, IPI-480
**Skills:** ipix-task-lifecycle · frontend-design · shadcn · worktrees · pr-workflow
**MVP proof:** #1

---

## The problem this solves

- The existing Shoot Schedule tab only displays `start_date`, `end_date`, and `location` as plain text.
- Producers need a visual timeline to understand phase overlaps, deadlines, and critical handoffs.
- Different roles prefer different metaphors: producers want a Gantt timeline, coordinators want a kanban board, clients want a calendar.

**Fix:** Build a reusable planner workspace with Timeline, Kanban, and Calendar views that all read from the same `planner` data layer.

---

## User story

> As a producer, when I open a production plan,
> I can switch between timeline, kanban, and calendar views,
> so I can choose the visualization that fits my current task.

---

## Wireframe — Planner Workspace

```
┌────────────────────────────────────────────────────────────────┐
│  NAV  │  Summer Lookbook  [Timeline] [Kanban] [Calendar]  AI   │
│       ├────────────────────────────────────────────────────────┤
│       │  Filters | Role: All | Today                           │
│       ├────────────────────────────────────────────────────────┤
│       │                                                        │
│       │  WEEK 1    WEEK 2    WEEK 3    WEEK 4    WEEK 5        │
│       │  D1..D5   D6..D10  D11..D15  D16..D20  D21..D25       │
│       │  Brief confirmation [====]                             │
│       │        Casting        [========]                       │
│       │          Soft hold      [==]                           │
│       │            Item delivery  [========]                   │
│       │                  Outfit confirmation [======]          │
│       │                       Payment & Scheduling [=====]     │
│       │                            Awaiting shoot [===]        │
│       │                                    Production [====]   │
│       │  Retouching starts | Retouching | Retouching ends      │
│       │                                       Final approval   │
│       │                                                Product │
│       │                                                        │
└───────┴────────────────────────────────────────────────────────┘
```

**States:**

| State | What to show |
|---|---|
| Empty | "Select a workflow template" overlay with primary CTA |
| Loading | Skeleton shimmer on timeline grid |
| Success | Rendered phase/task bars with tooltips |
| Unknown/not found | Amber warning: "Plan not found or access denied" |
| Error | Red inline banner + retry button |

---

## Acceptance criteria

- **A — Timeline view:** Reusable `PlannerTimeline` component renders a horizontal Gantt with week/day columns and pill-shaped phase/task bars spanning start/end dates.
- **B — Kanban view:** `PlannerKanban` renders columns per phase with draggable task cards; moving a card updates the task's `phase_id` and `status`.
- **C — Calendar view:** `PlannerCalendar` renders tasks as multi-day events on a month/week/day calendar.
- **D — View toggle:** Toolbar buttons switch views; last used view persists in `planner.view_configs`.
- **E — Shared detail drawer:** Clicking any task opens the same task detail drawer across all three views.
- **F — Responsive:** Desktop shows full 3-panel shell; tablet collapses intelligence panel; mobile defaults to role dashboard and vertical list.

---

## Technical notes

**Files to touch:**
- `app/src/components/planner/PlannerTimeline.tsx` — Gantt grid + bars.
- `app/src/components/planner/PlannerKanban.tsx` — phase columns + cards.
- `app/src/components/planner/PlannerCalendar.tsx` — calendar event renderer.
- `app/src/components/planner/TaskDetailDrawer.tsx` — shared detail panel.
- `app/src/components/planner/PlannerViewShell.tsx` — toolbar + view switcher.
- `app/src/app/(operator)/app/planner/[instanceId]/page.tsx` — planner workspace route.
- `app/src/hooks/use-planner-instance.ts` — data fetch + Realtime subscription hook.

**Do NOT:** Store view state in URL query params alone; persist user preference in `planner.view_configs`.

**Known data / constraints:** Views read from `planner.tasks`, `planner.phases`, and `planner.dependencies`; writes go through server actions or edge functions.

---

## Out of scope

- Role-based filtering logic (IPI-479)
- Real-time cursor/presence (IPI-480)
- Notification rules (IPI-481)
- AI chat commands (IPI-482)
- Dependency lines and auto-shift (IPI-483)

---

## Wiring plan

| Action | Path | Notes |
|--------|------|-------|
| Create | `app/src/components/planner/PlannerTimeline.tsx` | Gantt view |
| Create | `app/src/components/planner/PlannerKanban.tsx` | Kanban view |
| Create | `app/src/components/planner/PlannerCalendar.tsx` | Calendar view |
| Create | `app/src/components/planner/TaskDetailDrawer.tsx` | Shared drawer |
| Create | `app/src/components/planner/PlannerViewShell.tsx` | Shell + toggle |
| Create | `app/src/hooks/use-planner-instance.ts` | Data + Realtime |
| Modify | `app/src/app/(operator)/app/shoots/[id]/schedule/page.tsx` | Embed shell |

---

## Verify

### Per-task (Phase 3)
| Task | Test command | Proof |
|------|--------------|-------|
| 1 — Timeline render | `cd app && npx vitest run src/components/planner/PlannerTimeline.test.tsx` | Snapshots match |
| 2 — View switch | Browser smoke `/app/planner/[id]?view=kanban` | Kanban columns visible |
| 3 — Persist view | Toggle calendar, reload | Returns to calendar |

### Aggregate (Phase 4)
- [ ] `cd app && npm run lint && npm run typecheck && npm test`
- [ ] `cd app && npm run build`
- [ ] Browser smoke: `/app/shoots/[id]/schedule` @ 375px + 1280px
- [ ] `tasks/plan/todo.md` row → green · Linear → Done
