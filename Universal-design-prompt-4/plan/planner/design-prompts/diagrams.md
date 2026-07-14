# Planner Design Prompts — Diagrams

Companion to `00-review-and-conventions.md`, `SCR-32`–`SCR-35`, and `supabase-reference.md`. Validate any edits at https://mermaid.live before committing.

---

## 1. Screen hierarchy

Where the Planner screens sit relative to existing, reused screens.

```mermaid
flowchart TD
    Shell["Operator Shell — NavSidebar / Workspace / IntelligencePanel"]
    Shell --> Hub["SCR-35 · Planner Hub (new)"]
    Shell --> Dashboard["SCR-33 · Planner Dashboard (new)"]
    Shell --> Workspace["SCR-32 · Planner Workspace (new)"]
    Shell --> Settings["SCR-34 · Instance Settings (new)"]
    Shell --> Notif["SCR-15 · Notification Center (existing — extended, not rebuilt)"]
    Shell --> ShootDetail["Shoot Detail (existing) — schedule tab embeds Workspace"]
    Hub -->|open plan| Workspace
    Hub -->|personalized work| Dashboard

    Workspace --> Timeline["Timeline view (new pattern)"]
    Workspace --> Kanban["Kanban view — phase columns (reskin SCR-30)"]
    Workspace --> Calendar["Calendar view (new, shadcn Calendar primitive)"]
    Workspace --> List["List view (table, existing list-screen conventions)"]
    Workspace --> Drawer["TaskDetailDrawer (shared across all 4 views)"]

    Settings --> Members["Members tab (MVP — designed now)"]
    Settings --> Notifications["Notifications tab (placeholder — IPI-481)"]
    Settings --> Workflow["Workflow tab (placeholder — post-MVP)"]
    Settings --> Danger["Danger tab (placeholder — post-MVP)"]
```

---

## 2. User navigation flow

How a producer moves between the 3 new screens plus the reused screens they connect to.

```mermaid
flowchart LR
    Login[Sign in] --> Dashboard["Planner Dashboard\n(SCR-33)"]
    Dashboard -->|click a stat card, e.g. 'At Risk'| Workspace["Planner Workspace\n(SCR-32), pre-filtered"]
    Dashboard -->|click 'Recent plans' card| Workspace
    Dashboard -->|open notification bell| Notif["Notification Center\n(SCR-15, existing)"]
    Notif -->|click a planner notification| Workspace
    Workspace -->|toolbar gear icon| Settings["Instance Settings\n(SCR-34)"]
    Workspace -->|click any task/phase| Drawer["TaskDetailDrawer\n(shared)"]
    Drawer -->|approval gate pending| Approval["ApprovalCard\n(full variant)"]
    Settings -->|Invite member| InviteDialog["Invite Member Dialog"]
    Workspace -->|from Shoot Detail schedule tab| ShootDetail["Shoot Detail\n(existing)"]
    ShootDetail --> Workspace
```

---

## 3. Component hierarchy

What each new screen is actually built from — the reuse accounting from `00-review-and-conventions.md`, as a tree.

```mermaid
flowchart TD
    subgraph SCR32["SCR-32 Planner Workspace"]
        PH1["PageHeader (reused)"]
        FB1["FilterBar → view toggle (reused)"]
        TL["PlannerTimeline (NEW)"]
        KB["PlannerKanban (reskin of SCR-30)"]
        CAL["PlannerCalendar (shadcn Calendar + new event overlay)"]
        LST["PlannerList (existing table conventions)"]
        TDD["TaskDetailDrawer (shadcn Sheet)"]
        AC1["ApprovalCard (reused, full variant)"]
        IP1["IntelligencePanel (reused, reskinned content)"]
        CD1["PersistentChatDock (reused)"]
    end

    subgraph SCR33["SCR-33 Planner Dashboard"]
        GH["Greeting header (SCR-25 pattern)"]
        SC["Stat cards (SCR-25 KPI-grid pattern)"]
        RP["Recent plans row (SCR-25 image-card pattern, 4:3 ratio)"]
        CS["Calendar strip (new small composite)"]
        IP2["IntelligencePanel (reused)"]
        CD2["PersistentChatDock (reused)"]
    end

    subgraph SCR34["SCR-34 Instance Settings"]
        TABS["Tabs (shadcn, reused)"]
        MT["Member table (DESIGN.md §5F table conventions)"]
        RC["Role pill (StatusChip, extended)"]
        DLG["Invite Dialog (shadcn Dialog)"]
        PH2["Placeholder tabs: Notifications / Workflow / Danger"]
    end
```

---

## 4. Planner Workspace layout (SCR-32 specifically)

The 3-panel shell with the toolbar and view area called out — this is what Claude Design should treat as the literal frame.

```mermaid
flowchart TD
    Root["grid-template-columns: 56px minmax(0,1fr) 340px"]
    Root --> Nav["NavSidebar (56px collapsed / 224px expanded)"]
    Root --> Main["Workspace column"]
    Root --> Intel["IntelligencePanel (340px)"]

    Main --> Toolbar["Toolbar: PageHeader + FilterBar view toggle + role filter + Today button"]
    Main --> ViewArea["View area (Timeline | Kanban | Calendar | List — one visible at a time)"]
    Main --> Dock["PersistentChatDock (pinned to bottom, never overlaps IntelligencePanel)"]

    ViewArea -.click any task/bar/card.-> Drawer["TaskDetailDrawer slides over from the right, above IntelligencePanel"]

    Intel --> IntelOrder["Fixed content order: context → AI insights → evidence → pending approvals → conversation"]
```

---

## 5. Responsive layout

How the 3 screens reflow at each breakpoint — summarizing the "Responsive layouts" table in each screen prompt.

```mermaid
flowchart TD
    D["Desktop >1280px"] --> D1["SCR-32: full 3-panel, Timeline scrolls horizontally"]
    D --> D2["SCR-33: full 3-panel, 4-col stat grid"]
    D --> D3["SCR-34: full member table, all columns"]

    T["Tablet 768–1280px"] --> T1["SCR-32: IntelligencePanel → BottomSheet; Timeline/Kanban still scroll horizontally"]
    T --> T2["SCR-33: stat grid → 2 columns; IntelligencePanel → BottomSheet"]
    T --> T3["SCR-34: permissions column collapses into expandable row detail"]

    M["Mobile <768px"] --> M1["SCR-32: Timeline → vertical list by week; Kanban → one column + stage-accordion switcher"]
    M --> M2["SCR-33: becomes the DEFAULT mobile landing view for Planner (per IPI-478 criterion F); stats stack 1-col"]
    M --> M3["SCR-34: member table → stacked card list, one member per card"]

    M1 -.-> M2
```

---

## 6. Planner instance state transitions

Reproduced from `plan/planner/mermaid-diagrams.md` §3 (verified accurate against the specs in the audit) — included here so each screen prompt can reference which UI state corresponds to which lifecycle state, without re-deriving it.

```mermaid
stateDiagram-v2
    [*] --> Draft: create_instance
    Draft --> Planned: generate_schedule
    Planned --> Active: start_first_task
    Active --> Blocked: gate_blocks
    Blocked --> Active: gate_approved
    Active --> Completed: final_task_done
    Completed --> Archived: archive
    Archived --> [*]
    Draft --> Cancelled: cancel
    Planned --> Cancelled: cancel
    Active --> Cancelled: cancel
    Cancelled --> [*]
```

**UI mapping** (statuses = `planner.instance_status` only — **no `at_risk` state**):
- `Draft` → SCR-32 `EmptyState` ("Select a workflow template") when no schedule yet.
- `Planned` / `Active` → populated Timeline / Kanban (**phase columns**) / Calendar / optional List.
- `Blocked` → gate badge on gated **phase**; `ApprovalCard` in drawer.
- **At risk (derived)** → amber `--warning` border on bars/cards while status remains `active`/`blocked`/etc.; SCR-33 “At Risk” count + IntelligencePanel.
- `Completed` / `Archived` → read-only (no drag handles), same as viewer chrome.
