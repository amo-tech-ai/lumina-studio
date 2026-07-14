# iPix Production Planner — Wireframe Descriptions

**Output folder:** `Universal-design-prompt-new/plan/planner/`  
**Companion doc:** `architecture-plan.md`  
**Style:** Lo-fi / spec-table wireframes for handoff to production implementation.  
**Design system:** iPix v3 "Zeely Editorial" — pure white / light-grey / charcoal / black, **Inter** typography, black primary actions, editorial fashion photography as the visual element (see `Universal-design-prompt5/DESIGN.md`). *(Corrected 2026-07-09 — this line previously described the retired v2 "Atelier" palette: serif headings, off-white `#FBF8F5`, orange `#E87C4D`. That system was superseded before any Planner screen was built; don't design against it.)*

---

## 1. Screen Inventory

| # | Screen | Route | Primary user goal |
|---|---|---|---|
| 1 | Planner Hub | `/app/planner` | See all active plans and "My tasks this week". |
| 2 | Planner Workspace — Timeline | `/app/planner/[instanceId]?view=timeline` | View and manipulate the 5-week shoot timeline. |
| 3 | Planner Workspace — Kanban | `/app/planner/[instanceId]?view=kanban` | Move tasks across phases; focus on status. |
| 4 | Planner Workspace — Calendar | `/app/planner/[instanceId]?view=calendar` | See tasks as calendar events. |
| 5 | Role Dashboard | `/app/planner/dashboard` | Personalized landing per role. |
| 6 | AI Chat / HITL Approval | `OperatorChatDock` + inline gates | Ask agent to reschedule; approve AI proposals. |
| 7 | Notification Center | Dropdown in top bar | Review alerts and navigate to context. |
| 8 | Instance Settings | `/app/planner/[instanceId]/settings` | Manage members, roles, notification rules. |

---

## 2. Wireframe 1 — Planner Workspace (Timeline View)

### Layout

Three-zone operator shell:

```text
+------------------------------------------------------------------+
|  NAV SIDEBAR  |  PLANNER WORKSPACE                                |
|               |  +---------------------------------------------+  |
|  [Logo]       |  | Toolbar: instance name | view toggles | AI  |  |
|  Dashboard    |  +---------------------------------------------+  |
|  Shoots       |  | Sub-toolbar: filters | role selector | today |  |
|  Campaigns    |  +---------------------------------------------+  |
|  CRM          |  |                                                 |
|  Planner      |  |  Timeline grid                                  |
|               |  |  +----------+----------+----------+----------+  |
|  [Chat Dock]  |  |  | WEEK 1   | WEEK 2   | WEEK 3   | WEEK 4   |  |
|               |  |  +----------+----------+----------+----------+  |
|               |  |  | D1 D2 D3 | D4 D5 D6 | D7 D8 D9 | ...      |  |
|               |  |  +----------+----------+----------+----------+  |
|               |  |  Brief confirmation  [====]                     |
|               |  |        Casting         [========]               |
|               |  |          Soft hold       [==]                   |
|               |  |            Item delivery   [========]           |
|               |  |                  Outfit conf [======]           |
|               |  |                       Pay & Sched [=====]       |
|               |  |                            Awaiting shoot [===] |
|               |  |                                       Production|
|               |  |  Retouching starts |                  Retouching|
|               |  |                                       Final appr|
|               |  |                                                Pr|
|               |  |                                                 |
|               |  +---------------------------------------------+  |
|               |  | Detail drawer (collapsible)                   |  |
|               |  +---------------------------------------------+  |
+------------------------------------------------------------------+
|  INTELLIGENCE PANEL (right) — AI suggestions, risks, approvals   |
+------------------------------------------------------------------+
```

### Spec table

| Element | Behavior | Data |
|---|---|---|
| Toolbar view toggles | Timeline / Kanban / Calendar buttons; persists per user in `planner.view_configs`. | `default_view` |
| Week/day header | Fixed top row; horizontal scroll for long plans; current day highlighted in orange. | `planned_start` + `planned_end` |
| Phase/task bars | Pill-shaped bars spanning start/end dates; dashed border = not started, solid = in progress, filled = done, red = blocked/at risk. | `planner.tasks` rows |
| Bar labels | Phase name centered; truncated with ellipsis if too narrow. | `phases.name` / `tasks.title` |
| Dependency lines | SVG lines connecting bar endpoints (future Phase 5). | `planner.dependencies` |
| Row interactions | Hover shows tooltip with owner + dates; click opens detail drawer; drag resizes dates; drag body moves entire task. | — |
| Detail drawer | Right-side slide-over with task metadata, comments, approvals, subtasks. | `tasks.*` + `events.*` |
| AI button in toolbar | Opens `OperatorChatDock` focused on planner agent. | `useAgent({ agentId: 'production-planner' })` |
| Intelligence Panel | Shows "At risk", "Suggested next step", "Pending approvals". | Mastra tool output |

### States

- **Empty instance:** Placeholder overlay "Select a workflow template to generate the timeline" with primary CTA.
- **Read-only role:** Drag handles hidden; drawer shows metadata but no edit controls.
- **Approval gate active:** Bar has a diamond badge; clicking opens HITL approval card.

---

## 3. Wireframe 2 — Kanban View

### Layout

```text
+------------------------------------------------------------------+
|  Planner Workspace — Kanban                                       |
|  Toolbar: same as timeline                                        |
+------------------------------------------------------------------+
|  [Brief]      [Casting]       [Item Delivery]  [Production] ...   |
|  +-------+    +-------+       +-------+         +-------+         |
|  | Brief |    | Cast  |       | Item  |         | Prod  |         |
|  | conf  |    |       |       | deliv |         |       |         |
|  +-------+    +-------+       +-------+         +-------+         |
|  [task]       [task]          [task]            [task]            |
|  [task]       [task]                            [task] [task]     |
|  [+ add]      [+ add]         [+ add]           [+ add]           |
+------------------------------------------------------------------+
```

### Spec table

| Element | Behavior |
|---|---|
| Columns | One per `planner.phases`, ordered by `order_index`. |
| Cards | One per task; shows title, assignee avatar, due date, priority dot, status icon. |
| Drag & drop | Move card across columns → updates `task.phase_id` and `task.status`. If target phase has a gate, prompt HITL approval. |
| Add task | Quick-add button per column; opens inline form. |
| WIP limit hint | Subtle counter on column header (future). |

---

## 4. Wireframe 3 — Calendar View

### Layout

```text
+------------------------------------------------------------------+
|  Planner Workspace — Calendar                                     |
|  Toolbar: same + month/week/day switch                            |
+------------------------------------------------------------------+
|  < July 2026 >                                                    |
|  Su   Mo   Tu   We   Th   Fr   Sa                                 |
|       1    2    3    4    5    6                                  |
|  7    8 |==Casting==|  11   12   13                                |
|  14   15   16   17 |==Item delivery==|  20                         |
|  21   22   23   24   25   26   27                                 |
|  28   29   30   31                                                |
+------------------------------------------------------------------+
```

### Spec table

| Element | Behavior |
|---|---|
| Month/week/day switch | Standard calendar density controls; default from user prefs. |
| Multi-day bars | Tasks spanning multiple days render as continuous bars across cells. |
| Click event | Opens task detail drawer (same component as timeline). |
| Today marker | Orange border on current date cell. |

---

## 5. Wireframe 4 — Role-Based Dashboard

### Layout

```text
+------------------------------------------------------------------+
|  Good morning, Maya — here's your production week                 |
+------------------------------------------------------------------+
|  +----------------+  +----------------------+  +----------------+ |
|  | My Tasks       |  | Needs Approval       |  | At Risk        | |
|  | 8 this week    |  | 2 gates pending      |  | 1 deadline <24h| |
|  +----------------+  +----------------------+  +----------------+ |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Recent plans                                                 |  |
|  | [Summer Lookbook] [CRM — Acme Co] [Fall Campaign] ...        |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  | Upcoming this week (calendar strip)                          |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### Spec table

| Element | Behavior | Role variation |
|---|---|---|
| My Tasks card | Count of tasks assigned to current user across all instances. | Photographer sees shoot tasks; retoucher sees retouching tasks; client sees approval gates. |
| Needs Approval card | Count of gates where current user's role is in `required_role`. | Client approver sees "Final approval"; producer sees budget gate. |
| At Risk card | Tasks with due date <24h or flagged by `detectScheduleRisks`. | All roles. |
| Recent plans | Last 5 instances the user is assigned to. | All roles. |
| Calendar strip | 7-day horizontal timeline of own tasks. | All roles. |

---

## 6. Wireframe 5 — AI Chat / HITL Approval Surface

### Layout

Two contexts:

**A. Chat dock (persistent bottom panel)**

```text
+-------------------------------------------------------------+
|  Planner Agent                                              |
|  ---------------------------------------------------------  |
|  User:  "Move Production 2 days earlier"                    |
|  Agent: "That shifts Final approval to Day 23. Approve?"    |
|  [Preview diff]  [Approve]  [Cancel]                        |
|  ---------------------------------------------------------  |
|  [Type a command...]                                        |
+-------------------------------------------------------------+
```

**B. Inline approval gate card (in detail drawer)**

```text
+----------------------------------+
|  Gate: Final approval             |
|  Required: client_approver        |
|  [View deliverables] [Approve] [Request changes] |
+----------------------------------+
```

### Spec table

| Element | Behavior |
|---|---|
| Natural-language commands | "Move X by N days", "Who is blocked?", "Suggest schedule for this brief", "Approve final delivery". |
| Preview diff | Before-and-after timeline snippet rendered inline in chat. |
| Approve / Cancel | `commitSchedule` tool runs only after explicit approval; cancel returns to planning state. |
| Inline gate card | Shows required role, conditions, attachments, approve/request buttons. |

---

## 7. Wireframe 6 — Notification Center

> **Reuse, don't rebuild.** This already ships as `Pages/SCR-15-Notification-Center.dc.html` (`/app/inbox`). IPI-481's spec scopes the planner work as *extending* it — add planner CTA links and a per-instance mute toggle — not designing it from scratch. The layout below is kept for reference only.

### Layout

```text
+----------------------------------+
|  Notifications        [Mark all]  |
+----------------------------------+
|  [dot] Production started — Summer Lookbook    2m |
|  [dot] Final approval needs your sign-off      1h |
|  [dot] Item delivery deadline tomorrow         5h |
|  [empty] No new notifications                   |
+----------------------------------+
```

### Spec table

| Element | Behavior |
|---|---|
| Bell icon | Badge count of unread `public.notifications` rows. |
| Dropdown | Scrollable list; click navigates to `cta_url`. |
| Mark all read | PATCH unread rows. |
| Real-time | New rows appear via Supabase Realtime subscription. |

---

## 8. Wireframe 7 — Instance Settings

### Layout

```text
+------------------------------------------------------------------+
|  Settings — Summer Lookbook                                       |
|  [Members] [Workflow] [Notifications] [Danger]                    |
+------------------------------------------------------------------+
|  Members                                                          |
|  +-------------------------------------------------------------+  |
|  | Name           | Role           | Permissions       | ...    |  |
|  | Maya           | Producer       | Full              |        |  |
|  | Leo            | Photographer   | Edit own tasks    |        |  |
|  | Client A       | Client approver| Approve gates     |        |  |
|  +-------------------------------------------------------------+  |
|  [Invite member]                                                  |
+------------------------------------------------------------------+
```

### Spec table

| Tab | Content | Status |
|---|---|---|
| Members | CRUD `planner.assignments`; role selector; permission presets + custom JSONB. | **MVP** — IPI-479 acceptance criteria commit to this tab only. |
| Notifications | Toggle rules per event/role/channel. | Ships as a separate `NotificationSettings.tsx` component per IPI-481, not yet confirmed as a tab in this shell. |
| Workflow | View-only workflow template schema (future: swap template version). | **Post-MVP** — not in any current issue's acceptance criteria. |
| Danger | Archive/delete instance; restricted to owner. | **Post-MVP** — not in any current issue's acceptance criteria. |

*(Corrected 2026-07-09 — this table originally showed all 4 tabs as equally in-scope. Only Members is actually acceptance-tested by IPI-479; the design should ship Members now and leave clearly-marked placeholder slots for the rest, not build all four as if approved.)*

---

## 9. Component Library Notes

Re-use existing operator components where possible:

| New component | Reuses |
|---|---|
| `PlannerTimeline` | `TimelineBar`, `HorizontalScroller`, `PillBadge` |
| `PlannerKanban` | `SortableCard`, `BoardColumn` (shadcn board pattern) |
| `PlannerCalendar` | `Calendar` from shadcn/ui + custom multi-day event renderer |
| `TaskDetailDrawer` | `Sheet`, `Avatar`, `Badge`, `CommentThread` |
| `GateApprovalCard` | `Alert`, `Button`, `AttachmentList` |
| `RoleDashboard` | `StatCard`, `PlanCard`, `MiniTimeline` |
| `NotificationCenter` | `Popover`, `ScrollArea`, `Badge` |

### Accessibility requirements

- All interactive bars are keyboard-focusable and announce role/dates.
- Color is not the sole status indicator (icons + text).
- Drag alternatives provided via "Edit dates" form in detail drawer.
- Respect `prefers-reduced-motion` for timeline animations.

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Desktop (>1280px) | Full 3-panel shell: nav, workspace, intelligence panel. |
| Tablet (768–1280px) | Intelligence panel collapses to a drawer; timeline horizontal scroll. |
| Mobile (<768px) | View defaults to role dashboard; timeline becomes vertical list grouped by week; kanban scrolls horizontally. |

---

## 11. Wireframe → Implementation Mapping

| Wireframe | Primary files |
|---|---|
| Planner Hub | `app/src/app/(operator)/app/planner/page.tsx` |
| Planner Workspace | `app/src/app/(operator)/app/planner/[instanceId]/page.tsx` |
| Timeline view | `app/src/components/planner/PlannerTimeline.tsx` |
| Kanban view | `app/src/components/planner/PlannerKanban.tsx` |
| Calendar view | `app/src/components/planner/PlannerCalendar.tsx` |
| Role dashboard | `app/src/app/(operator)/app/planner/dashboard/page.tsx` |
| AI chat surface | `app/src/components/operator/OperatorChatDock.tsx` + Mastra tools |
| Notification center | `app/src/components/notifications/NotificationCenter.tsx` |
| Instance settings | `app/src/app/(operator)/app/planner/[instanceId]/settings/page.tsx` |
