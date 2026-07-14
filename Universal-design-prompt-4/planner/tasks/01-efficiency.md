# Planner Tasks — Efficiency and Error-Reduction Audit

## Executive verdict

The current **vertical-slice task plan is the best option**. It is more efficient and safer than:

* building every screen with mock data first;
* creating a large repository/hook/framework layer before proving a screen;
* placing routes, data, UI, mutations, mobile, and AI inside one oversized ticket.

The plan is approximately **87/100 correct today**. With the corrections below, it can reach **95/100**.

The biggest improvement is to make every screen follow one repeatable path:

```text
Verify → Reuse → Route → Read-only UI → Real reads
→ States → Safe mutations → Responsive → Accessibility → Browser proof
```

Next.js currently recommends Server Components for server-side data access, Server Functions for mutations, explicit handling of expected errors, route-level loading/error boundaries, and targeted revalidation after writes. ([Next.js][1])

Supabase’s safest pattern remains:

```text
RLS for every exposed table
+ authenticated user context
+ database function/RPC for atomic multi-row operations
+ explicit Realtime authorization for private channels
```

([Supabase][2])

---

# Recommended grading system

|  Score | Dot | Meaning                            |
| -----: | :-: | ---------------------------------- |
| 90–100 |  🟢 | Clear, safe, implementation-ready  |
|  75–89 |  🟡 | Good, but edit before development  |
|  50–74 |  🔴 | High failure or rework risk        |
|    N/A |  ⚪  | Deferred or intentionally excluded |

---

# Task-by-task recommendations

## IPI-536 · Planner Foundation: Routes and Core Infrastructure

**Current score:** 84/100 🟡
**Recommended score after edits:** 95/100 🟢

### Keep

* Four route stubs.
* Planner route helpers.
* Explicit route-agent mapping.
* Small state-management decision.
* Loading, error, and not-found handling.

### Remove

* Generic event bus.
* New global state-management library.
* Full state machine framework.
* Hooks that do not yet have two real consumers.
* Query keys unless the chosen client cache actually needs them.

### Best option

Use:

```text
Server Components for page reads
local useState for selection and view toggles
URL search parameters only for shareable filters
Server Functions for mutations
revalidatePath after successful writes
```

Next.js route-level `loading.tsx` provides meaningful Suspense loading UI, while `error.tsx` isolates failures to a route segment. ([Next.js][3])

### Correct task scope

```text
IPI-536 · PLN-FND-001 — Planner Routes and Minimal Foundation

Deliver:
- /app/planner
- /app/planner/dashboard
- /app/planner/[instanceId]
- /app/planner/[instanceId]/settings
- explicit production-planner route mapping
- route builders
- loading.tsx
- error.tsx
- not-found behavior
- short state decision:
  server data = RSC
  temporary UI state = local React state
  shareable filters = URL
```

### Failure points

* Adding a state library before a screen proves it is necessary.
* Creating query-key infrastructure while all reads are server-side.
* Mixing Planner UI components into this ticket.
* Building data logic before IPI-574/IPI-538.

---

## IPI-538 · PLN-DATA-001A — Dashboard and Hub Reads

**Current score:** 85/100 🟡
**Recommended:** 95/100 🟢

### Keep

* Dashboard reads.
* Hub reads.
* Read-only scope.
* No dependency on full Workspace implementation.

### Improve

Define every derived metric precisely:

| Metric         | Recommended definition                                    |
| -------------- | --------------------------------------------------------- |
| Progress       | completed non-cancelled tasks ÷ total non-cancelled tasks |
| At risk        | overdue active task or projected end date beyond plan end |
| Due today      | incomplete task with due date equal to org-local date     |
| Needs approval | reachable unmet approval assigned to current user/role    |
| My tasks       | incomplete tasks assigned to current user                 |

### Best option

Use two bounded server-side query functions:

```text
getPlannerDashboard(userId)
listPlannerInstances({ cursor, limit, search, type, status })
```

Avoid:

```text
load plans
→ query assignments for every card
→ query tasks for every card
→ query linked entity for every card
```

That creates an N+1 query pattern.

### Add acceptance criteria

* Hub pagination is bounded.
* Search behavior is defined.
* Archived plans are excluded by default.
* Every derived KPI has a unit test.
* Zero-plan and missing-linked-entity states work.
* No card causes an additional browser fetch.

---

## IPI-576 · PLN-S5 — Planner Dashboard

**Current score:** 86/100 🟡
**Recommended:** 96/100 🟢

### Best option

Build it as the first complete vertical screen because it is:

* the simplest Planner page;
* the default daily landing;
* highly reusable;
* low mutation risk;
* a good proof of routes, reads, states, and responsive behavior.

The user journeys position Dashboard as the starting point for new users, returning operators, and task-focused contributors. 

### Task contents

```text
Route
→ server-side dashboard query
→ real stat cards
→ recent plans
→ week strip
→ loading/empty/error/read-only
→ responsive layout
→ browser verification
```

### Do not include

* Settings.
* Invitations.
* Task shifting.
* Realtime.
* AI writes.
* New analytics system.

### Critical corrections

* Stat cards must be links, not clickable `<div>` elements.
* Each KPI link must preserve the selected filter.
* Production personas must not be treated as stored access roles.
* Add an explicit role-to-stat map.
* Implement sample-data honesty if real rows do not exist.

---

## IPI-526 · PLN-S4 — Planner Hub

**Current score:** 88/100 🟡
**Recommended:** 96/100 🟢

### Best option

Reuse the existing Shoots List architecture instead of making a new generic `PlannerCard` framework.

The design already identifies Hub as a Shoots List reskin, with the Planner Timeline as the only major new visual pattern. 

### Task contents

* Planner header.
* Search.
* Type and status filters.
* Paginated plan cards.
* Attention band.
* Adaptive plan-detail panel.
* New Plan entry point.
* Loading, empty, error states.
* Desktop, tablet, mobile.

### Corrections

* Remove stale documentation saying no Hub issue exists.
* Depend on IPI-536 and IPI-538 only.
* Do not block Hub on the complete Workspace.
* Define archived filtering.
* Define search matching.
* Use the same progress calculation as Dashboard.
* Use one card component only after Dashboard and Hub prove that their card anatomy truly matches.

### Failure points

* Building all cards as Client Components.
* Loading every plan in the organization at once.
* Duplicating filters between URL and local state.
* Creating different progress formulas on Hub and Dashboard.

---

## IPI-574 · PLN-DATA-001B — Workspace Reads and Mutations

**Current score:** 79/100 🟡
**Recommended:** 94/100 🟢

### Best architecture

```text
queries.ts
  get workspace data

engine-adapter.ts
  convert rows ↔ engine types

mutations.ts
  call transactional RPCs

actions.ts
  authenticate, authorize, validate and revalidate
```

### Required read methods

```text
getInstanceDetail(instanceId)
listTasks(instanceId)
listDependencies(instanceId)
listAssignments(instanceId)
getViewConfig(instanceId, userId)
```

### Required mutation methods

```text
updateTask()
shiftTask()
setViewConfig()
```

### Critical shift flow

```text
1. Authenticate user
2. Verify instance access
3. Fetch authoritative tasks and dependencies
4. Convert rows to PlannerEngine types
5. Call PlannerEngine.shiftTask()
6. Diff original and updated tasks
7. Persist all changed tasks atomically
8. Write planner.events audit record
9. Return conflicts and changed task IDs
10. Revalidate affected routes
```

Database functions are the better fit for data-intensive or multi-row transactional operations, while RLS remains defense in depth. ([Supabase][2])

### Add to acceptance criteria

* Stale-version protection.
* Idempotency key.
* Full rollback on one failed task update.
* Unauthorized-role rejection.
* Cross-organization isolation.
* Typed error codes.
* No raw Postgres errors returned to UI.
* `list` cannot be persisted as `default_view`.
* Audit event and changes commit together.

---

## IPI-578 · PLN-S1A — Workspace Shell

**Current score:** 89/100 🟡
**Recommended:** 97/100 🟢

### Best scope

Only build:

* Workspace route.
* Page header.
* View selector.
* Today control.
* filter controls;
* adaptive context panel host;
* persistent assistant slot;
* state placeholders.

### Do not build

* Timeline bars.
* Drag-and-drop.
* Mutations.
* Dependency lines.
* Realtime.
* AI tools.

### Critical correction

Desktop task details belong inside the adaptive right panel. Do not create a separate desktop Sheet beside Intelligence.

The frozen architecture requires one panel that swaps between Intelligence and selected detail. 

---

## IPI-579 · PLN-S1B — Timeline Read-Only

**Current score:** 80/100 🟡
**Recommended:** 92/100 🟢

### Best option

Build Timeline as an isolated read-only component before any drag operations.

### Minimal v1 features

* Phase rows.
* Date/week columns.
* Task bars.
* Today marker.
* Approval indicators.
* Selection opens adaptive detail.
* Sticky phase column.
* Horizontal scrolling.
* Keyboard task selection.
* Accessible task summary.

### Do not build

* Dependency editor.
* Drag mutations.
* Critical-path calculations.
* Custom canvas rendering.
* Zoom system.
* Infinite date range.

### Performance plan

|       Plan size | Behavior                                     |
| --------------: | -------------------------------------------- |
| Under 100 tasks | Normal DOM rendering                         |
|   100–500 tasks | Row virtualization recommended               |
|  Over 500 tasks | Virtualization required before support claim |

### Failure points

* Task bar calculations distributed through React components.
* Date math based on browser timezone.
* Rendering one element per task per day.
* No text alternative for visually positioned bars.
* Combining Timeline and mutation development.

---

## IPI-580 · PLN-S1C — Kanban and List Read-Only

**Current score:** 89/100 🟡
**Recommended:** 97/100 🟢

### Best option

Reuse CRM Pipeline for Kanban and existing table patterns for List.

### Fixed rules

* Kanban columns represent workflow phases.
* Task status remains a card chip.
* List is transient and not persisted.
* No drag or row mutations in this ticket.
* Both views use the same task selection/detail panel.

These rules are already frozen in the Planner onboarding and design plan.

### Simplify

Do not create:

* separate Kanban query;
* separate List query;
* separate task-detail component;
* separate task status logic.

One workspace payload should render all views.

---

## IPI-581 · PLN-S1D — Calendar Read-Only

**Current score:** 76/100 🟡
**Recommended:** 90/100 🟢 after resolving design

### Best option

Use **simple day chips for v1**, not complex spanning bars.

### Why

* easier to understand;
* easier to make keyboard accessible;
* fewer overlap bugs;
* easier responsive conversion;
* matches the current fixture direction;
* does not prevent multi-day bars later.

### Task scope

* Month grid.
* Current-day indication.
* Task chips by start date or due date.
* Selected task opens adaptive detail.
* Overflow `+N more`.
* Accessible day/task list.
* Read-only states.

### Blocker

Resolve exactly which date is used to place each task:

* start date;
* end date;
* every active day;
* milestone/due date.

Recommended v1:

```text
Display task on start date
Show end date inside the chip/detail
```

---

## IPI-582 · PLN-S1E — Workspace Mutations

**Current score:** 67/100 🔴
**Recommended:** 94/100 🟢 after rewriting

### Best option

One mutation ticket, but only three mutation classes:

1. update task fields;
2. shift task schedule;
3. persist Timeline/Kanban/Calendar preference.

### Do not include

* optimistic multi-task shifting;
* dependency editing;
* full auto-scheduling;
* approval workflows;
* AI writes;
* realtime conflict resolution.

### Mandatory mutation checklist

```text
authenticate
authorize
validate
load current version
run pure engine
diff
transactional persist
audit event
targeted revalidation
typed result
```

Server Actions are server-side mutation endpoints, and expected validation or business failures should be returned explicitly to the client. ([Next.js][4])

### Required tests

* valid update;
* validation failure;
* viewer denied;
* manager permitted;
* cross-org denied;
* stale version;
* partial DB failure rollback;
* duplicate idempotency key;
* dependency conflict;
* event written once;
* revalidation targets correct route.

---

## IPI-583 · PLN-S1F — Responsive and Accessibility QA

**Current score:** 91/100 🟢
**Recommended:** 97/100 🟢

### Resolve mobile behavior

Use:

```text
/app/planner
→ Dashboard or Hub mobile landing

/app/planner/[specific-id]
→ specific mobile Workspace
```

Do not redirect a direct instance, notification, or approval link to an unrelated Dashboard.

### Test widths

* 1440px
* 1280px
* 1024px
* 768px
* 390px
* 320px

### Required checks

* No page-level horizontal overflow.
* Timeline scrolls inside its own region.
* Keyboard navigation.
* Focus visible.
* Dialog focus trap and return.
* Panel/Sheet Esc behavior.
* Reduced motion.
* 200% zoom.
* Native buttons and links.
* Labels for every form control.
* Status not communicated by color alone.

React notes that portal-based modal interfaces must manage focus correctly and follow modal accessibility practices. ([React][5])

---

## IPI-575 · PLN-DATA-001C — Settings Reads and Mutations

**Current score:** 77/100 🟡
**Recommended:** 92/100 🟢

### Best scope

* List assignments.
* Invite/create assignment.
* Change access role.
* Remove assignment.
* Record events.

### Resolve before implementation

The UI describes invitation states such as:

* pending;
* expired;
* resend;
* accepted;
* failed.

Do not implement those unless a real invitation source of truth exists.

### Simplest safe v1

```text
Invite by email
→ find existing profile/member
→ create assignment
→ show success

Unknown email
→ return “No account found”
```

A real emailed invitation lifecycle can be added later with a dedicated invitations table or the existing organization invitation system, if one exists.

### Mandatory role rules

* Cannot remove final owner.
* Manager cannot grant owner unless explicitly allowed.
* Contributor cannot modify members.
* Viewer cannot mutate anything.
* A user cannot increase their own privilege.
* Removal and role changes write audit events.

---

## IPI-577 · PLN-S6 — Instance Settings

**Current score:** 87/100 🟡
**Recommended:** 96/100 🟢

### Best option

Build only Members.

Do not implement the disabled:

* Notifications;
* Workflow;
* Danger tabs.

### Task contents

* Real member table.
* Adaptive member-detail panel.
* Invite dialog.
* Change role.
* Remove member confirmation.
* Loading/empty/error/read-only states.
* Responsive member cards.
* Keyboard and focus QA.

For form validation feedback through Server Actions, Next.js documents `useActionState` as the supported pattern for returning validation errors and messages. ([Next.js][6])

---

## IPI-483 · Planner Approvals and Safe Shift

**Current score:** 74/100 🔴
**Recommended:** 90/100 🟢 after trimming

### Best v1 scope

* Display reachable approvals.
* Approve.
* Edit proposal.
* Discard proposal.
* Safe downstream task shift.
* Detect cycles.
* Show before/after diff.
* Record audit event.

### Defer

* Full critical path.
* Slack analysis.
* Dependency editor.
* Workflow builder.
* Autonomous rescheduling.
* Multiple approval rule builder.
* Custom automation language.

### Best mutation rule

Approval and resulting schedule updates must be one transaction.

```text
validate approval
→ validate role
→ validate current gate state
→ apply approved changes
→ write approval event
→ unlock next phase
→ commit together
```

---

## IPI-480 · Planner Realtime Sync

**Current score:** 85/100 🟡
**Recommended:** 94/100 🟢

### Best option

Use Supabase Realtime only.

Do not add:

* Cloudflare Durable Objects;
* WebSocket gateway;
* custom presence backend;
* offline mutation queue.

Supabase recommends private channels for production, and Realtime Authorization controls access through RLS policies on `realtime.messages`. ([Supabase][7])

### Task scope

* Subscribe to authorized `planner:<instanceId>`.
* Listen for task, assignment, and event changes.
* Re-fetch authoritative rows.
* Show lightweight sync state.
* Clean up on unmount.
* Test reconnect.
* Deduplicate received events.

### Important rule

Realtime notification is a signal to refresh.

Do not treat an arbitrary broadcast payload as the final database truth.

---

## IPI-481 · Planner Notifications

**Current score:** 86/100 🟡
**Recommended:** 95/100 🟢

### Best v1 option

Reuse the existing in-app Notification Center.

### Small event matrix

| Planner event      | Notify               |
| ------------------ | -------------------- |
| Assignment created | Assignee             |
| Approval ready     | Required approver    |
| Task overdue       | Assignee and manager |
| Schedule shifted   | Affected assignees   |
| Role changed       | Affected member      |

### Defer

* Email.
* WhatsApp.
* Push.
* Cloudflare Queues.
* configurable notification rules.
* digest scheduling.

### Add safeguards

* Deduplication key.
* Deep link to instance/task.
* User preference check when available.
* No notification for actor’s own routine update unless required.

---

## IPI-482 · Planner AI Tools and HITL

**Current score:** 78/100 🟡
**Recommended:** 92/100 🟢

### Best implementation order

```text
1. explain existing plan
2. summarize risks
3. draft suggested change
4. render before/after diff
5. operator approves
6. call the same IPI-582 mutation
7. record the decision
```

### Never create

* direct AI database writes;
* a second mutation layer;
* AI-specific scheduling calculations;
* autonomous approval;
* unreviewed mass task updates;
* a separate Planner-specific provider stack.

The Planner onboarding already defines the correct behavior: AI offers a proposed change, humans decide, and the existing `production-planner` agent should be reused. 

---

# Corrected build order

## Best option: vertical slices with shared foundations only where proven

```text
1. IPI-536
   Routes and minimal foundation

2. IPI-538
   Dashboard/Hub reads

3. IPI-576
   Dashboard complete vertical slice

4. IPI-526
   Hub complete vertical slice

5. IPI-574
   Workspace reads and core mutation contracts

6. IPI-578
   Workspace shell

7. IPI-579 / IPI-580 / IPI-581 in parallel
   Timeline, Kanban/List, Calendar read-only

8. IPI-582
   Workspace mutations

9. IPI-583
   Responsive/accessibility/browser QA

10. IPI-575
    Settings data

11. IPI-577
    Settings UI

12. IPI-483
    Approvals and safe downstream shift

13. IPI-480
    Realtime

14. IPI-481
    Notifications

15. IPI-482
    AI explain/draft/approve/commit
```

This matches the restructured Planner implementation plan, which intentionally split large tickets into read, screen, mutation, and QA slices. 

---

# What should be shared versus screen-local

## Share now

* Route helpers.
* Planner status mapping.
* Typed query functions.
* Mutation result type.
* Adaptive panel host.
* Task detail content.
* Plan card only after Dashboard and Hub prove identical needs.
* Error, empty, loading wrappers.
* Permissions check function.

## Keep screen-local initially

* Dashboard KPI layout.
* Hub attention band.
* Timeline geometry.
* Calendar chip rendering.
* Kanban phase column.
* Settings member row.
* Screen-specific filters.

## Rule

Create a shared abstraction only when:

```text
two real screens need it
and
their required behavior is materially identical
```

Do not create shared abstractions based only on future predictions.

---

# Best HTML-to-React conversion method

## Options researched

| Option                             | Initial speed | Rework risk | Complexity | Reliability |  Score |
| ---------------------------------- | ------------: | ----------: | ---------: | ----------: | -----: |
| Direct HTML → JSX conversion       |            95 |          35 |         85 |          50 |     66 |
| Build all mock screens, data later |            82 |          55 |         75 |          65 |     69 |
| Build framework/repositories first |            50 |          70 |         40 |          80 |     65 |
| **Vertical parity slice**          |        **88** |      **90** |     **88** |      **94** | **90** |

## Recommended flow

```text
1. Verify real route, code, schema and ticket
2. Freeze the approved HTML
3. Find reusable components
4. Define the visible data contract
5. Create route boundaries
6. Build read-only visual parity
7. Connect real server reads
8. Complete states
9. Add one safe mutation
10. Verify responsive and accessibility
11. Compare HTML and React visually
12. Run tests, build and browser journey
```

---

# Reusable prompt for any HTML page

# HTML → React Vertical-Slice Conversion

## Target

* Task: `IPI-XXX · TASK-ID — Full Task Name`
* Approved HTML: `[exact file path]`
* React route: `[exact route]`
* Similar existing screen: `[path or none]`
* Data source: `[tables, views, RPCs or APIs]`

## Objective

Convert the approved HTML into a production React/Next.js page with:

* visual parity;
* maximum reuse;
* real server-side data;
* complete UI states;
* safe mutations;
* responsive parity;
* accessibility;
* automated and browser verification.

Do not redesign the page or invent backend features.

---

## 1. Verify before planning

Inspect and report:

1. The approved HTML and its desktop/mobile variants.
2. Existing React route, page, layout and components.
3. Similar shipped pages and reusable patterns.
4. Current tables, columns, enums, foreign keys, RLS policies, RPCs and generated TypeScript types.
5. Related Linear issues, dependencies, open PRs, branches and worktrees.
6. Existing tests and browser journeys.
7. Contradictions between the HTML, ticket, schema and current code.

Never accept a Done, missing, or dependency claim without direct evidence.

---

## 2. Produce a reuse map

| HTML region    | Existing component/pattern | Decision             | Notes |
| -------------- | -------------------------- | -------------------- | ----- |
| Header         |                            | Reuse / Extend / New |       |
| Navigation     |                            |                      |       |
| Filters        |                            |                      |       |
| Main content   |                            |                      |       |
| Detail panel   |                            |                      |       |
| Empty state    |                            |                      |       |
| Loading state  |                            |                      |       |
| Error state    |                            |                      |       |
| Mobile pattern |                            |                      |       |

Rules:

* Reuse before extending.
* Extend before creating.
* Create a shared component only when at least two real screens need materially identical behavior.
* Do not create generic infrastructure for hypothetical future screens.

---

## 3. Define the page contract

For every visible value:

| UI field | Source | Stored/derived | Empty behavior | Permission |
| -------- | ------ | -------------- | -------------- | ---------- |

Define:

* exact read functions;
* exact mutation functions;
* validation;
* authorization;
* error result types;
* transaction requirements;
* cache/path revalidation;
* audit events;
* concurrency protection;
* idempotency;
* pagination and limits.

---

## 4. Choose the simplest architecture

Default choices:

* Initial data: Server Component.
* Interactive view/filter/selection: focused Client Component.
* Temporary selection: local React state.
* Shareable filter: URL search parameter.
* Form mutation: Server Function.
* Multi-row mutation: transactional Supabase RPC.
* Data security: authenticated user plus RLS.
* Successful mutation: targeted `revalidatePath` or existing cache convention.
* Expected error: typed result shown inline.
* Unexpected error: route `error.tsx`.
* Loading: route `loading.tsx` or local skeleton.
* Realtime: add only after normal reads and mutations work.

Do not add a new state library, query library, event bus, repository framework, analytics provider, realtime service or feature-flag system unless a verified requirement exists.

---

## 5. Split the implementation

### Task A — Route and read-only shell

* Create route.
* Add loading/error/not-found handling.
* Reuse shell and shared UI.
* Reproduce HTML layout with fixtures or typed placeholder data.
* No mutation.

### Task B — Real reads and states

* Add server-side query.
* Connect real data.
* Implement loading, empty, error, not-found, read-only and permission states.
* Add pagination/search where needed.

### Task C — Mutations

For each mutation:

```text
authenticate
→ authorize
→ validate
→ load authoritative current data
→ apply pure business logic
→ persist atomically
→ write audit event
→ return typed result
→ revalidate affected route
```

Add only one mutation class at a time.

### Task D — Responsive, accessibility and browser QA

* Verify all approved breakpoints.
* Keyboard-only test.
* Focus management.
* Reduced motion.
* Touch targets.
* Screen-reader labels.
* Visual comparison.
* Playwright journey.

Combine tasks only when each remains small, independently testable, and one-concern-per-PR.

---

## 6. Required failure tests

Test:

* invalid input;
* unauthenticated user;
* unauthorized role;
* cross-organization access;
* missing record;
* stale version;
* partial database failure;
* duplicate submission;
* empty dataset;
* long content;
* slow response;
* mobile viewport;
* keyboard-only path;
* unexpected render error.

Multi-row changes must prove complete rollback.

---

## 7. Verification commands

Use the repository’s real commands. At minimum verify:

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```

Then run the page in a real browser and verify:

* route loads;
* no console errors;
* no failed requests;
* no hydration warnings;
* links work;
* data is real;
* mutations persist;
* refresh preserves committed changes;
* responsive behavior matches the HTML;
* accessibility checks pass.

---

## 8. Final audit report

Return:

| Area                      | Score /100 | Dot | Evidence |
| ------------------------- | ---------: | :-: | -------- |
| Specification correctness |            |     |          |
| Reuse                     |            |     |          |
| Visual parity             |            |     |          |
| Data correctness          |            |     |          |
| Security                  |            |     |          |
| Mutation safety           |            |     |          |
| States                    |            |     |          |
| Responsive behavior       |            |     |          |
| Accessibility             |            |     |          |
| Testing                   |            |     |          |
| Production readiness      |            |     |          |

Also list:

1. Errors
2. Red flags
3. Failure points
4. Blockers
5. Missing requirements
6. Exact task corrections
7. Recommended PR order
8. Whether the task will succeed
9. Whether it is production-ready
10. Evidence supporting every completion claim

Legend:

* 🟢 90–100 — ready
* 🟡 75–89 — proceed after edits
* 🔴 below 75 — unsafe or blocked
* ⚪ deferred/not applicable

---

## Stop conditions

Stop and report a blocker when:

* schema or RPC required by the task does not exist;
* permissions are unclear;
* a multi-row mutation has no atomic design;
* the task duplicates an existing component or service;
* HTML and acceptance criteria materially conflict;
* a dependency is unfinished but missing from Linear;
* implementation requires inventing an unapproved product feature;
* the page cannot be tested with real data.

---

# Final scores

| Area                         | Current plan | Improved plan |
| ---------------------------- | -----------: | ------------: |
| Task clarity                 |           86 |            96 |
| Efficiency                   |           88 |            95 |
| Simplicity                   |           84 |            94 |
| Reuse                        |           91 |            96 |
| Error prevention             |           76 |            95 |
| Security                     |           80 |            95 |
| Testability                  |           83 |            96 |
| Production readiness of plan |       **84** |        **95** |

## Final recommendation

Use the **vertical parity slice** for every HTML page:

```text
Route
→ read-only parity
→ real reads
→ states
→ one mutation
→ responsive/a11y
→ browser proof
```

Keep shared infrastructure small. The safest task is not the one with the most architecture; it is the one with a clear input, clear output, one responsibility, verified reuse, and a test proving the real user journey works.

[1]: https://nextjs.org/docs/app/api-reference/functions/revalidatePath?utm_source=chatgpt.com "Functions: revalidatePath"
[2]: https://supabase.com/docs/guides/database/functions?utm_source=chatgpt.com "Database Functions | Supabase Docs"
[3]: https://nextjs.org/docs/13/app/building-your-application/routing/error-handling?utm_source=chatgpt.com "Routing: Error Handling"
[4]: https://nextjs.org/docs/app/getting-started/error-handling?utm_source=chatgpt.com "Getting Started: Error Handling"
[5]: https://react.dev/reference/react-dom/createPortal?utm_source=chatgpt.com "createPortal"
[6]: https://nextjs.org/docs/app/guides/forms?utm_source=chatgpt.com "How to create forms with Server Actions"
[7]: https://supabase.com/docs/guides/realtime/authorization?utm_source=chatgpt.com "Realtime Authorization | Supabase Docs"
