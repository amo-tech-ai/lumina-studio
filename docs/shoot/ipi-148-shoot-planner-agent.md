# IPI-148 — SHOOT-AI-001: Shoot Planner Agent

`production-planner` wired with 7 shoot-specific tools. Route `/app/shoots/*` → agent via IPI-51 route map.

## Tool execution chain

```mermaid
sequenceDiagram
    participant Op as Operator (Browser)
    participant CK as CopilotKit /api/copilotkit
    participant PA as production-planner (in-process)
    participant T as Shoot Tool
    participant EF as Supabase Edge Fn
    participant DB as shoot.* (Postgres)

    Op->>CK: Chat message / tool trigger
    CK->>PA: AG-UI stream
    PA->>T: Tool call (Mastra createTool)
    alt READ tool (recommend / plan / generate / estimate / explain)
        T-->>PA: Computed result (no DB write)
    else WRITE tool (saveApprovedShootDraft / approveShotList)
        T->>EF: POST via callEdgeFunction()
        EF->>DB: INSERT with service_role + RLS
        EF-->>T: { shoot_id / shot_ids }
        T-->>PA: Result
    end
    PA-->>CK: Tool result + next message
    CK-->>Op: Rendered response
```

## Shoot status lifecycle

```mermaid
stateDiagram-v2
    [*] --> draft : operator starts intake
    draft --> pending_review : saveApprovedShootDraft (HITL gate 1)
    pending_review --> approved : approveShotList (HITL gate 2)
    pending_review --> draft : operator rejects → edits
    approved --> in_progress : shoot begins
    in_progress --> wrap : shoot complete
    wrap --> delivered : assets delivered
    delivered --> archived : archival
    approved --> cancelled
    in_progress --> cancelled
```

## generateShotListDraft — deliverables-first invariant

```mermaid
flowchart TD
    Start([Tool called]) --> Validate{approved_deliverables\n.length >= 1?}
    Validate -->|No| ZodErr["❌ Zod error\napproved_deliverables.min(1)\nHITL gate not yet passed"]
    Validate -->|Yes| Gen[Generate shot list rows\nfrom approved deliverables]
    Gen --> Link[Every shot links to ≥1 deliverable_id]
    Link --> Flag{Uncovered\ndeliverables?}
    Flag -->|Yes| Warn[Flag uncovered deliverables\nin result.warnings]
    Flag -->|No| Out
    Warn --> Out([Return ShotListDraft])
```

## Tool registry

```mermaid
flowchart LR
    subgraph "agentTools (index.ts)"
        R1[recommendShootType]
        R2[planDeliverables]
        R3[generateShotListDraft]
        R4[estimateShootBudget]
        R5[explainShootDnaAlerts]
        W1[saveApprovedShootDraft]
        W2[approveShotList]
    end
    subgraph "production-planner agent"
        A[Agent]
    end
    A --> agentTools
    W1 -->|callEdgeFunction| EF1[save-approved-shoot-draft]
    W2 -->|callEdgeFunction| EF2[approve-shot-list]
```
