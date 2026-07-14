# Planner Task Plan Audit

Reviewed against the live [Planner Linear view](https://linear.app/amo100/view/planner-04c9501956f9alwsy).

## Verdict

The plan is **safe and generally well structured**, but it is **not yet the simplest or most efficient version**.

**Current score: 88/100 🟡**
**After the corrections below: 96/100 🟢**

The main problems are:

1. A real dependency loop between **IPI-478 · Hybrid Timeline/Kanban/Calendar UI Shell**, **IPI-483 · Workflow Engine v2**, and **IPI-582 · Planner Task Detail and Safe Mutations**.
2. **IPI-569 · Planner State Machine & Lifecycle Management** appears redundant because IPI-536 already shipped `status-transitions.ts`.
3. Tracker issues are incorrectly used as blockers for buildable tasks.
4. Several titles still describe deferred Cloudflare scope that the ticket bodies no longer include.
5. IPI-582 combines ordinary task mutations, drag-and-drop adoption, and approval integration, increasing failure risk.

IPI-536 has already shipped the routes, permission wrapper, mutation result, route helpers, and status transitions, including fixes for the contributor/viewer RLS lockout. 

---

# Task-by-task review

| Task                                                                                       |    Decision    | Efficiency | Required correction                                                                                                      |
| ------------------------------------------------------------------------------------------ | :------------: | ---------: | ------------------------------------------------------------------------------------------------------------------------ |
| **IPI-484 · Production Planner — Epic Tracker**                                            |      Keep      |         95 | Tracker only. Never use it as a code dependency.                                                                         |
| **IPI-476 · Planner Schema & Reusable Engine Core**                                        |    Keep Done   |         96 | No change.                                                                                                               |
| **IPI-477 · Shoot Production Timeline Template**                                           |    Keep Done   |         96 | No change.                                                                                                               |
| **IPI-536 · Planner Foundation — Routes, State-Management Decision & Core Infrastructure** | Close after QA |         95 | Merge final QA PR, then mark Done. Remove stale dependency commentary.                                                   |
| **IPI-538 · Planner Data Access — Slice A: Dashboard & Hub Reads**                         |      Keep      |         94 | Continue. IPI-536 is already shipped, so any blocker is now satisfied.                                                   |
| **IPI-576 · PLN-S5 — SCR-33 Planner Dashboard React Implementation**                       |      Keep      |         95 | Build first complete UI slice after IPI-538.                                                                             |
| **IPI-526 · Planner Hub — SCR-35 Screen Implementation**                                   |      Keep      |         94 | Build after Dashboard; reuse the same plan-card and metric formulas.                                                     |
| **IPI-574 · PLN-DATA-001B — Planner Data: Workspace Reads & Mutations**                    |      Keep      |         96 | Strong mutation contract. Must land before Workspace writes.                                                             |
| **IPI-478 · Hybrid Timeline / Kanban / Calendar UI Shell — Parent Tracker**                |  Keep tracker  |         89 | Do not use this tracker as a `blockedBy` dependency. Children are the real dependencies.                                 |
| **IPI-578 · PLN-S1A — Planner Workspace Shell and View Switching**                         |      Keep      |         95 | Build after IPI-574 reads exist.                                                                                         |
| **IPI-579 · PLN-S1B — Planner Timeline Read-Only View**                                    |      Keep      |         96 | Strong, focused read-only ticket.                                                                                        |
| **IPI-580 · PLN-S1C — Planner Kanban and List Views**                                      |      Keep      |         95 | Keep read-only. No drag-and-drop here.                                                                                   |
| **IPI-581 · PLN-S1D — Planner Calendar View**                                              |      Keep      |         93 | Keep simple start-date event chips for v1.                                                                               |
| **IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations**                             |      Edit      |         77 | Remove IPI-483 dependency and approval integration. Keep only task detail plus 3 ordinary mutation classes.              |
| **IPI-583 · PLN-S1F — Planner Workspace Responsive and Accessibility QA**                  |      Keep      |         92 | Add relation to IPI-584 and run after IPI-582.                                                                           |
| **IPI-479 · Role-Based Views + Assignments — Parent Tracker**                              |  Keep tracker  |         88 | Never block implementation tickets on this parent tracker.                                                               |
| **IPI-575 · PLN-DATA-001C — Planner Data: Settings & Member Mutations**                    |      Keep      |         95 | Land before Settings UI.                                                                                                 |
| **IPI-577 · PLN-S6 — SCR-34 Planner Settings and Member Access React Implementation**      |      Keep      |         94 | Keep Members-only scope.                                                                                                 |
| **IPI-569 · Planner State Machine & Lifecycle Management**                                 |  Merge/Cancel  |         55 | Verify remaining scope. If it only provides status mapping, it is already covered by IPI-536’s `status-transitions.ts`.  |
| **IPI-483 · Workflow Engine v2: Dependencies & Approvals**                                 |      Edit      |         80 | Remove tracker blockers; run after IPI-582. Own all approval UI and approval writes.                                     |
| **IPI-480 · Real-Time Sync via Supabase + Cloudflare Durable Objects**                     |   Rename/Edit  |         87 | Rename to Supabase Realtime Sync. Durable Objects are explicitly deferred.                                               |
| **IPI-481 · Notification Rules + Cloudflare Queue Fan-Out**                                |   Rename/Edit  |         88 | Rename to Planner In-App Notifications. Queue fan-out is deferred.                                                       |
| **IPI-482 · Mastra Planner AI Tools + CopilotKit HITL**                                    |      Edit      |         82 | State clearly that `production-planner` is currently a stub; remove dangling `IPI2-114`; keep no-second-write-path rule. |

---

# Critical dependency error

The live tasks currently create this chain:

```text
IPI-478 · Workspace Parent Tracker
    contains
IPI-582 · Task Detail and Safe Mutations
    blocked by
IPI-483 · Workflow Engine v2
    blocked by
IPI-478 · Workspace Parent Tracker
```

IPI-582 explicitly says it is blocked by IPI-483. 

IPI-483 explicitly says it is blocked by the IPI-478 and IPI-479 parent trackers while also blocking IPI-582. 

That is an effective circular dependency.

## Correct fix

### IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations

Keep:

* update task fields;
* shift task schedule;
* persist view preference;
* task detail panel;
* keyboard alternatives;
* mutation tests.

Remove:

* dependency on IPI-483;
* ApprovalCard wiring;
* approval contract integration.

### IPI-483 · Workflow Engine v2: Dependencies & Approvals

Make it depend on:

* IPI-574 · Workspace Data Reads & Mutations;
* IPI-582 · Task Detail and Safe Mutations;
* IPI-476 · Schema and Engine Core;
* IPI-477 · Timeline Template.

Remove dependencies on:

* IPI-478 parent tracker;
* IPI-479 parent tracker.

IPI-483 then owns:

* gate visibility;
* Approve/Edit/Discard UI;
* permission checks;
* cycle detection;
* approval plus shift atomic transaction;
* approval audit event.

---

# Simplified task structure

## Trackers — no PRs

```text
IPI-484 · Production Planner — Epic Tracker
IPI-478 · Workspace Views — Parent Tracker
IPI-479 · Role-Based Views and Assignments — Parent Tracker
```

These organize work but must not block implementation tasks.

## Actual implementation tasks

```text
Foundation
IPI-536 · Planner Foundation — Routes, State Management and Core Infrastructure

Dashboard and Hub
IPI-538 · Planner Data Access — Dashboard and Hub Reads
IPI-576 · Planner Dashboard React Implementation
IPI-526 · Planner Hub Screen Implementation

Workspace
IPI-574 · Planner Data — Workspace Reads and Mutations
IPI-578 · Planner Workspace Shell and View Switching
IPI-579 · Planner Timeline Read-Only View
IPI-580 · Planner Kanban and List Views
IPI-581 · Planner Calendar View
IPI-582 · Planner Task Detail and Safe Mutations
IPI-583 · Planner Workspace Responsive and Accessibility QA

Settings
IPI-575 · Planner Data — Settings and Member Mutations
IPI-577 · Planner Settings and Member Access React Implementation

Advanced
IPI-483 · Workflow Engine v2 — Dependencies and Approvals
IPI-480 · Planner Supabase Realtime Sync
IPI-481 · Planner In-App Notifications
IPI-482 · Planner AI Tools and CopilotKit HITL
```

---

# Recommended implementation order

```text
1. IPI-536 · Planner Foundation — finish QA and mark Done

2. IPI-538 · Planner Data Access — Dashboard and Hub Reads

3. IPI-576 · Planner Dashboard React Implementation

4. IPI-526 · Planner Hub Screen Implementation

5. IPI-574 · Planner Data — Workspace Reads and Mutations

6. IPI-578 · Planner Workspace Shell and View Switching

7. Parallel read-only views:
   IPI-579 · Planner Timeline Read-Only View
   IPI-580 · Planner Kanban and List Views
   IPI-581 · Planner Calendar View

8. IPI-582 · Planner Task Detail and Safe Mutations

9. IPI-583 · Planner Workspace Responsive and Accessibility QA

10. IPI-575 · Planner Data — Settings and Member Mutations

11. IPI-577 · Planner Settings and Member Access React Implementation

12. IPI-483 · Workflow Engine v2 — Dependencies and Approvals

13. IPI-480 · Planner Supabase Realtime Sync

14. IPI-481 · Planner In-App Notifications

15. IPI-482 · Planner AI Tools and CopilotKit HITL
```

This keeps the correct vertical-slice pattern:

```text
Foundation
→ real reads
→ read-only screen
→ safe mutations
→ responsive/accessibility
→ approvals
→ realtime
→ notifications
→ AI
```

---

# Additional task corrections

## IPI-569 · Planner State Machine & Lifecycle Management

Before keeping it, compare its deliverables against the code already shipped by IPI-536.

If its remaining scope is only:

* allowed status transitions;
* status labels;
* UI treatments;
* `canTransition()` helper;

then cancel it as merged into:

**IPI-536 · Planner Foundation — Routes, State Management and Core Infrastructure**

Keep a separate ticket only if it introduces a genuinely new consumer-backed capability.

---

## IPI-480 title correction

Current:

> Real-Time Sync via Supabase + Cloudflare Durable Objects

Recommended:

> **IPI-480 · PLN-RT-001 — Planner Supabase Realtime Sync**

Durable Objects are not part of v1.

---

## IPI-481 title correction

Current:

> Notification Rules + Cloudflare Queue Fan-Out

Recommended:

> **IPI-481 · PLN-NOTIF-001 — Planner In-App Notifications**

Cloudflare Queue fan-out is deferred and should not remain in the title.

---

## IPI-482 correction

Recommended title:

> **IPI-482 · PLN-AI-001 — Planner AI Explain, Draft and HITL Approval**

Correct task wording:

```text
Current state:
production-planner is registered but has no Planner-specific tools.

This task adds:
explain → summarize → draft → show diff → approve → call existing mutation.

It must not create a second database write path.
```

Remove or correct the nonexistent `IPI2-114` code reference.

---

# Final scorecard

| Area                   | Current | After fixes |
| ---------------------- | ------: | ----------: |
| Simplicity             |      84 |          96 |
| Safety                 |      93 |          97 |
| Efficiency             |      87 |          96 |
| Task clarity           |      91 |          97 |
| Dependency correctness |      72 |          97 |
| Reuse discipline       |      95 |          96 |
| Error prevention       |      91 |          97 |
| Overall                |  **88** |      **96** |

## Final answer

The plan is **close to the best practical structure**, but it needs four corrections:

1. Remove the IPI-582 ↔ IPI-483 ↔ tracker dependency loop.
2. Merge or cancel IPI-569 if IPI-536 already delivered its remaining status-transition scope.
3. Remove tracker issues as blockers of buildable tasks.
4. Rename IPI-480 and IPI-481 so their titles match their reduced v1 scope.

After those changes, the plan becomes a clear, safe vertical-slice process with minimal duplication and fewer opportunities for implementation errors.
