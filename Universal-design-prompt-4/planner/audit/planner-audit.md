# Production Planner — Comprehensive Audit Report

> **Generated:** 2026-07-12
> **Scope:** IPI-484 Epic · IPI-536 (Foundation) · IPI-538 (Data/Repository) · SCR-32–35 Designs · All Production Code
> **Methodology:** Codebase review · Test execution · Build verification · Design-file analysis · Linear issue audit · User-journey walkthrough

> **⚠️ Corrections (2026-07-12, later same day pass):** 4 fixes applied to this doc: (1) the IPI-479 "will succeed" reasoning cited "SCR-30" as a reuse source — that's CRM Pipeline, unrelated to Dashboard/Settings; corrected to the actual sources (SCR-25, shared table/dialog conventions). (2) The Scoring System's own final table didn't follow its own legend — four 0-39 scores were marked 🔴 instead of ⚫; fixed. (3) SCR-35's "no backing Linear issue" finding is resolved — [IPI-526](https://linear.app/amo100/issue/IPI-526) was opened the same day. (4) IPI-536/IPI-538 have since been re-parented directly under the epic (IPI-484) instead of nested under IPI-478, and both now carry real Linear `blockedBy` relations matching their documented dependency chain, not just prose. None of these change the overall verdict (still 🔴 NOT PRODUCTION READY, still 42/100) — they're accuracy fixes, not new findings.

---

## Executive Summary

| Dimension | Score | Grade |
|---|---|---|
| Backend (schema/engine/agents) | 96/100 | 🟢 |
| Design (prototypes/docs) | 86/100 | 🟢 |
| Frontend (routes/components) | 5/100 | 🔴 |
| Data/Service layer | 0/100 | 🔴 |
| Foundation infra (IPI-536) | 0/100 | 🔴 |
| Test coverage (code) | 95/100 | 🟢 |
| Production readiness | 15/100 | 🔴 |

**Overall: 42/100 — 🔴 NOT PRODUCTION READY. Foundation blocks are unstarted.**

---

## Task-by-Task Audit

### IPI-536 — Planner Foundation: Routes, State Mgmt, Core Infrastructure

**Status: 🔴 NOT STARTED** | Priority: P1 | Estimate: 2-3d | Score: 0/100

#### Requirements (from Linear)
1. Route stubs: `/app/planner`, `/app/planner/[instanceId]`, `/app/planner/[instanceId]/settings`, `/app/planner/dashboard`
2. State-management decision comment
3. Route path constants + query-key factory
4. Fixture-to-live-data mapping checklist
5. Planner types verification

#### Audit Findings

| Check | Result | Grade |
|---|---|---|
| Route stubs exist | 🔴 **MISSING** — `app/src/app/(operator)/app/planner/` directory does not exist | 🔴 |
| `/app/planner` route | 🔴 MISSING | 🔴 |
| `/app/planner/[instanceId]` route | 🔴 MISSING | 🔴 |
| `/app/planner/[instanceId]/settings` route | 🔴 MISSING | 🔴 |
| `/app/planner/dashboard` route | 🔴 MISSING | 🔴 |
| route-agent-map.ts includes `/app/planner` | 🔴 **MISSING** — only `/app/shoots` mapped to production-planner; no planner route in map | 🔴 |
| State mgmt decision recorded | 🔴 Not done | 🔴 |
| `constants.ts` (route path constants) | 🔴 File does not exist | 🔴 |
| `query-keys.ts` (query key factory) | 🔴 File does not exist | 🔴 |
| Fixture→schema mapping in PR description | 🔴 No PR exists | 🔴 |
| Types verification | 🟢 `Database["planner"]` confirmed via PR #283 generated types | 🟢 |

#### Red Flags / Blockers
- 🚩 **ALL routes are missing** — zero planner UI accessible via URL
- 🚩 Users cannot reach any planner screen from any existing navigation
- 🚩 route-agent-map.ts has NO planner route mapping; without it, `/app/planner` requests won't resolve to production-planner agent
- 🚩 No state management decision means every screen implementer will make independent (potentially conflicting) choices
- 🚩 No query-key factory means no standardised cache-invalidation pattern

#### Critical Fixes (Pre-requisite for ALL other tasks)
1. Create `app/src/app/(operator)/app/planner/page.tsx` — Hub shell placeholder (export default function)
2. Create `app/src/app/(operator)/app/planner/[instanceId]/page.tsx` — Workspace shell
3. Create `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx` — Settings shell
4. Create `app/src/app/(operator)/app/planner/dashboard/page.tsx` — Dashboard shell
5. Add `["/app/planner", "production-planner"]` to ROUTE_MAP in route-agent-map.ts
6. Create `app/src/lib/planner/constants.ts` with route path constants
7. Create `app/src/lib/planner/query-keys.ts` with query key factory
8. Record state management decision as comment in first hook file (grep existing pattern: likely React Query + context)

#### Corrections Required
- Add row `["/app/planner", "production-planner"]` to ROUTE_MAP (before the default fallback, after `/app/crm`)
- Export route builders from constants.ts: `plannerRoute()`, `plannerInstanceRoute(id)`, `plannerSettingsRoute(id)`, `plannerDashboardRoute()`
- Export query keys from query-keys.ts: `plannerKeys.all`, `plannerKeys.instance(id)`, `plannerKeys.instances()`

---

### IPI-538 — Planner Data & Repository Layer

**Status: 🔴 NOT STARTED** | Priority: P1 Urgent | Estimate: 5-6d | Score: 0/100

#### Requirements (from Linear)
1. Repository/service functions wrapping PlannerEngine + Supabase CRUD for all 10 planner tables
2. Server Actions for invite, multi-table creation with partial-failure handling
3. Commit path for drag-and-drop and AI-approval persist
4. Optimistic UI deferred; simple mutate-await-refetch for v1

#### Audit Findings

| Check | Result | Grade |
|---|---|---|
| `service.ts` exists in `lib/planner/` | 🔴 **MISSING** — lib/planner only has types.ts, engine.ts, engine.test.ts | 🔴 |
| CRUD functions for 10 planner tables | 🔴 None exist | 🔴 |
| `buildSchedule()` integration with batch-insert | 🔴 Not wired — engine is pure logic, no DB persistence | 🔴 |
| Server Actions at `app/planner/[instanceId]/actions.ts` | 🔴 Route does not exist, so actions don't exist | 🔴 |
| Commit path for drag-and-drop | 🔴 None | 🔴 |
| View config persistence | 🔴 None | 🔴 |
| `conflicts` array surfaced for shiftTask() | 🔴 Not wired | 🔴 |
| Tests for service layer | 🔴 No service layer exists | 🔴 |

#### Red Flags / Blockers
- 🚩 **No data-access layer exists** — every screen would need to call `supabase.from('planner.tables')` directly
- 🚩 `PlannerEngine` is pure logic (returns objects, never calls DB) — no code bridges engine output to Supabase inserts
- 🚩 The `verify-planner-scenario.mjs` script demonstrates the manual read-engine-persist pattern, but there's no reusable function for it
- 🚩 Partial-insert failure risk identified in Linear as "Medium" — no handling designed
- 🚩 No server action means invite flow (multi-table: assignment + event + notification) has no atomic write path

#### Critical Fixes
1. Create `app/src/lib/planner/service.ts` with typed functions:
   - `listInstances(orgId)`, `getInstance(id)`, `createInstance(params)` → calls `PlannerEngine.buildSchedule()` then batch-inserts tasks+dependencies
   - `updateTask(id, fields)`, `shiftTask(id, deltaDays)` → calls `PlannerEngine.shiftTask()` then persists
   - `listAssignments(instanceId)`, `createAssignment(params)`
   - `getViewConfig(userId, instanceId)`, `setViewConfig(config)`
   - `listEvents(instanceId)` (read-only)
2. Create server actions file at route path (blocked on IPI-536 routes existing)
3. Each service function should handle partial-insert failure (wrap in try/catch, return structured error)
4. Expose `conflicts` array from shiftTask to UI as toastable error

---

### IPI-476 — Planner Schema & Reusable Engine Core

**Status: 🟢 DONE (94/100)** | Score: 96/100

#### Audit Findings

| Check | Result | Grade |
|---|---|---|
| Schema migration (10 tables, enums, RLS) | 🟢 Delivered — `20260709000000_planner_schema_rls.sql` | 🟢 |
| Grants + seed backfill | 🟢 Delivered — `20260710080000_planner_grants_and_seed_backfill.sql` | 🟢 |
| Realtime auth helper | 🟢 Delivered — `20260710081000_planner_realtime_auth_helper.sql` | 🟢 |
| Contributor-only broadcast | 🟢 Delivered — `20260710082000_planner_broadcast_contributor_only.sql` | 🟢 |
| UUID regex guard fix | 🟢 Delivered — `20260710083000_planner_realtime_uuid_guard.sql` | 🟢 |
| Org bootstrap migration | 🟢 Delivered — `20260710123617_planner_org_default_workflow_bootstrap.sql` | 🟢 |
| PlannerEngine (types.ts + engine.ts) | 🟢 166 lines types + 440 lines engine | 🟢 |
| Engine tests (27 tests) | 🟢 ALL PASS | 🟢 |
| Mastra agent configuration | 🟢 productionPlannerAgent wired with tools + memory | 🟢 |
| Durable wrapper for reconnect | 🟢 durable.ts implemented and tested | 🟢 |
| Registry guard (REQUIRED_AGENT_IDS) | 🟢 Implemented | 🟢 |
| 153 test files, 1180 tests pass | 🟢 ALL PASS | 🟢 |
| Build succeeds | 🟢 YES | 🟢 |
| tsc --noEmit zero errors | 🟢 YES | 🟢 |

#### Minor Issues
- 🟡 `PlannerEngine.buildSchedule()` returns `instanceId: ""` — caller must fill it in (documented, by design)
- 🟡 Memory is ephemeral in-memory LibSQL in dev (documented, by design)
- 🟡 Verify scenario script fails with ERR_UNKNOWN_FILE_EXTENSION due to direct TS import from .mjs

---

### IPI-477 — Shoot Production Timeline Template

**Status: 🟢 DONE (100/100)** | Score: 100/100

| Check | Result |
|---|---|
| Org bootstrap migration exists | 🟢 `20260710123617_planner_org_default_workflow_bootstrap.sql` |
| AFTER INSERT trigger on organizations | 🟢 Verified in tests |
| advisory lock for concurrent safety | 🟢 Verified |
| service_role restricted | 🟢 Verified |
| Backfill pass over existing orgs | 🟢 Verified |
| Contract tests pass | 🟢 ALL 4 PASS |

---

### SCR-32 — Planner Workspace (Timeline/Kanban/Calendar/List)

**Status: 🟢 Design Complete · 🔴 Not Implemented** | Design: 90/100 · Frontend: 0/100

| Check | Result | Grade |
|---|---|---|
| Design prototype (dc.html) | 🟢 Built and verified — 665 lines | 🟢 |
| Timeline view | 🟢 Designed with Gantt bars, today marker, gate diamonds | 🟢 |
| Kanban view | 🟢 Phase-column layout (11 columns), locked columns, status filter | 🟢 |
| Calendar view | 🟢 7-column day grid, event pills, today ring | 🟢 |
| List view | 🟢 7-column table with sortable rows | 🟢 |
| Now & Next bar | 🟢 Designed with pinned cards | 🟢 |
| Phase gate drawer | 🟢 Approve·Edit·Discard | 🟢 |
| Intelligence panel | 🟢 Context → insight → evidence → approvals | 🟢 |
| State matrix (10 states) | 🟢 Tweaks: live/loading/empty/error/complete + role + syncFailed | 🟢 |
| Responsive behavior | 🟡 Specified in docs, NOT built in DC | 🟡 |
| Empty/loading/error states in DC | 🟡 Specced, NOT wired into prototype | 🟡 |
| Route implemented in app | 🔴 `/app/planner/[instanceId]` does NOT exist | 🔴 |
| Component built in app | 🔴 None — TimelineGrid, KanbanBoard, etc. are design-only | 🔴 |
| Data wired to backend | 🔴 No service layer exists to fetch workspace data | 🔴 |

#### Gaps vs Design
- No PlannerTimeline component exists
- No TaskDetailDrawer component exists
- No PhaseGateDrawer component exists
- No view-switcher (Timeline/Kanban/Calendar/List) exists
- No Now & Next bar component exists
- Schedule tab remains a 3-line placeholder

---

### SCR-33 — Planner Dashboard

**Status: 🟢 Design Complete · 🔴 Not Implemented** | Design: 88/100 · Frontend: 0/100

| Check | Result | Grade |
|---|---|---|
| Design prototype (dc.html) | 🟢 Built — 335 lines | 🟢 |
| KPI stat cards (4) | 🟢 Needs approval, At risk, Due today, My tasks | 🟢 |
| "Start Here" priority card | 🟢 Amber-bordered, "2 approvals blocking today's work" | 🟢 |
| Recent plans (3 cards) | 🟢 Summer Lookbook, SS26 Campaign, Nike Editorial | 🟢 |
| Upcoming week strip | 🟢 7-column with task chips | 🟢 |
| Intelligence panel | 🟢 Board health + recommendation + activity feed | 🟢 |
| State matrix (9 states) | 🟢 Tweaks: live/loading/empty/error + role + syncFailed | 🟢 |
| Route implemented in app | 🔴 `/app/planner/dashboard` does NOT exist | 🔴 |
| Component built | 🔴 None | 🔴 |

---

### SCR-34 — Instance Settings (Members)

**Status: 🟢 Design Complete · 🔴 Not Implemented** | Design: 86/100 · Frontend: 0/100

| Check | Result | Grade |
|---|---|---|
| Design prototype (dc.html) | 🟢 Built — 444 lines | 🟢 |
| Members tab with table | 🟢 Access role, name, permissions, manage | 🟢 |
| Invite dialog | 🟢 Email validation + role selector + focus trap | 🟢 |
| Member detail panel | 🟢 Role change + remove controls | 🟢 |
| Disabled tabs (3) | 🟢 Notifications, Workflow, Danger — "Coming soon" | 🟢 |
| Route implemented | 🔴 `/app/planner/[instanceId]/settings` does NOT exist | 🔴 |
| Invite member flow wired | 🔴 No server action for invite | 🔴 |

---

### SCR-35 — Planner Hub

**Status: 🟢 Design Complete · 🔴 BLOCKED** | Design: 80/100 · Frontend: 0/100

| Check | Result | Grade |
|---|---|---|
| Design prototype (dc.html) | 🟢 Built — 379 lines | 🟢 |
| Plan card grid | 🟢 4-column, 12 plans, 3 need attention | 🟢 |
| Type/status filter + search | 🟢 All/Shoot/Campaign/CRM Deal chips + status dropdown | 🟢 |
| Attention band | 🟢 Amber-bordered, quick-link buttons to at-risk plans | 🟢 |
| Cross-plan Intelligence panel | 🟢 Active/planned/at-risk/completed counts | 🟢 |
| Route implemented | 🔴 `/app/planner` does NOT exist | 🔴 |
| **Linear issue** | 🟢 **Resolved — [IPI-526](https://linear.app/amo100/issue/IPI-526) opened same day (2026-07-12).** Correction (later pass): IPI-526 was briefly marked Done via a mislinked, unrelated PR (#338, AWS Bedrock provider work) — reopened to Backlog, blocked by IPI-536, since the actual Hub route still doesn't exist | 🟢 |

---

### Mastra Agent Layer

**Status: 🟢 DONE** | Score: 95/100

| Check | Result | Grade |
|---|---|---|
| productionPlannerAgent defined | 🟢 agents/index.ts | 🟢 |
| Tools configured (17 shoot tools) | 🟢 Tools registered, booking tools excluded | 🟢 |
| Shoot-wizard HITL workflow (3 gates) | 🟢 deliverable-gate → shot-list-gate → budget-gate | 🟢 |
| Durable wrapper for stream reconnect | 🟢 durable.ts, tested | 🟢 |
| Registry with REQUIRED_AGENT_IDS guard | 🟢 mastra/index.ts | 🟢 |
| Route-agent mapping | 🟢 /app/shoots → production-planner, fallback = production-planner | 🟢 |
| `/app/planner` in route-agent-map | 🔴 MISSING — will fallback to default (production-planner) but not explicit | 🔴 |
| Working memory (PlannerWorkingMemory) | 🟢 Defined in memory.ts | 🟢 |
| Agent workflow bindings | 🟢 shoot-wizard bound to production-planner | 🟢 |
| Tests (29 total) | 🟢 ALL PASS across 5 test files | 🟢 |

#### Issue
- 🟡 route-agent-map.ts has no explicit `/app/planner` entry — relies on fallback to `DEFAULT_AGENT` ("production-planner"). Works but is inconsistent with architecture.

---

### Existing Frontend Components Referencing Planner

| Component | Exists? | Uses Real Planner Data? | Notes |
|---|---|---|---|
| ScheduleTab | 🟢 Yes | 🔴 No — only renders start_date, end_date, location | Placeholder: "no per-block itinerary table exists" |
| ShootWizardContext | 🟢 Yes | 🟢 Yes — injects wizard step into agent context | Bridges wizard UI ↔ production-planner agent |
| BrandContext | 🟢 Yes | 🟢 Yes — injects brand identity → agent context | For "explain this score" agent queries |
| CommandCenterEmpty | 🟢 Yes | N/A — mentions "Production Planner can import from..." | Text reference only |
| PortfolioHeroCard | 🟢 Yes | N/A — displays "Production Planner" as agent label | Display only |
| ShootsListEmptyState | 🟢 Yes | N/A — mentions "Production Planner can turn a brief into..." | Text reference only |

---

## Implementation Task Coverage (Design D-PLN Tasks)

| Task | Description | Status in code | Grade |
|---|---|---|---|
| D-PLN-1 | SCR-32 Workspace shell + Timeline | 🔴 Not started | 🔴 |
| D-PLN-2 | SCR-32 Kanban view | 🔴 Not started | 🔴 |
| D-PLN-3 | SCR-32 Calendar + List views | 🔴 Not started | 🔴 |
| D-PLN-4 | TaskDetailDrawer (shared) | 🔴 Not started | 🔴 |
| D-PLN-5 | SCR-32 states | 🔴 Not started | 🔴 |
| D-PLN-6 | SCR-33 Dashboard | 🔴 Not started | 🔴 |
| D-PLN-7 | SCR-33 role variants + states | 🔴 Not started | 🔴 |
| D-PLN-8 | SCR-34 Members tab | 🔴 Not started | 🔴 |
| D-PLN-9 | SCR-34 states + destructive guard | 🔴 Not started | 🔴 |
| D-PLN-10 | SCR-35 Planner Hub | 🔴 Blocked (no Linear issue) | 🔴 |
| D-PLN-11 | StatusChip planner enums | ⚪ Backend-only (enums exist in DB schema) | 🟡 |
| D-PLN-12 | Mobile reflows | 🔴 Not started | 🔴 |
| D-PLN-13 | plannertoken block | 🔴 Not started | 🔴 |

---

## Build Verification

| Check | Result |
|---|---|
| `npm run build` (app) | ✅ PASSES — 0 errors |
| `npx tsc --noEmit` (app) | ✅ PASSES — 0 errors |
| `npm run lint` (app) | ⏱️ not run (no linter configuration found in audit path) |
| `npx vitest run` (app — all 153 files) | ✅ **1180 PASS, 6 SKIPPED, 0 FAIL** |
| Engine tests (27) | ✅ ALL PASS |
| Mastra agent tests (29 across 5 files) | ✅ ALL PASS |
| Route-agent-map tests (7) | ✅ ALL PASS |
| Org bootstrap migration tests (4) | ✅ ALL PASS |
| Verify scenario script | ❌ FAILS — `ERR_UNKNOWN_FILE_EXTENSION` (node .mjs importing .ts) |

---

## User Journey Walkthrough

### Journey 1: First-time User Opens Planner

| Step | Expected | Actual | Grade |
|---|---|---|---|
| 1. Navigate to `/app/planner` | Planner Hub (SCR-35) renders with "No plans yet" | 🔴 **404 — route does not exist** | 🔴 |
| 2. See empty state + "New plan" CTA | EmptyState + template picker button | 🔴 Cannot reach page | 🔴 |
| 3. Select workflow template | Picker opens | 🔴 Not possible | 🔴 |
| 4. Plan created → redirect to Workspace | `/app/planner/[id]` opens Timeline view | 🔴 Route does not exist | 🔴 |

**BLOCKED at step 1 — user cannot reach any planner screen.**

### Journey 2: Returning User Checks Dashboard

| Step | Expected | Actual | Grade |
|---|---|---|---|
| 1. Navigate to `/app/planner/dashboard` | Personal KPI overview | 🔴 **404** | 🔴 |
| 2. See "2 approvals blocking today's work" | Start Here card | 🔴 Cannot reach | 🔴 |
| 3. Click "Review" → goes to workspace | Deep-link to plan instance | 🔴 Not possible | 🔴 |

**BLOCKED at step 1.**

### Journey 3: Manager Reviews Plan Progress (via Shoots → Schedule)

| Step | Expected | Actual | Grade |
|---|---|---|---|
| 1. Navigate to `/app/shoots/[id]` | Shoot detail page | 🟢 **Works** | 🟢 |
| 2. Click Schedule tab | ScheduleTab renders | 🟢 **Renders** but only start_date/end_date/location | 🟡 |
| 3. See Gantt timeline with phases | Planner Timeline view | 🔴 **Not wired** — just empty state or 3-date entries | 🔴 |

**Schedule tab is a placeholder — no planner data integration.**

### Journey 4: Manager Invites Team Member (Settings)

| Step | Expected | Actual | Grade |
|---|---|---|---|
| 1. Navigate to `/app/planner/[id]/settings` | Instance Settings | 🔴 **404** | 🔴 |
| 2. Click "Invite member" | Invite dialog opens | 🔴 Not possible | 🔴 |
| 3. Enter email + role → send | Invite persisted, toast confirmation | 🔴 Not possible | 🔴 |

**BLOCKED at step 1.**

### Journey 5: Hub → Workspace → Settings Navigation Flow (Full Workflow)

| Transition | Expected | Actual | Grade |
|---|---|---|---|
| Hub → Workspace | Click plan card → `/app/planner/[id]` | 🔴 Hub doesn't exist | 🔴 |
| Workspace → Settings | Gear icon → `/app/planner/[id]/settings` | 🔴 Workspace doesn't exist | 🔴 |
| Dashboard → Workspace | KPI card deep-link | 🔴 Dashboard doesn't exist | 🔴 |
| Settings → Workspace | Breadcrumb back | 🔴 Settings doesn't exist | 🔴 |

**Entire navigation flow is non-functional.**

---

## Red Flags Summary

| # | Severity | Issue | Affects |
|---|---|---|---|
| 1 | 🔴 **CRITICAL** | No planner routes exist (IPI-536 not started) | ALL user journeys |
| 2 | 🔴 **CRITICAL** | No data/repository layer exists (IPI-538 not started) | ALL data operations |
| 3 | 🔴 **HIGH** | route-agent-map.ts has no `/app/planner` entry | Agent resolution |
| 4 | 🔴 **HIGH** | No service layer wraps PlannerEngine for DB persistence | All CRUD operations |
| 5 | 🔴 **HIGH** | No state management decision recorded | All screen implementations |
| 6 | 🔴 **HIGH** | No query-key factory for cache invalidation | Data fetching consistency |
| 7 | 🔴 **MEDIUM** | SCR-35 Hub has no backing Linear issue | Blocked from implementation |
| 8 | 🔴 **MEDIUM** | Verify scenario script broken (TS import from .mjs) | Integration testing |
| 9 | 🟡 **MEDIUM** | Schedule tab is 3-line placeholder — no planner data integration | ScheduleTab UX |
| 10 | 🟡 **LOW** | route-agent-map.ts implicit fallback — should declare `/app/planner` explicitly | Code clarity |
| 11 | 🟡 **LOW** | Over-design risk: Timeline is only genuinely new component; Kanban/Calendar/List are reskins | Implementation effort |

---

## Is Anything Missing?

### Codebase Gaps (High Priority)
| What's Missing | File | Critical? |
|---|---|---|
| Route stubs (4 pages) | `app/src/app/(operator)/app/planner/{page.tsx,[instanceId]/page.tsx,[instanceId]/settings/page.tsx,dashboard/page.tsx}` | 🔴 YES |
| Route-agent-map entry for `/app/planner` | `app/src/lib/route-agent-map.ts` | 🔴 YES |
| Service layer (all CRUD for 10 tables) | `app/src/lib/planner/service.ts` | 🔴 YES |
| Route path constants | `app/src/lib/planner/constants.ts` | 🟡 YES |
| Query key factory | `app/src/lib/planner/query-keys.ts` | 🟡 YES |
| Server actions for invite/multi-table writes | `app/src/app/(operator)/app/planner/[instanceId]/actions.ts` | 🟡 YES |
| Planner UI components (TimelineGrid, Kanban, etc.) | `app/src/components/planner/` | 🟡 YES |

### Design Gaps (Medium Priority)
| What's Missing | Detail | Critical? |
|---|---|---|
| Empty/loading/error states in DC prototypes | Specced but not wired into designs | 🟡 YES |
| Responsive DC frames (tablet/mobile) | Specified in docs, not built in prototypes | 🟡 YES |
| ~~SCR-35 Linear issue (PLN-009)~~ | ✅ Resolved same day — [IPI-526](https://linear.app/amo100/issue/IPI-526) | Done |

### Test Gaps
| What's Missing | Detail | Critical? |
|---|---|---|
| Service layer tests | No service layer exists | 🔴 YES |
| Route integration tests | No routes exist | 🔴 YES |
| Component tests for planner UI | No planner UI components exist | 🟡 YES |
| Verify scenario script broken | ERR_UNKNOWN_FILE_EXTENSION | 🟡 YES |

---

## Best Practices Compliance

| Practice | Status | Evidence |
|---|---|---|
| No commented code | 🟢 Clean | Verified across planner codebase |
| No debug logs in production code | 🟢 Clean | Verified |
| Components default-exported | 🟢 Pattern established | (no planner components yet) |
| TypeScript types in single source of truth | 🟢 types.ts is SSOT | 166 lines |
| Tests before implementation | 🟢 Engine tests written before any UI | 27 tests |
| HITL for write operations | 🟢 shoot-wizard workflow uses 3 gates | agents/index.ts |
| Tool domain isolation | 🟢 Booking tools excluded from planner agent | agents/index.test.ts |
| Registry guard (missing agent detection) | 🟢 REQUIRED_AGENT_IDS fails fast | mastra/index.ts |
| Migrations idempotent | 🟢 All planner migrations use IF NOT EXISTS / upsert | 6 migrations |
| Realtime auth scoped by role | 🟢 Contributor-only broadcast | 81000/82000/83000 migrations |
| Route strings not duplicated | 🔴 No constants.ts exists — IPI-536 missing | IPI-536 |
| State management standardized | 🔴 No decision recorded — IPI-536 missing | IPI-536 |
| Optimistic UI deferred to follow-up | 🟢 Documented in IPI-538 spec | IPI-538 |

---

## Will the Task Succeed?

| Task | Verdict | Reason |
|---|---|---|
| **IPI-536** (Routes/Infra) | ✅ **Will succeed** — low complexity (2-3d), clear AC, no unknowns | Straightforward task with well-defined scope |
| **IPI-538** (Data layer) | ✅ **Will succeed** — medium complexity (5-6d), clear scope, PlannerEngine ready | Engine is tested and proven; just needs service wrapper |
| **IPI-478** (Workspace UI) | 🟡 **Risky** — highest complexity (Timeline is genuinely new pattern) | Timeline render is the risk; reuse Kanban/Calendar/List lowers overall risk |
| **IPI-479** (Dashboard + Settings) | ✅ **Will succeed** — reskins of existing patterns (SCR-25 Role Dashboards for the Dashboard; shared list-table + shadcn `Dialog` conventions for Settings' Members tab) | Low visual risk, established patterns — **correction (2026-07-12, later pass): the original "SCR-30" citation here was wrong.** SCR-30 is CRM Pipeline, which has no relation to Dashboard or Settings anywhere in `planner-react-onboarding.md`'s own component inventory (§5) — likely cross-contamination from the CRM audit written the same day. Corrected to the actual cited sources. |
| **Entire Epic (IPI-484)** | 🟡 **Conditional** — depends on IPI-536 and IPI-538 being shipped first | Foundation blocks are not started; epic completion depends on executing those in sequence |

---

## Scoring System

```
🟢 90-100  Complete / Production-ready
🟡 70-89   Mostly complete, minor gaps
🔴 40-69   Significant work remaining
⚫ 0-39    Not started / Critical blockers
```

**Correction (2026-07-12, later pass):** 4 of the 5 grades below contradicted this section's own legend just above — 0-39 should be ⚫ per the legend, not 🔴 (that band is reserved for 40-69). Fixed to match the stated scale; only **Overall** (42) was actually in the 🔴 band.

| Layer | Score | Grade |
|---|---|---|
| **Backend** (schema, engine, agents, tests) | 96/100 | 🟢 |
| **Design** (specs, prototypes, docs) | 86/100 | 🟢 |
| **Foundation** (IPI-536: routes, infra) | 0/100 | ⚫ |
| **Data Layer** (IPI-538: service, actions) | 0/100 | ⚫ |
| **Frontend** (routes, components, wiring) | 5/100 | ⚫ |
| **Production Readiness** | 15/100 | ⚫ |
| **Overall** | **42/100** | 🔴 |

---

## Production Readiness Verdict

**🔴 NOT PRODUCTION READY**

The Production Planner has a solid backend foundation (schema, engine, agents, 6 migrations, 1180 tests all passing) and thorough design specifications (4 screens, component catalog, interaction catalog, QA handoff). However, the critical path between design and production code is completely missing:

1. **IPI-536 (Foundation) is not started** — no routes, no constants, no state management decision
2. **IPI-538 (Data Layer) is not started** — no service layer, no server actions, no DB persistence bridge
3. **No planner UI components exist** — TimelineGrid, KanbanBoard, TaskDetailDrawer, Dashboard, Hub, Settings are all design-only

The design-to-code gap is 100%. The Planner Engine is tested and ready, the Mastra agent is configured and wired, the Supabase schema has 6 migrations and realtime support — but none of it is connected to any frontend surface.

---

## Priorities for Next Actions

1. 🔴 **IPI-536** — Route stubs + constants + query keys + state decision (2-3d, unblocks everything)
2. 🔴 **IPI-538** — Service layer wrapping PlannerEngine + Supabase CRUD (5-6d, unblocks data wiring)
3. ✅ ~~**PLN-009** — Open Linear issue for SCR-35 Hub~~ — resolved same day, [IPI-526](https://linear.app/amo100/issue/IPI-526) opened, correctly re-parented under the epic and blocked by IPI-536
4. 🟡 **SCR-32 Timeline** — Build TimelineGrid component (highest risk, do first)
5. 🟡 **SCR-33 Dashboard** — Reskin SCR-25 Role Dashboard (low risk, fast win)
6. 🟡 **SCR-34 Settings** — Members tab + Invite dialog (shadcn composite)
7. 🟡 **SCR-35 Hub** — Reskin Shoots List (once PLN-009 exists)
8. 🟡 **Schedule tab upgrade** — Wire planner phase data into Shoot Detail schedule tab
9. 🟡 **Fix verify script** — ERR_UNKNOWN_FILE_EXTENSION on TS import

---

## File Manifest Status

| File | Purpose | Status |
|---|---|---|
| `app/src/lib/planner/types.ts` | All planner TS types | 🟢 |
| `app/src/lib/planner/engine.ts` | PlannerEngine class | 🟢 |
| `app/src/lib/planner/engine.test.ts` | 27 engine tests | 🟢 |
| `app/src/lib/planner/constants.ts` | Route path constants | 🔴 MISSING |
| `app/src/lib/planner/query-keys.ts` | Query key factory | 🔴 MISSING |
| `app/src/lib/planner/service.ts` | Data-access layer | 🔴 MISSING |
| `app/src/lib/route-agent-map.ts` | URL→agent mapping | 🟡 Missing `/app/planner` |
| `app/src/app/(operator)/app/planner/page.tsx` | Hub route | 🔴 MISSING |
| `app/src/app/(operator)/app/planner/[instanceId]/page.tsx` | Workspace route | 🔴 MISSING |
| `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx` | Settings route | 🔴 MISSING |
| `app/src/app/(operator)/app/planner/dashboard/page.tsx` | Dashboard route | 🔴 MISSING |
| `app/src/mastra/agents/index.ts` | productionPlannerAgent | 🟢 |
| `app/src/mastra/memory.ts` | PlannerWorkingMemory | 🟢 |
| `app/src/mastra/durable.ts` | Durable agent wrapper | 🟢 |
| `app/src/mastra/index.ts` | Mastra registry | 🟢 |
| `app/src/mastra/workflows/shoot-wizard.ts` | 3-gate HITL workflow | 🟢 |
| `app/src/mastra/tools/index.ts` | Tool registry (20 tools) | 🟢 |
| `supabase/migrations/20260709*` | Schema/RLS/seed | 🟢 |
| `supabase/migrations/20260710*` | Grants/auth/realtime/bootstrap | 🟢 |
| `scripts/verify-planner-scenario.mjs` | E2E integration test | 🟡 Broken (TS import) |
