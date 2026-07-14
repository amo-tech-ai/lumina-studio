# iPix / FashionOS Production Planner — Architecture Plan

**Output folder:** `Universal-design-prompt-new/plan/planner/`  
**Reference screenshots:** `8eb2c2aa-9bdc-47a8-851b-84aa6a082b7e.png`, `a129ba7f-5282-4161-9f73-ccb40688ba59.png` (SquareShot "How It Works" 5-week production timeline)  
**Canonical app:** `app/` (Next.js 16 + CopilotKit v2 + Mastra + Supabase)  
**Date:** 2026-07-08

---

## 1. Vision & Scope

Build a single, reusable **Production Planner Engine** inside iPix that powers any time-bound, multi-stakeholder workflow: fashion shoots, campaign production, CRM deal pipelines, and future verticals. The first shipped experience is a **5-week product/model shoot timeline** inspired by SquareShot, exposed as a hybrid **timeline / kanban / calendar** workspace with role-based views, real-time collaboration, AI-assisted scheduling, and approval gates.

### Out of scope for MVP
- Full resource leveling / critical-path PERT optimization
- Native mobile apps
- External calendar two-way sync (Google/Outlook) — read-only ICS export only
- Billing/invoicing integration (Mercur handles commerce)

---

## 2. Design Principles

| # | Principle | Implication |
|---|-----------|-------------|
| 1 | **One engine, many surfaces** | `planner_*` primitives model shoots, campaigns, and CRM deals without forking code. |
| 2 | **Supabase is source of truth** | All durable state lives in Postgres; Cloudflare handles ephemeral sync/notify fan-out. |
| 3 | **HITL by default** | AI proposes schedules/dependencies; durable writes require explicit human approval. |
| 4 | **Role-first UX** | Views, permissions, and notifications are filtered by the user's role in a planner instance. |
| 5 | **Realtime without lock-in** | Supabase Realtime for DB change streaming; Cloudflare Durable Objects for session/presence. |
| 6 | **Progressive disclosure** | MVP ships SquareShot-style timeline first; kanban/calendar toggles reuse the same data layer. |

---

## 3. Reusable Planner Engine

The engine is a set of relational primitives that can describe any gated, multi-phase workflow.

### 3.1 Core entities

```text
planner_workflow          # template: "5-Week Product Shoot", "CRM Pipeline"
  └─ planner_phase        # ordered stages: Brief confirmation, Casting, Production, ...
      └─ planner_phase_gate  # HITL gate definition per phase

planner_instance          # concrete run bound to shoot / campaign / crm_deal
  ├─ planner_task         # units of work with start/end, owner, status
  ├─ planner_dependency   # task-to-task dependency edges
  ├─ planner_assignment   # user ↔ role ↔ instance
  ├─ planner_event        # audit + activity stream
  └─ planner_view_config  # per-user/role view prefs
```

### 3.2 Engine responsibilities

1. **Schema-driven workflows** — a workflow JSON schema declares phases, default durations, allowed transitions, gating rules, and role permissions.
2. **Schedule calculation** — given a kickoff date and workflow template, the engine emits task start/end dates with business-day awareness.
3. **Dependency resolution** — forward/backward shifts propagate when a predecessor moves or a deadline changes.
4. **Role resolution** — assignments map users to roles (`producer`, `photographer`, `retoucher`, `model`, `client_approver`, `stylist`, `coordinator`) per instance.
5. **Event sourcing light** — every state change writes a `planner_event` row; current state is derived from the latest events.
6. **Notification rules** — declarative rules fire on phase/task transitions, mentions, due-date proximity, or approval requests.

---

## 4. Supabase Schema

New dedicated `planner` schema. Existing `shoot.*` tables remain unchanged; `planner_instance` links to them via `entity_type` + `entity_id` polymorphic references.

### 4.1 Tables

| Table | Purpose | Key fields |
|---|---|---|
| `planner.workflows` | Reusable templates | `id`, `org_id`, `name`, `category` (shoot\|campaign\|crm), `version`, `schema_jsonb`, `is_default` |
| `planner.phases` | Workflow stages | `id`, `workflow_id`, `slug`, `name`, `order_index`, `default_duration_days`, `gate_type` (none\|approval\|payment\|delivery), `required_role` |
| `planner.gate_conditions` | Gate exit criteria | `id`, `phase_id`, `condition_type`, `condition_jsonb` |
| `planner.instances` | Running plans | `id`, `org_id`, `workflow_id`, `entity_type`, `entity_id`, `name`, `status`, `planned_start`, `planned_end`, `actual_start`, `actual_end`, `owner_user_id` |
| `planner.tasks` | Work units | `id`, `instance_id`, `phase_id`, `parent_task_id`, `title`, `description`, `start_date`, `end_date`, `duration_days`, `status`, `priority`, `assignee_user_id`, `assignee_role` |
| `planner.dependencies` | Task edges | `id`, `instance_id`, `from_task_id`, `to_task_id`, `type` (finish_start\|start_start\|finish_finish\|start_finish), `lag_days` |
| `planner.assignments` | Instance membership | `id`, `instance_id`, `user_id`, `role`, `permissions` (jsonb), `invited_at`, `joined_at` |
| `planner.events` | Audit stream | `id`, `instance_id`, `task_id`, `actor_user_id`, `event_type`, `payload_jsonb`, `created_at` |
| `planner.notification_rules` | Per-role/event rules | `id`, `org_id`, `workflow_id`, `event_type`, `role`, `channel` (in_app\|email\|push\|sms), `template_ref`, `delay_minutes`, `is_active` |
| `planner.view_configs` | User view prefs | `id`, `user_id`, `instance_id`, `default_view` (timeline\|kanban\|calendar), `filters_jsonb`, `columns_jsonb` |

### 4.2 Polymorphic linking

```sql
-- Examples:
entity_type = 'shoot'      -> entity_id = shoot.shoots.id
entity_type = 'campaign'   -> entity_id = public.campaigns.id
entity_type = 'crm_deal'   -> entity_id = public.crm_deals.id
```

A Postgres function `planner.resolve_entity(instance_row)` returns the joined entity name/type for display.

### 4.3 RLS policies (org-scoped)

- `workflows`: `SELECT` org member; `INSERT/UPDATE/DELETE` org admin or planner admin role.
- `instances`: `SELECT` where user is in `planner.assignments` or org member; `UPDATE` owner/planner admin.
- `tasks`: `SELECT` via instance membership; `UPDATE` assignee or owner.
- `assignments`: `SELECT` self or instance member; `INSERT/DELETE` owner.
- `events`: `SELECT` instance member; `INSERT` owner/assignee/service role only.

All RLS uses `(SELECT auth.uid())` for caching, per project convention.

### 4.4 Realtime publication

Publish `planner.instances`, `planner.tasks`, `planner.events`, `planner.assignments` to Supabase Realtime. Channel naming: `planner:<instance_id>`.

---

## 5. Cloudflare Architecture

Cloudflare complements Supabase rather than replacing it. It is responsible for **ephemeral real-time session coordination**, **notification fan-out**, and **lightweight edge AI**.

### 5.1 Components

| Component | Product | Responsibility |
|---|---|---|
| `planner-coordinator` | Durable Object | Per-instance WebSocket hub; presence, cursor broadcast, ephemeral lock hints. |
| `planner-notify` | Queue + Worker | Reliable fan-out of notifications to email/SMS/push providers; dedup + retries. |
| `planner-cache` | KV | Hot cache of active planner views and workflow templates (60s TTL). |
| `planner-ai` | Workers AI | Lightweight urgency scoring, timeline summarization, sentiment on comments. |
| `planner-gateway` | Worker | Route `/api/planner/realtime/*` WebSocket upgrades and `/api/planner/notify` webhook. |

### 5.2 Data flow

1. Client opens `/app/planner/:instanceId`.
2. Next.js page loads initial state from Supabase RLS.
3. Client joins Supabase Realtime channel `planner:<instance_id>` for DB change streaming.
4. Client also opens a WebSocket to `planner-coordinator` Durable Object for presence, cursor positions, and "who is viewing this task".
5. On task/phase updates, Supabase Realtime pushes changes; Durable Object synchronizes ephemeral UI state.
6. When a notification rule fires, an edge function inserts a `public.notifications` row and enqueues to `planner-notify` Queue for external-channel fan-out.

### 5.3 Why not pure Supabase Realtime?

- Presence, ephemeral locks, and cursor sync are inefficient in Postgres.
- Cloudflare Durable Objects offer colocated, strongly consistent state per instance with sub-50ms latency globally.
- Queue fan-out decouples notification delivery from the critical write path.

---

## 6. Mastra AI Tools & Workflows

The existing `production-planner` Mastra agent (registry key = `production-planner`) is extended with planner-specific tools. The route map already points `/app/shoots` to this agent.

### 6.1 New tools (in `app/src/mastra/tools/index.ts`)

| Tool | Reads | Writes | HITL? |
|---|---|---|---|
| `buildSchedule` | workflow template, shoot brief, deliverables | returns proposed `planner.tasks` array | No (draft only) |
| `detectScheduleRisks` | tasks, dependencies, calendar | risk report | No |
| `suggestDependencies` | tasks, phase definitions | proposed dependency edges | No |
| `assignTasks` | instance assignments, user roles | proposed assignee mapping | No |
| `shiftTimeline` | tasks, dependencies, shift delta | returns shifted plan | No (what-if) |
| `commitSchedule` | approved plan | calls `schedule-shoot-plan` edge function | **Yes** — explicit approval |
| `explainDelay` | events, tasks | natural-language delay explanation | No |
| `summarizeTimeline` | tasks, events, comments | summary for chat | No |

### 6.2 New workflow: `production-plan-wizard`

A 4-gate HITL workflow extending the existing `shoot-wizard`:

1. **Gate 1 — Template select** (agent picks or confirms workflow template)
2. **Gate 2 — Schedule draft** (agent emits proposed tasks/dependencies)
3. **Gate 3 — Assignment draft** (agent proposes owners by role)
4. **Gate 4 — Commit** (human approves; edge function persists to `planner.*` tables)

### 6.3 Model & memory

- Default model: `gemini-3.1-flash-lite` via `resolveGeminiModel()`.
- Use Mastra memory (thread per `planner_instance`) for context across chat sessions.
- Agent logs go to `ai_agent_logs` via `insertAgentLog` edge helper.

---

## 7. CopilotKit Integration

CopilotKit v2 (`/v2` imports) is already wired at `/api/copilotkit`. The planner surfaces use:

- `useAgent({ agentId: 'production-planner' })` on `/app/planner/*` and `/app/shoots/*`.
- `useCopilotChat` in `OperatorChatDock` for natural-language scheduling commands ("move Production two days earlier").
- A2UI surfaces (future, post-MVP) for inline timeline widgets rendered by the agent.
- HITL interrupts via Mastra `suspend/resume` patterns: when the agent needs approval, it emits a component requiring the user to confirm.

### 7.1 Agent ID contract

Keep three keys identical:
- Mastra registry key in `app/src/mastra/index.ts`
- Agent `id` field in agent definition
- Frontend `useAgent({ agentId })`

---

## 8. Frontend Architecture

### 8.1 Route layout

```text
/app
  /planner                    # planner hub / recent instances
  /planner/[instanceId]       # main workspace
      ?view=timeline|kanban|calendar
  /planner/[instanceId]/settings
  /shoots/[id]/schedule       # existing tab upgraded to embedded planner instance
  /campaigns/[id]/planner     # campaign planner surface
  /crm/[id]/planner           # deal pipeline planner surface
```

### 8.2 View components

| View | Component | Notes |
|---|---|---|
| Timeline | `PlannerTimeline` | Reusable Gantt-like grid. Rows = phases/tasks; columns = days/weeks. Supports drag-to-resize, dependency lines, current-day marker. |
| Kanban | `PlannerKanban` | Columns = phases; cards = tasks; DnD moves tasks across phases with HITL gate prompts. |
| Calendar | `PlannerCalendar` | Month/week/day switch; tasks rendered as events; multi-day bars. |
| Role dashboard | `PlannerRoleDashboard` | "My tasks this week", "Needs my approval", "At risk" — personalized landing. |

### 8.3 Shared state

- Server fetch initial state via RLS.
- Client cache with `usePlannerInstance(instanceId)` hook backed by SWR / React Query + Supabase Realtime subscription.
- Optimistic updates for drag/drop; rollback on error.

### 8.4 Role-based filtering

Each `planner_assignment.permissions` JSONB declares:

```json
{
  "can_view_all_tasks": true,
  "can_edit_own_tasks": true,
  "can_edit_all_tasks": false,
  "can_approve_gates": ["final_approval"],
  "can_invite_members": false
}
```

The UI computes effective permissions from role defaults + instance overrides.

---

## 9. Notifications

### 9.1 Channels

- **In-app:** `public.notifications` rows; real-time badge updates.
- **Email / SMS / Push:** Cloudflare Queue → Worker fan-out to configured providers.

### 9.2 Trigger events

- Phase transition (e.g., "Production → Retouching")
- Task assigned to you
- Approval gate pending your role
- Due-date proximity (24h, 4h)
- Dependency blocker resolved
- Mention in comment

### 9.3 Notification payload

```json
{
  "notification_id": "...",
  "recipient_user_id": "...",
  "instance_id": "...",
  "event_type": "phase.transition",
  "title": "Production started for "Summer Lookbook"",
  "body": "...",
  "cta_url": "/app/planner/abc123?view=timeline",
  "channels": ["in_app", "email"]
}
```

---

## 10. Security & RLS

- All planner tables use org-scoped RLS; service-role writes only from approved edge functions.
- `planner.workflows` schemas are validated server-side before persistence (JSON Schema).
- Assignment role elevation requires instance owner or org admin.
- Cloudflare Worker endpoints verify Supabase JWT before allowing WebSocket upgrade or notify enqueue.
- No `SUPABASE_SERVICE_ROLE_KEY` in browser bundle.

---

## 11. Integration with Existing Modules

| Existing module | Integration |
|---|---|
| `shoot.shoots` | `planner.instances` links `entity_type='shoot'`. `/app/shoots/[id]/schedule` embeds the planner. |
| `shoot.shoot_deliverables` | Imported as phase tasks during `buildSchedule`. |
| `shoot.shot_list` | Tasks under "Production" phase reference shot_list items. |
| `public.crm_deals` | `entity_type='crm_deal'`; CRM pipeline view becomes a kanban planner. |
| `public.campaigns` | `entity_type='campaign'`; campaign timeline becomes planner instance. |
| `public.notifications` | Reused for in-app notifications; extended with `planner_instance_id`. |
| `ai_agent_logs` | Mastra planner tool calls logged here. |

---

## 12. Phased MVP Plan

### Phase 0 — Foundation (weeks 1–2)
- Design final schema, migration, RLS policies, Realtime publication.
- Build planner engine TypeScript package: `app/src/lib/planner/`.
- Seed default workflows: "5-Week Product Shoot", "CRM Pipeline".

### Phase 1 — Timeline UI (weeks 3–4)
- Build `PlannerTimeline` component with week/day lanes.
- Embed planner into `/app/shoots/[id]/schedule`.
- Read-only role filtering.

### Phase 2 — Kanban + Calendar + Role Views (weeks 5–6)
- Add Kanban and Calendar toggles.
- Role-based dashboards and permissions.
- Basic drag-to-update with optimistic UI.

### Phase 3 — Real-Time + Notifications (weeks 7–8)
- Supabase Realtime integration.
- Cloudflare Durable Object presence + Queue notification fan-out.
- Notification center UI.

### Phase 4 — AI Planning (weeks 9–10)
- Mastra tools: `buildSchedule`, `detectScheduleRisks`, `shiftTimeline`, `commitSchedule`.
- CopilotKit chat commands for planner actions.
- HITL approval gates.

### Phase 5 — Workflow Engine v2 (weeks 11–12)
- Dependency auto-shift.
- Gate conditions and approval workflow.
- Export (PDF timeline, ICS).

---

## 13. Linear Task Breakdown (max 8 tasks)

> **These 8 tasks are live in Linear today** under epic [IPI-484](https://linear.app/amo100/issue/IPI-484/production-planner-epic-tracker), IDs **IPI-476–IPI-483** (not IPI-300–307 — this section originally used placeholder IDs written before the tasks were created in Linear; updated 2026-07-09 to match reality). Full specs with acceptance criteria, wiring plans, and verify steps live at `linear/issues/IPI-<id>-PLN-<NNN>-<slug>.md` — read those before starting any task, this table is just a summary.

| Linear ID | Spec file | Title | Scope | Proof |
|---|---|---|---|---|
| **IPI-476** | `IPI-476-PLN-001-planner-schema-reusable-engine-core.md` | Planner schema & reusable engine core | Create `planner` schema, migrations, RLS, default workflows, engine package (`app/src/lib/planner/`). | `npm run supabase:verify-rls`; unit tests pass; engine computes a sample schedule. |
| **IPI-477** | `IPI-477-PLN-002-shoot-production-timeline-template.md` | Shoot production timeline template | Build "5-Week Product Shoot" workflow matching SquareShot stages; seed tasks; link to `shoot.shoots`. | `/app/shoots/[id]/schedule` renders timeline rows for Brief → Product return. |
| **IPI-478** | `IPI-478-PLN-003-hybrid-timeline-kanban-calendar-ui.md` | Hybrid timeline/kanban/calendar UI shell | Reusable `PlannerTimeline`, `PlannerKanban`, `PlannerCalendar`; view toggle; embedded in shoot schedule. | Visual regression of three views; drag interaction smoke test. |
| **IPI-479** | `IPI-479-PLN-004-role-based-views-assignments.md` | Role-based views + assignments | `planner.assignments`, role permissions, "My tasks" dashboard, invite flow. | Role-filtered timeline hides restricted tasks; assignment CRD works. |
| **IPI-480** | `IPI-480-PLN-005-real-time-sync-cloudflare-do.md` | Real-time sync via Supabase + Cloudflare DO | Realtime subscriptions for tasks/events; Durable Object WebSocket for presence/cursors. | Two browsers see drag updates <1s; presence list shows active users. |
| **IPI-481** | `IPI-481-PLN-006-notification-rules-cloudflare-queue.md` | Notification rules + Cloudflare Queue fan-out | `planner.notification_rules`, in-app notifications, Queue Worker for email/push. | Trigger a phase transition; receive in-app + email within 60s. |
| **IPI-482** | `IPI-482-PLN-007-mastra-planner-ai-tools-hitl.md` | Mastra planner AI tools + CopilotKit HITL | Add tools to `production-planner`; chat commands; `commitSchedule` HITL gate. | Agent proposes schedule from brief; approval persists to DB. |
| **IPI-483** | `IPI-483-PLN-008-workflow-engine-dependencies-approvals.md` | Workflow engine v2: dependencies & approvals | Dependency edges, auto-shift on predecessor move, gate conditions, approval workflow. | Moving "Item delivery" shifts dependent tasks; gate blocks phase advance until approved. |

**Status as of 2026-07-09:** IPI-476 is In Progress with 2 open PRs ([#283](https://github.com/amo-tech-ai/lumina-studio/pull/283) schema/RLS, [#284](https://github.com/amo-tech-ai/lumina-studio/pull/284) engine/types/tests), both passing CI. IPI-477–483 are Backlog, correctly blocked on 476 finishing first. See `01-audit.md` for the full verification.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Schema bloat from reusable engine | Start with two concrete workflows (shoot + CRM) and generalize only after both work. |
| Cloudflare DO complexity | Build Phase 3 incrementally: Supabase Realtime first, DO presence second. |
| CopilotKit v2 API drift | Verify against installed `@copilotkit/react-core/v2` types before each tool change. |
| RLS performance on polymorphic queries | Add expression indexes on `(entity_type, entity_id)` and materialized entity names. |
| User confusion from hybrid views | Default view per role; onboarding tooltip tour; persisted user preference. |

---

## 15. Next Step

This section used to say "convert this plan into `docs/linear/issues/IPI-300.md`–`IPI-307.md`, then start IPI-300." That already happened — one level further than described — so here's where things actually stand and what to do from here:

- **The specs already exist.** They're at `linear/issues/IPI-476-PLN-001-...md` through `IPI-483-PLN-008-...md` (note: `linear/issues/`, not `docs/linear/issues/` — the doc's old path was wrong). Each one has the full task-lifecycle template: user story, acceptance criteria, exact files to touch, and verify steps.
- **IPI-476 (the first task) is already being built.** It has 2 open pull requests, both passing CI: schema/RLS ([#283](https://github.com/amo-tech-ai/lumina-studio/pull/283)) and the engine/types/tests ([#284](https://github.com/amo-tech-ai/lumina-studio/pull/284)). It just needs to be merged.
- **What to actually do next:**
  1. Get IPI-476's two PRs reviewed and merged (its SLA is tight — check Linear before starting anything else).
  2. Before touching IPI-478 (the UI shell task), get Claude Design screens made for the 3 new Planner pages — none exist yet, unlike every other screen in this app. See `01-audit.md` §6 for exactly which screens and suggested names.
  3. Then work IPI-477 → 483 in the order shown in the table above (§13) — each spec file lists what blocks it.

If you're picking this up fresh: start by reading `linear/issues/IPI-476-PLN-001-...md`, not this plan doc — this file is the original design sketch, the Linear spec files are what's actually being built from.
