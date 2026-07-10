# Planner Timeline — Workspace Layout & Data Flow

**Purpose:** Show the Planner Workspace's 3-panel shell, where the Timeline view sits inside it, and which `planner.*` tables feed it.

## Explanation

Adapted from `Universal-design-prompt-new/plan/design-prompts/diagrams.md` §4 ("Planner Workspace layout"). This is **design-only** — `SCR-32-planner-workspace.md` is a Claude Design prompt; no route, component, or hook exists yet (`app/src/components/planner/`, `app/src/app/(operator)/app/planner/` are both absent from the repo, confirmed by directory search). `IPI-478`'s technical notes name the data source (`use-planner-instance.ts` hook reading `planner.tasks`, `planner.phases`, `planner.dependencies` with a Realtime subscription) even though that hook doesn't exist yet either — added here so the layout diagram also documents where its data will come from once built.

## Diagram

```mermaid
flowchart TD
    Root["grid-template-columns: 56px minmax(0,1fr) 340px — NOT BUILT, SCR-32 design spec only"]
    Root --> Nav["NavSidebar (56px collapsed / 224px expanded) — existing component, reused"]
    Root --> Main["Workspace column"]
    Root --> Intel["IntelligencePanel (340px) — existing component, reused, content reskinned"]

    Main --> Toolbar["Toolbar: PageHeader + FilterBar view toggle + role filter + Today button"]
    Main --> ViewArea["View area (Timeline | Kanban | Calendar | List — one visible at a time)"]
    Main --> Dock["PersistentChatDock (pinned to bottom) — existing component, reused"]

    ViewArea -->|Timeline selected| Timeline["PlannerTimeline — Gantt bars, IPI-478 AC A — NOT BUILT, no visual pattern exists elsewhere in the design library"]

    Timeline -.reads.-> Hook["use-planner-instance.ts hook — NOT BUILT (IPI-478)"]
    Hook -.queries.-> Tasks["planner.tasks (start_date, end_date, status) — schema WRITTEN, in-PR"]
    Hook -.queries.-> Phases["planner.phases (order_index, default_duration_days) — schema WRITTEN, in-PR"]
    Hook -.queries.-> Deps["planner.dependencies — schema WRITTEN, in-PR; DependencyLine rendering is IPI-483, out of scope for first Timeline ship"]
    Hook -.subscribes.-> RT["Supabase Realtime channel planner:&lt;instance_id&gt; — IPI-480, not started"]

    ViewArea -.click any task/bar.-> Drawer["TaskDetailDrawer slides over from the right, above IntelligencePanel — shadcn Sheet, NOT BUILT"]

    Intel --> IntelOrder["Fixed content order: context → AI insights → evidence → pending approvals → conversation"]
```

## Related Linear issues

- `IPI-478` (Hybrid timeline/kanban/calendar UI shell — not started; this diagram is its target-state layout)
- `IPI-480` (Realtime subscription the hook will use — not started)
- `IPI-483` (DependencyLine connectors on the Timeline — out of scope for the first ship)

## Related PRD section

`prd.md` §6.7 (target routes: `/app/planner/[instanceId]`, `SCR-32`)
