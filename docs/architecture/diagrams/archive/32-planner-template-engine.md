# Planner Template Engine — Workflow → Schedule Generation

**Purpose:** Show how a workflow template (e.g. "5-Week Product Shoot") turns into a concrete instance's phases/tasks, and the real shape of the `PlannerEngine` class that does the calculation.

## Explanation

Backend only — `app/src/lib/planner/engine.ts` and `types.ts` already exist in the working tree (matching `IPI-476`'s open PR #284) and were read directly to verify method signatures. The class diagram below is corrected against that real code, not just the design-time spec: `PlannerEngine` has no `createInstance` method — instance creation is a DB `INSERT` (out of scope for a pure, no-DB-write engine per `IPI-476`'s own constraint), so it must live in the caller (an edge function), not the engine. The Gantt chart's phase durations are verified against `IPI-477`'s acceptance criterion B and match exactly. No UI renders any of this yet (`IPI-478` not started).

## Diagram

```mermaid
sequenceDiagram
    participant Op as Producer
    participant UI as ShootScheduleTab (NOT BUILT)
    participant Edge as seed-shoot-plan (NOT BUILT)
    participant Engine as PlannerEngine.buildSchedule (WRITTEN, in-PR)
    participant PG as Postgres (planner.* — in-PR)

    Op->>UI: Open /app/shoots/[id]/schedule
    UI->>Edge: createInstanceIfMissing(shootId)
    Edge->>PG: SELECT planner.instances WHERE entity_id = shootId (idempotency check)
    alt instance already exists
        PG-->>Edge: existing instance + tasks
    else no instance yet
        Edge->>PG: INSERT planner.instances
        Edge->>Engine: buildSchedule(phases, params)
        Engine-->>Edge: proposed tasks + finish_to_start dependencies (pure calc, no DB writes)
        Edge->>PG: INSERT planner.tasks + planner.dependencies
    end
    PG-->>Edge: tasks created
    Edge-->>UI: instance + tasks
    UI-->>Op: timeline rows rendered
```

```mermaid
gantt
    title 5-Week Product Shoot Timeline (SquareShot pattern) — durations verified against IPI-477 AC B
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Pre-Production
    Brief confirmation      :done, a1, 2026-08-01, 3d
    Casting                 :active, a2, after a1, 4d
    Soft hold on shoot date :a3, after a2, 2d
    Item delivery           :a4, after a3, 4d
    Outfit confirmation     :a5, after a4, 3d

    section Logistics
    Payment & Scheduling    :a6, after a5, 3d
    Awaiting shoot          :a7, after a6, 3d

    section Production
    Production              :crit, a8, after a7, 4d

    section Post-Production
    Retouching starts       :milestone, m1, after a8, 0d
    Retouching              :a9, after m1, 3d
    Retouching ends         :milestone, m2, after a9, 0d
    Final approval          :a10, after m2, 2d
    Product return          :a11, after a10, 2d
```

```mermaid
classDiagram
    class PlannerEngine {
        +buildSchedule(phases, params) BuildScheduleResult
        +shiftTask(taskId, deltaDays, tasks, dependencies) ShiftResult
        +detectCycles(dependencies) string[][]
        +checkGate(instance, phase, tasks, assignments, userId) GateResult
        +resolveDependencies(taskId, dependencies) ResolveResult
        +getEffectivePermissions(userId, assignments) PermissionResult
    }
    note for PlannerEngine "No createInstance method in the real code — instance INSERT happens in the caller (edge function), not the engine, per IPI-476's own 'no DB writes' constraint. IPI-476's AC and the original class diagram both list createInstance; that line is aspirational, not implemented."

    class Workflow {
        +UUID id
        +String name
        +String category
        +Int version
        +Jsonb schema
        +Phase[] phases
    }

    class Phase {
        +UUID id
        +String slug
        +String name
        +Int orderIndex
        +Int defaultDurationDays
        +String gateType
        +String requiredRole
    }

    class Instance {
        +UUID id
        +String entityType
        +UUID entityId
        +PlannerInstanceStatus status
        +Date plannedStart
        +Date plannedEnd
        +Task[] tasks
    }

    class Task {
        +UUID id
        +String title
        +Date startDate
        +Date endDate
        +Int durationDays
        +PlannerTaskStatus status
        +String priority
        +UUID assigneeUserId
        +String assigneeRole
    }

    class Dependency {
        +UUID fromTaskId
        +UUID toTaskId
        +DependencyType depType
        +Int lagDays
    }

    PlannerEngine --> Workflow : uses
    PlannerEngine --> Instance : calculates against
    Workflow "1" --> "*" Phase : contains
    Instance "1" --> "*" Task : has
    Task "1" --> "*" Dependency : participates
```

## Related Linear issues

- `IPI-476` (engine core — in PR, verified against real `engine.ts`/`types.ts`)
- `IPI-477` (5-Week Product Shoot template — durations verified exact match)

## Related PRD section

`prd.md` §6.7 (acceptance criteria table, `IPI-476`/`IPI-477` rows) and §7 (`planner.*` schema)
