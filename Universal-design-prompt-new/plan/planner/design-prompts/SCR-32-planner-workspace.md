# SCR-32 · Planner Workspace

**Route:** `/app/planner/[instanceId]` (also embeds into `/app/shoots/[id]/schedule`)
**Backing specs:** `linear/issues/IPI-478-PLN-003-hybrid-timeline-kanban-calendar-ui.md` (this screen), `IPI-483-PLN-008-...md` (dependency lines, later), `IPI-477-...md` (data it renders), `IPI-480-...md` (presence bar, later)
**Read first:** `00-review-and-conventions.md` in this folder — component inventory and token table.

---

## Claude Design prompt

> Design the **Planner Workspace** for iPix — a hybrid Timeline / Kanban / Calendar / List view for managing a fashion shoot's production schedule (a "5-Week Product Shoot": Brief confirmation → Casting → Soft hold → Item delivery → Outfit confirmation → Payment & Scheduling → Awaiting shoot → Production → Retouching → Final approval → Product return).
>
> This is **not a new app** — it's one more screen in the existing iPix operator workspace. Match `DESIGN.md`'s v3 "Zeely Editorial" system exactly: pure white/grey/black, Inter, black primary actions, no orange, no beige, hairline borders not shadows, Geist Mono for all numbers and dates. Use the same 3-panel shell (`56px NavSidebar / 1fr Workspace / 340px IntelligencePanel`) as every other screen.
>
> **Reuse directly, do not redesign:** `NavSidebar`, `PageHeader`, `IntelligencePanel` (keep its fixed content order: context → insights → evidence → approvals → conversation), `PersistentChatDock`, `FilterBar` (for the view toggle), `StatusChip`, `ApprovalCard` (for gate approvals), `EmptyState`, `SkeletonLoader`.
>
> **Follow this design system's existing patterns for two of the four views:** the **Kanban** view should look and behave like `Pages/SCR-30-CRM-Pipeline.dc.html` — column header with colored dot + label + count + monospace total, cards with company-equivalent title + monospace value-equivalent + status chip, and a locked/gated column treatment (amber banner: "Enter via approval only") for phases with an approval gate. The **Calendar** view uses the shadcn `Calendar` primitive with multi-day event bars, not a custom grid.
>
> **What's genuinely new:** the **Timeline** view (a Gantt-style chart — no existing screen in this library has one). Design it to feel like it belongs: phase/task bars are pill-shaped, borders not fills, status communicated by border color only (grey = not started, black/solid = in progress, green check = done, amber = at risk, red = blocked) — never a rainbow of phase colors. Week/day column headers in Geist Mono. Today marker is a thin black vertical line, not a colored column.
>
> Toolbar holds: instance name + status chip (in `PageHeader`), the 4-way view toggle (`FilterBar` pattern), a role/assignee filter, and a "Today" jump button. Clicking any task/phase bar or card opens the same `TaskDetailDrawer` (shadcn `Sheet`) regardless of which view you're in — one shared drawer, not four.
>
> Do not invent a new color system, a new card shape, or a new nav pattern. If you're About to draw something not listed in the component inventory below, check `Pages/` and `components/` first — most of what this screen needs already exists somewhere in this app.

---

## Component inventory

| Element | Reused from | New? |
|---|---|---|
| Shell (nav / workspace / intelligence panel) | `OperatorShell.dc.html` pattern | No |
| Toolbar view toggle (Timeline/Kanban/Calendar/List) | `FilterBar.dc.html` | No |
| Page header (instance name, status, primary action) | `PageHeader.dc.html` | No |
| Task/phase status chip | `StatusChip.dc.html` (new status enum values added) | No — extended |
| Timeline Gantt bars + week/day header | — | **Yes** |
| Kanban columns + cards + gated-column banner | `Pages/SCR-30-CRM-Pipeline.dc.html` pattern | No — reskinned |
| Calendar grid + multi-day bars | shadcn `Calendar` primitive | Partially — event-bar overlay is new, grid is not |
| Task detail drawer | shadcn `Sheet` | Reuses a primitive, new composite |
| Gate approval card | `ApprovalCard.dc.html` (full variant) | No |
| AI chat dock | `PersistentChatDock.dc.html` | No |
| Intelligence panel (plan health, at-risk tasks, suggestions) | `IntelligencePanel.dc.html` pattern, new content | No — reskinned |
| Empty state ("select a workflow template") | `EmptyState.dc.html`, preview-photo variant | No |
| Loading skeletons | `SkeletonLoader.dc.html` — `line` for Kanban cards, new `bar` variant for Timeline | Mostly no — one new skeleton variant |
| Dependency lines (SVG) | — | Yes, but out of scope until IPI-483 |
| Presence bar (active viewers) | Avatar-with-dot treatment from `NavSidebar` | Yes, but out of scope until IPI-480 |

## Responsive layouts

| Breakpoint | Behavior |
|---|---|
| Desktop (>1280px) | Full 3-panel shell. Timeline shows all weeks with horizontal scroll if the plan exceeds viewport width. |
| Tablet (768–1280px) | IntelligencePanel collapses into the `BottomSheet` pattern (same as every other screen). Timeline keeps horizontal scroll; Kanban keeps horizontal scroll across columns. |
| Mobile (<768px) | Per IPI-478 acceptance criteria F: defaults to the Role Dashboard (SCR-33), not this screen. If a user deep-links here on mobile, Timeline reflows to a **vertical list grouped by week** (not a squeezed Gantt); Kanban becomes one column at a time with a stage-accordion switcher (same reflow `SCR-MOBILE-CRM-Gallery.dc.html` already uses for the CRM Pipeline). |

## States

| State | Design |
|---|---|
| Empty (no instance yet) | `EmptyState` — faded preview of a populated timeline, "Select a workflow template to generate the timeline", primary CTA, one AI-suggestion line below (per `DESIGN.md` §5G). |
| Loading | `SkeletonLoader` bars/cards at the exact shape of the eventual content — never a spinner. |
| Success | Rendered bars/cards/events with tooltips on hover (owner + dates). |
| Not found / no access | Amber inline banner using `--warning` border, not a full-page block: "Plan not found or access denied." |
| Error | Red (`--blocked`) inline banner + retry button. |
| Read-only role | Drag handles hidden; clicking a task opens the drawer in view-only mode (no edit controls) — do not grey out the whole screen, just remove the affected controls. |
| Approval gate active | A small diamond/lock badge on the relevant bar or column; clicking opens the `ApprovalCard` full variant, not a separate modal design. |

## Accessibility notes

- Every Timeline bar and Kanban card is a real focusable element (`tabindex=0` or a native `button`), not a `div` with an `onClick` — announces phase/task name, dates, and status on focus.
- Color is never the only status signal: pair every status border color with an icon or text label (per `DESIGN.md` §5A — this app already avoids color-only status everywhere else).
- Drag interactions (resize/move a Timeline bar, move a Kanban card) need a non-drag alternative: an "Edit dates" form inside the `TaskDetailDrawer`.
- Respect `prefers-reduced-motion` for any bar-resize or card-move animation — the `SkeletonLoader` component already does this (see its shimmer keyframe guard); match that pattern.
- Gated/locked Kanban columns need `aria-disabled` semantics on the column, not just a visual lock icon.

## Interaction notes

- View toggle persists per user (`planner.view_configs.default_view`) — switching views should feel instant (same data, different renderer), not a route change with a loading flash.
- Clicking any task/phase surface in any of the 4 views opens the **same** `TaskDetailDrawer` — build one component, not four.
- The AI chat dock's greeting is context-aware to the open instance (per `DESIGN.md` §5I) — e.g. *"You're viewing Summer Lookbook's production plan. 2 tasks need your approval."* — never a generic "How can I help?".
- Hover tooltips on Timeline bars show owner + exact dates without requiring a click — this is a discovery aid, not a required interaction path (everything it shows is also in the drawer).

## Implementation notes

*References only — not additional design work.*

- **Related Linear:** `IPI-478` (this screen) · `IPI-483` (dependency lines, later) · `IPI-482` (AI tools behind the chat dock)
- **Blocked by:** `IPI-476` (schema/engine) · `IPI-477` (5-week template data)
- **Unblocks:** `IPI-479` (role filtering) · `IPI-480` (presence/real-time)
- **React components:** `app/src/components/planner/PlannerTimeline.tsx`, `PlannerKanban.tsx`, `PlannerCalendar.tsx`, `TaskDetailDrawer.tsx`, `PlannerViewShell.tsx`
- **Supabase tables:** `planner.tasks`, `planner.phases`, `planner.dependencies`, `planner.instances`
- **Mastra tools:** none directly (this view is read-only); the chat dock invokes `production-planner`'s tools per `IPI-482`

## Definition of done

- [ ] Desktop / tablet / mobile layouts per §"Responsive layouts"
- [ ] Full keyboard navigation (every bar/card/chip focusable, documented keyboard equivalents for drag)
- [ ] Empty, loading, error, and not-found states designed
- [ ] Read-only role variant (no drag handles, view-only drawer)
- [ ] Approval-gate state (diamond badge + `ApprovalCard` full variant)
- [ ] Accessibility: color-independent status, `aria-disabled` on gated Kanban columns, `prefers-reduced-motion` respected

## Future (explicitly deferred — no Linear issue backs these today)

A Dependency Inspector, Planner Analytics, and a dedicated Activity Timeline visualization were considered and rejected for this pass. Revisit only if a real issue is opened for them — do not pre-build.
