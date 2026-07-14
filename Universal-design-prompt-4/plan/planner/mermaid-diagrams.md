# iPix Production Planner — Mermaid Diagrams

**Output folder:** `Universal-design-prompt-new/plan/planner/`  
**Companion docs:** `architecture-plan.md`, `wireframes.md`

Each diagram is rendered as a fenced Mermaid block. Validate syntax at https://mermaid.live before committing.

---

## 1. C4 Container — Planner System Architecture

```mermaid
C4Container
    title iPix Production Planner — Container Diagram

    Person(operator, "Operator User", "Producer, photographer, retoucher, client approver")
    Person(admin, "Org Admin", "Manages workflows and membership")

    Container_Boundary(browser, "Browser / Next.js App") {
        Container(spa, "Operator SPA", "Next.js 16 + React", "Planner UI, chat dock, notifications")
    }

    Container_Boundary(vercel, "Vercel Edge / Serverless") {
        Container(nextapi, "Next.js API Routes", "TypeScript", "/api/copilotkit, /api/planner/*")
        Container(mastra, "Mastra Runtime", "TypeScript", "production-planner agent + tools")
    }

    Container_Boundary(cloudflare, "Cloudflare Edge") {
        Container(gateway, "planner-gateway Worker", "Workers", "WebSocket upgrade + notify webhook")
        Container(do, "planner-coordinator DO", "Durable Objects", "Per-instance presence + cursor sync")
        Container(queue, "planner-notify Queue", "Queues", "Notification fan-out buffer")
        Container(notifyworker, "planner-notify Worker", "Workers", "Email / SMS / push delivery")
        Container(kv, "planner-cache KV", "KV", "Hot view cache")
        Container(aiworker, "planner-ai Worker", "Workers AI", "Urgency scoring + summarization")
    }

    Container_Boundary(supabase, "Supabase") {
        ContainerDb(postgres, "Postgres", "PostgreSQL", "planner.* + shoot.* + public.* tables")
        Container(realtime, "Supabase Realtime", "Realtime", "DB change streaming")
        Container(edge, "Edge Functions", "Deno", "schedule-shoot-plan, notify enqueue")
    }

    Rel(operator, spa, "Plans shoots, approves gates")
    Rel(admin, spa, "Configures workflows & roles")
    Rel(spa, nextapi, "HTTPS / JSON")
    Rel(spa, realtime, "subscribe planner:<instance_id>")
    Rel(spa, gateway, "WSS / presence")
    Rel(gateway, do, "route to instance DO")
    Rel(nextapi, mastra, "in-process agent calls")
    Rel(mastra, postgres, "READ via RLS")
    Rel(mastra, edge, "WRITE via HITL-approved edge function")
    Rel(edge, queue, "enqueue notification")
    Rel(queue, notifyworker, "fan out")
    Rel(notifyworker, postgres, "mark delivered")
    Rel(spa, kv, "cached templates & views")
    Rel(spa, aiworker, "summarize / score")
```

---

## 2. Entity Relationship — Planner Domain

```mermaid
erDiagram
    ORG ||--o{ PLANNER_WORKFLOW : owns
    ORG ||--o{ PLANNER_INSTANCE : runs
    PLANNER_WORKFLOW ||--|{ PLANNER_PHASE : contains
    PLANNER_PHASE ||--o{ PLANNER_GATE_CONDITION : guards
    PLANNER_INSTANCE ||--|| PLANNER_WORKFLOW : uses
    PLANNER_INSTANCE ||--o{ PLANNER_TASK : has
    PLANNER_INSTANCE ||--o{ PLANNER_DEPENDENCY : has
    PLANNER_INSTANCE ||--o{ PLANNER_ASSIGNMENT : members
    PLANNER_INSTANCE ||--o{ PLANNER_EVENT : records
    PLANNER_INSTANCE ||--o{ PLANNER_VIEW_CONFIG : prefs
    PLANNER_PHASE ||--o{ PLANNER_TASK : groups
    PLANNER_TASK ||--o{ PLANNER_DEPENDENCY : from
    PLANNER_TASK ||--o{ PLANNER_DEPENDENCY : to
    USER ||--o{ PLANNER_ASSIGNMENT : assigned
    USER ||--o{ PLANNER_TASK : owns
    USER ||--o{ PLANNER_VIEW_CONFIG : configures
    PLANNER_WORKFLOW ||--o{ PLANNER_NOTIFICATION_RULE : rules

    ORG {
        uuid id PK
        string name
    }

    PLANNER_WORKFLOW {
        uuid id PK
        uuid org_id FK
        string name
        string category
        int version
        jsonb schema
        boolean is_default
    }

    PLANNER_PHASE {
        uuid id PK
        uuid workflow_id FK
        string slug
        string name
        int order_index
        int default_duration_days
        string gate_type
        string required_role
    }

    PLANNER_GATE_CONDITION {
        uuid id PK
        uuid phase_id FK
        string condition_type
        jsonb condition
    }

    PLANNER_INSTANCE {
        uuid id PK
        uuid org_id FK
        uuid workflow_id FK
        string entity_type
        uuid entity_id
        string name
        string status
        date planned_start
        date planned_end
        uuid owner_user_id FK
    }

    PLANNER_TASK {
        uuid id PK
        uuid instance_id FK
        uuid phase_id FK
        uuid parent_task_id FK
        string title
        text description
        date start_date
        date end_date
        int duration_days
        string status
        string priority
        uuid assignee_user_id FK
        string assignee_role
    }

    PLANNER_DEPENDENCY {
        uuid id PK
        uuid instance_id FK
        uuid from_task_id FK
        uuid to_task_id FK
        string type
        int lag_days
    }

    PLANNER_ASSIGNMENT {
        uuid id PK
        uuid instance_id FK
        uuid user_id FK
        string role
        jsonb permissions
    }

    PLANNER_EVENT {
        uuid id PK
        uuid instance_id FK
        uuid task_id FK
        uuid actor_user_id FK
        string event_type
        jsonb payload
        timestamp created_at
    }

    PLANNER_VIEW_CONFIG {
        uuid id PK
        uuid user_id FK
        uuid instance_id FK
        string default_view
        jsonb filters
        jsonb columns
    }

    PLANNER_NOTIFICATION_RULE {
        uuid id PK
        uuid org_id FK
        uuid workflow_id FK
        string event_type
        string role
        string channel
        string template_ref
        int delay_minutes
        boolean is_active
    }

    USER {
        uuid id PK
        string email
    }
```

---

## 3. State Diagram — Planner Instance Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: create_instance
    Draft --> Planned: generate_schedule
    Planned --> Active: start_first_task
    Active --> Blocked: gate_blocks
    Blocked --> Active: gate_approved
    Active --> AtRisk: risk_detected
    AtRisk --> Active: risk_resolved
    Active --> Completed: final_task_done
    Completed --> Archived: archive
    Archived --> [*]
    Draft --> Cancelled: cancel
    Planned --> Cancelled: cancel
    Active --> Cancelled: cancel
    Cancelled --> [*]
```

---

## 4. Sequence Diagram — Real-Time Update Flow

```mermaid
sequenceDiagram
    actor U1 as User A (Producer)
    actor U2 as User B (Photographer)
    participant SPA as Next.js SPA
    participant RT as Supabase Realtime
    participant PG as Postgres
    participant DO as planner-coordinator DO
    participant GW as planner-gateway Worker

    U1->>SPA: Drag task "Production" to Day 18
    SPA->>PG: UPDATE planner.tasks (RLS)
    PG-->>RT: change event
    RT-->>SPA: push updated task
    SPA-->>U1: render new position

    RT-->>SPA: push updated task (User B subscription)
    SPA-->>U2: render new position

    SPA->>GW: send cursor position
    GW->>DO: broadcast presence
    DO-->>GW: presence list
    GW-->>SPA: show "Maya is viewing Production"
    SPA-->>U2: presence indicator
```

---

## 5. Flowchart — AI Schedule Generation with HITL

```mermaid
flowchart TD
    A[User asks agent: "Build a 5-week schedule for Summer Lookbook"] --> B[Mastra production-planner agent]
    B --> C[Tool: buildSchedule]
    C --> D[Read workflow template + deliverables]
    D --> E[Generate proposed tasks + dependencies]
    E --> F[Return draft to chat]
    F --> G{User approves?}
    G -->|Yes| H[Tool: commitSchedule]
    H --> I[Edge function: schedule-shoot-plan]
    I --> J[INSERT planner.tasks + dependencies]
    J --> K[Notify subscribers]
    G -->|No| L[User edits / cancels]
    L --> M[Agent revises draft]
    M --> F
```

---

## 6. Sequence Diagram — Notification Fan-Out

```mermaid
sequenceDiagram
    participant Task as planner.tasks UPDATE
    participant Edge as schedule-shoot-plan edge function
    participant PG as Postgres
    participant Queue as planner-notify Queue
    participant Worker as planner-notify Worker
    participant SES as Email provider
    participant FCM as Push provider

    Task->>Edge: phase transition detected
    Edge->>PG: INSERT public.notifications
    Edge->>PG: SELECT planner.notification_rules
    Edge->>Queue: enqueue notification job
    Queue->>Worker: deliver job
    Worker->>PG: fetch notification + user prefs
    Worker->>SES: send email
    Worker->>FCM: send push
    Worker->>PG: update delivery_status
```

---

## 7. Gantt Chart — 5-Week Product Shoot Timeline

```mermaid
gantt
    title 5-Week Product Shoot Timeline (SquareShot pattern)
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

---

## 8. Flowchart — Dependency Auto-Shift

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

## 9. Class Diagram — Planner Engine Types

```mermaid
classDiagram
    class PlannerEngine {
        +createInstance(workflowId, entity, startDate)
        +buildSchedule(instanceId)
        +shiftTask(taskId, deltaDays)
        +resolveDependencies(taskId)
        +checkGate(instanceId, phaseId)
        +getEffectivePermissions(userId, instanceId)
    }

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
        +String status
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
        +String status
        +String priority
        +UUID assigneeUserId
        +String assigneeRole
    }

    class Dependency {
        +UUID fromTaskId
        +UUID toTaskId
        +String type
        +Int lagDays
    }

    PlannerEngine --> Workflow : uses
    PlannerEngine --> Instance : manages
    Workflow "1" --> "*" Phase : contains
    Instance "1" --> "*" Task : has
    Task "1" --> "*" Dependency : participates
```

---

## 10. User Journey — Producer Schedules a Shoot

```mermaid
journey
    title Producer schedules a 5-week shoot
    section Create plan
      Open shoot schedule: 5: Producer
      Generate AI schedule: 4: Producer, AI Agent
      Review proposed timeline: 4: Producer
      Approve schedule: 5: Producer
    section Execute
      Invite team members: 4: Producer
      Monitor phase transitions: 4: Producer
      Resolve blocker: 3: Producer, Photographer
      Approve final delivery: 5: Client approver
    section Wrap
      Archive instance: 5: Producer
```

---

## 11. Block Diagram — Cloudflare Edge Components

```mermaid
block-beta
    columns 3
    spa["Next.js SPA"]:3
    gateway["planner-gateway Worker"]
    do["planner-coordinator DO"]
    kv["planner-cache KV"]
    queue["planner-notify Queue"]
    notify["planner-notify Worker"]
    ai["planner-ai Worker"]

    spa --> gateway
    gateway --> do
    gateway --> queue
    queue --> notify
    spa --> kv
    spa --> ai
```

---

## 12. Requirement Diagram — Planner Compliance

```mermaid
requirementDiagram
    requirement ReusableEngine {
        id: 1
        text: One planner engine powers shoots, campaigns, and CRM deals.
        risk: medium
        verifymethod: test
    }

    requirement HybridViews {
        id: 2
        text: Timeline, kanban, and calendar views share one data model.
        risk: low
        verifymethod: test
    }

    requirement RoleBased {
        id: 3
        text: Views and permissions are filtered by user role.
        risk: medium
        verifymethod: inspection
    }

    requirement Realtime {
        id: 4
        text: Multiple users see updates in under one second.
        risk: high
        verifymethod: test
    }

    requirement HITL {
        id: 5
        text: AI schedule commits require explicit human approval.
        risk: high
        verifymethod: demonstration
    }

    ReusableEngine <- satisfies - HybridViews
    HybridViews <- satisfies - RoleBased
    RoleBased <- satisfies - Realtime
    Realtime <- satisfies - HITL
```
