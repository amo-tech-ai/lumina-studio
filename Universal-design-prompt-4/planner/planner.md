# iPix / FashionOS — Planner System — Design Plan & Progress Tracker

> **Design planning only.** No React, no SQL. Consolidates the four Planner design prompts (`uploads/SCR-32…35-*.md`, `00-review-and-conventions.md`, `diagrams.md`) into one plan: progress tracker, architecture diagrams, wireframes, and implementation-ready tasks.
>
> **Prime directive (from `00-review-and-conventions.md`):** the Planner is **one more surface in the existing operator app, not a new product.** Reuse before inventing. Match `DESIGN.md` v3 "Zeely Editorial" exactly — pure white/grey/black, Inter, Geist Mono for all numbers, black primary actions, hairline borders (no shadows), amber = pending/at-risk (border+dot only, never a filled block). Colour communicates **status only** — no per-phase rainbow.
>
> **Authority chain:** backing specs = `linear/issues/IPI-476…483-PLN-*`. Screen IDs = `docs/handoff/SCREEN-REGISTRY.md` (SCR-32…35 reserved by this plan). Visual system = `DESIGN.md` + `design-patched/tokens.css`. Components = `components/COMPONENTS.md`. On conflict, the IPI acceptance criteria win.

---

## 0. Progress Tracker

Legend: 🟢 complete · 🟡 in progress · 🔴 failed / blocked · ⚪ not started

### 0.1 Design artifacts

| Artifact | Status | Proof / location |
|---|:--:|---|
| Review & conventions (tokens, reuse map) | 🟢 | `uploads/00-review-and-conventions.md` — pulled from real `.dc.html` library |
| SCR-32 Workspace design prompt | 🟢 | `uploads/SCR-32-planner-workspace.md` |
| SCR-33 Dashboard design prompt | 🟢 | `uploads/SCR-33-planner-dashboard.md` |
| SCR-34 Instance Settings design prompt | 🟢 | `uploads/SCR-34-planner-instance-settings.md` |
| SCR-35 Planner Hub design prompt | 🟢 | `uploads/SCR-35-planner-hub.md` |
| Architecture diagrams (6) | 🟢 | `uploads/diagrams.md` — validated |
| This consolidated plan + tracker | 🟢 | `planner/planner.md` |
| `--planner-*` design tokens defined | 🟢 | conventions §5 (13 tokens, extend existing scale) |
| Registry IDs SCR-32…35 | 🟢 | added to `SCREEN-REGISTRY.md` this pass |
| Extra diagrams (task lifecycle · HITL · AI tools · notif) | 🟢 | §4 of this doc |
| Text wireframes (4 screens, desktop + mobile) | 🟢 | §5 of this doc |
| Implementation task breakdown | 🟢 | §6 of this doc |
| Data model reconciled to Supabase design reference | 🟢 | §3.1–3.4 — ERD, enums, tables, fields; 3 corrections applied (see below) |
| **Adaptive 3-Panel layout standard** | 🟢 | **§2A — governing interaction model; no 4th panel** |
| **Adaptive-panel wireframes + UX review** | 🟢 | `planner/adaptive-panel-wireframes.md` — 4-panel problem vs 3-panel, per-state/breakpoint, scored review |

### 0.2 Prototypes (`.dc.html` builds) — 🟢 all four built

> **QA + React handoff:** `planner/planner-qa-handoff.md` (readiness scorecard, Linear verification, interaction/state/fixture specs). Prototype avg **86/100** — handoff-ready.
>
> **Full state matrix built into all four screens** (loading·empty·error·read-only·permission-denied·sync-failed·success, as Tweaks) — final QA `planner/planner-final-qa.md`, overall **90/100**. Global rail integration in `nav-qa-report.md`.
>
> **Architecture revision (adaptive 3-panel) applied — all four verified at 1360px, 0 template holes:** SCR-32 refactored (phase detail moved from a drawer-beside-Intelligence **4th panel** into the single adaptive right panel); SCR-35 plan-select → plan detail + Open Workspace; SCR-34 converted 2-col → 3-col adaptive (Access summary ↔ member detail); SCR-33 already compliant. Standard = §2A. **SCR-32 also now ships the full state matrix** (loading/empty/error/read-only/permission-denied/success/sync-failed, as Tweaks); 33/34/35 state matrices remain the next build.

| Screen | SCR | Route | Design | Prototype | Backend |
|---|:--:|---|:--:|:--:|:--:|
| Planner Workspace (Timeline/Kanban/Calendar/List) | 32 | `/app/planner/[instanceId]` | 🟢 spec | 🟢 built | ⚪ IPI-476/477/478 |
| Planner Dashboard (role-based) | 33 | `/app/planner/dashboard` | 🟢 spec | 🟢 built | ⚪ IPI-479 |
| Instance Settings (Members MVP) | 34 | `/app/planner/[instanceId]/settings` | 🟢 spec | 🟢 built | ⚪ IPI-479 |
| Planner Hub (index of plans) | 35 | `/app/planner` | 🟢 spec | 🟢 built | 🔴 **no Linear issue — open PLN-009** |

### 0.3 New components (build during React conversion — reskin/extend where noted)

| Component | Kind | Source pattern | Status |
|---|---|---|:--:|
| `PlannerTimeline` (Gantt bars) | 🆕 genuinely new | none — obeys token system | ⚪ |
| `PlannerKanban` | reskin | `Pages/SCR-30-CRM-Pipeline.dc.html` | ⚪ |
| `PlannerCalendar` | primitive + overlay | shadcn `Calendar` + new event bars | ⚪ |
| `PlannerList` | reuse | existing list-table conventions §5F | ⚪ |
| `TaskDetailDrawer` | composite | shadcn `Sheet` (one shared drawer) | ⚪ |
| `PlannerRoleDashboard` | reskin | `Pages/SCR-25-Role-Dashboards.dc.html` | ⚪ |
| `InviteMemberDialog` | composite | shadcn `Dialog` | ⚪ |
| `DependencyLine` (SVG) | 🆕 tiny | none — 1.5px grey connector | ⚪ *(IPI-483, deferred)* |
| `PresenceBar` | 🆕 small | NavSidebar avatar-with-dot | ⚪ *(IPI-480, deferred)* |
| `StatusChip` planner enum | extend | `components/StatusChip.dc.html` | ⚪ add `todo/in_progress/blocked/done/cancelled` + instance enum |

### 0.4 Needs attention

- 🟢 **Adaptive 3-panel standard adopted (architecture revision).** The Planner now has a single **Adaptive Right Context Panel** (Intelligence ⇄ selected-entity detail) — the earlier phase-detail **drawer beside Intelligence (a 4th panel)** is removed. Applied + DOM-verified on all four screens (§2A, `adaptive-panel-wireframes.md`). Invite stays a true action modal (allowed).
- 🟢 **Data model reconciled** to the Planner Supabase design reference (§3.1–3.4). Three corrections applied: (1) removed the invented **`at_risk` instance status** — it's a derived signal, official enum is draft·planned·active·blocked·completed·archived·cancelled; (2) split **Members roles into two axes** (Access vs Production) per the reference's hard rule; (3) fixed **entity badges** to exact `shoot`/`campaign`/`crm_deal`.
- 🟢 **Schema-verified against PR #283 (supersedes the earlier design-reference pass).** Two earlier corrections were themselves **reverted** to match the merged migration + generated types: (1) **Kanban columns = workflow PHASES** (IPI-478 AC-B drags update `phase_id`+`status`), not task-status columns; (2) **SCR-34 Members = Access role ONLY** — `assignments.production_role` verified **absent**, so production titles are Dashboard **display personas**, never a Members column/invite field. Also: **ApprovalCard contract = `Approve·Edit·Discard`** (removed invented Reject/Request-changes, §3.4/§4.9); `dependency_type` enum + `assignee_role`/`description`/`parent_task_id` confirmed **schema-proven** (§3.2/§3.4). This doc is now schema-accurate for Claude Design; the engineering gate is regenerating types + opening the Hub issue (§7). Design prompt is ready, but per its own header a real issue (fold into IPI-479 or new `PLN-009`) must be opened **before implementation**. Do not build against an untracked spec.
- 🟡 **Reuse discipline is the whole risk surface.** Three of four screens are reskins of shipped screens (SCR-30, SCR-25, list-tables). The only genuinely new visual is the Gantt **Timeline** — that's where design review effort concentrates.
- 🟡 **Deferred scope is large and already litigated** (conventions §6) — 8 proposed screens + a 6-mode AI taxonomy, none backed by IPI acceptance criteria. Do not design them.

---

## 1. Executive summary

The **Planner** manages a production plan's schedule — a "5-Week Product Shoot" lifecycle (Brief → Casting → Soft hold → Item delivery → Outfit confirmation → Payment & scheduling → Awaiting shoot → Production → Retouching → Final approval → Product return). It adds **four operator surfaces** on top of the existing shell, and embeds into `Shoot Detail`'s schedule tab.

**Current state:** all four screens have complete, discipline-checked design prompts; none are built as prototypes yet. The design system already contains ~90% of what they need — the plan's job is to reuse it, not reinvent it. One genuinely new visual pattern (the Gantt Timeline) and two deferred-until-later primitives (dependency lines, presence bar) are the only net-new UI.

**What this plan is for:** it turns the four prompts into (a) a single progress tracker, (b) the full diagram set, (c) low-fi wireframes, and (d) implementation-ready tasks mapped to the real `IPI-476…483` issues — so a build session or Claude Code can pick up any screen without re-deriving scope.

---

## 2. Scope & discipline

### 2.1 In scope (design now)

| # | Screen | Why it's in |
|---|---|---|
| SCR-32 | Planner Workspace | IPI-478 — the core hybrid view; the reason the Planner exists |
| SCR-33 | Planner Dashboard | IPI-479 — personalized "what's mine" landing; **default mobile view** |
| SCR-34 | Instance Settings — **Members tab only** | IPI-479 criteria C+F — invite flow + gate ownership |
| SCR-35 | Planner Hub | closes a real inventory gap — **but open a Linear issue first** |

### 2.2 Deferred (labeled slots only, do not fully design)

- SCR-34 **Notifications / Workflow / Danger** tabs → shown as `aria-disabled` "Coming soon" tab labels so the shell isn't rebuilt later. Panels: not designed.
- `DependencyLine` (IPI-483) and `PresenceBar` (IPI-480) → out of scope for the first Timeline ship; specced so they slot in cleanly.

### 2.3 Out of scope (no backing issue — do NOT design; conventions §6)

Workflow Template Builder/Library · Approval History screen · Activity Timeline visualization · Comments/Discussion panel · Dependency Inspector · Notification Rules screen · Planner Analytics · a 6-mode AI taxonomy (Suggest/Explain/Optimize/…). Each was checked against IPI-476…483 and found unbacked. Reopen only with a real issue.

---

## 2A. Adaptive 3-Panel Layout — Planner standard (architecture revision)

> **This is the governing interaction model for every Planner screen (SCR-32–35).** It replaces the earlier model where selecting a phase/task opened a **separate detail drawer beside** the Intelligence panel — that produced a 4-column layout (rail + workspace + Intelligence + drawer). The Planner must **never** open a fourth panel.

### 2A.1 The three panels
1. **Left Navigation** — the 56px operator rail (icons; Planner active). Never changes.
2. **Main Workspace** — the primary surface (Timeline/Kanban/Calendar/List, Dashboard grid, Members table, Hub card grid). Maximized for width.
3. **Adaptive Right Context Panel** (340px) — a **single** panel that swaps its contents by context. It is never stacked with, or covered by, another panel.

### 2A.2 Adaptive rules
- **Default context = Intelligence.** With nothing selected, the right panel shows the AI Intelligence view (SCR-32 slip insight / SCR-33 board health / SCR-35 cross-plan summary / SCR-34 Access summary — a settings-appropriate "Intelligence" context).
- **On select, Intelligence is *replaced* (not stacked) by the matching detail view:**
  - **Plan** selected (Hub) → Plan detail + **Open Workspace**.
  - **Phase / Task** selected (Workspace) → Phase/Task detail + gate box (Approve · Edit · Discard).
  - **Approval** selected → the same phase detail scrolled to its gate.
  - **Member** selected (Settings) → Member detail + role controls.
- **Closing the detail** (× or the "‹ Intelligence" back affordance, or **Esc**) returns the panel to Intelligence. Selection state clears.
- **No modal-style detail drawer beside Intelligence.** True *action* modals (e.g. the Invite dialog) are still allowed — they are transient confirmations, not detail surfaces.

### 2A.3 Navigation flow
`Hub → select plan → panel shows Plan detail → Open Workspace → Workspace (Timeline default) → select a bar → panel becomes Task/Phase detail → close → Intelligence returns.` The rail switches top-level screens; the adaptive panel handles all in-screen selection.

### 2A.4 Responsive behavior
- **Desktop (≥1280):** full 3-column grid `56px · minmax(0,1fr) · 340px`.
- **Tablet (768–1279):** the right panel collapses to a right-edge toggle; when opened it **slides over** the workspace as a sheet (still one context panel — Intelligence or detail, never both).
- **Mobile (<768):** single column; the context panel becomes a **bottom sheet**; detail selection opens the same sheet with the detail context. Rail → bottom tab bar.

### 2A.5 State transitions
`intelligence` ⇄ `detail(entity)` is the only panel state machine. Selecting a different entity while a detail is open swaps the detail in place (no close/reopen). Screen-level states (loading / empty / error / read-only / sync-failed) live in the **workspace**, not the panel; the panel stays on Intelligence during them.

### 2A.6 Accessibility
- The panel is a single live region; on swap, focus moves to the detail header's back control. Esc returns to Intelligence.
- The back affordance is a real `<button>` ("‹ Intelligence") plus a redundant × — both tabbable.
- Selecting a row/card/bar is a native click target ≥44px; selection is conveyed by an outline **and** the panel change (not color alone).

### 2A.7 Rationale — why adaptive beats the 4th panel
- **Screen space:** a 4th panel on a 1360px screen left the workspace ~620px; folding detail into the existing 340px panel keeps the Gantt/Kanban full-width.
- **Cognitive load:** one context region to read, not two competing ones (Intelligence *and* a drawer).
- **Consistency:** the same right-hand region always answers "what's relevant to what I'm looking at" — default AI context, or the selected thing's detail.
- **No overlay occlusion:** the old drawer dimmed and covered the workspace; the adaptive panel never hides the work.

**Applied to:** SCR-32 (✅ refactored — phase detail now in-panel), SCR-33 (✅ already compliant — single Intelligence panel, cards navigate), SCR-34 (✅ refactored — Access summary ↔ member detail), SCR-35 (✅ refactored — plan detail + Open Workspace). Wireframes + UX review: `planner/adaptive-panel-wireframes.md`.

---

## 2B. Navigation (left rail — functional)

> Full audit + wireframes + flow diagram: `planner/navigation.md`.

The Planner uses a **scoped sub-rail** (5 icons), consistent with the CRM sub-app pattern — not a duplicate of the global 7-icon Operator rail. Every icon is a functional `<a href>` to an existing screen; the current section carries `aria-current="page"`.

| Icon | Destination | Route | Active on |
|---|---|---|---|
| `home` | Command Center | `/app` | — |
| `calendar-range` | Planner Hub | `/app/planner` | SCR-35, SCR-32 |
| `layout-dashboard` | Planner Dashboard | `/app/planner/dashboard` | SCR-33 |
| `inbox` | Notifications | `/app/inbox` | — |
| `settings` | Instance Settings | `/app/planner/[id]/settings` | SCR-34 |

States: default (`--text-3`/transparent) · hover (`--muted-bg`) · active (white on `--action` + `aria-current`). All icons are keyboard-tabbable with `aria-label`. Workspace (SCR-32) has no rail icon by design — it's a plan detail reached via Hub/Dashboard; its rail marks **Planner** active.

**Global-rail integration (RESOLVED):** Planner is now a first-class item in the **global Operator rail** — `calendar` icon, route `/app/planner`, positioned after Shoots (production cluster), active only on SCR-32–35. Backfilled into all 11 global-rail image-first prototypes (Command Center desktop + mobile "More"). Scoped Planner sub-rail preserved. See `navigation.md` §6A + `nav-qa-report.md`.

---

## 2B.1 Plan bottom sheet & per-screen state (interaction model)

> Wireframes + rationale: `planner/sheet-wireframes.md`.

**Plan detail sheet (Hub + Dashboard, mobile).** Tapping a plan opens a **decision-oriented** bottom sheet, not a field dump. It answers three questions in reading order: **what is this** (name + status + progress bar) → **why care** (one-line AI summary) → **what next** (a single highlighted recommended action, then the primary **Open Workspace** CTA and secondary **Timeline · Approval · Ask** actions). Compact meta is a fixed 4-row block (current phase · owner · next approval · due). No task tables or duplicated workspace data — depth lives one tap away in Open Workspace.

**Per-screen state isolation.** Each screen owns its own sheet/selection state; an interaction in one screen never surfaces content in another (Dashboard taps open the Dashboard sheet, Hub taps the Hub sheet). In the mobile gallery this is one `state.sheets` map keyed by frame; in React each screen is a separate route/store. Phase and member sheets use a simpler rows/gate variant of the same surface.

> **First-time-user review:** `planner/planner-firstuse-review.md` — per-screen usability issues, current-vs-proposed wireframes, and a prioritized improvement list (P1–P7: attention band, "Start here" line, pinned next-approval, Assistant-first panel, Invite promotion, plain-language synonyms). Reorder/pin/relabel only — no new surfaces. Not yet built into the hi-fi prototypes.

---

## 2C. Mobile & tablet standard (planning — build after approval)

> Full plan + wireframes + task lists: `planner/planner-mobile-plan.md`. **No prototype edits until approved.**

- **Breakpoints:** `≥1280` full 3-panel · `768–1279` workspace + right panel as **slide-over sheet** · `<768` single column + **bottom sheet** + bottom tab bar.
- **Adaptive panel on mobile = one bottom sheet** (Intelligence ⇄ selected detail). Never a 4th panel.
- **Chrome:** scoped rail → bottom tab bar (56 + safe-area); top app bar; persistent AI composer docked above the tab bar. Reuse the shipped `SCR-MOBILE-Gallery` / CRM gallery patterns.
- **Structural reflows:** SCR-32 Timeline → vertical week list · Kanban → phase accordion · List → task cards. SCR-33 KPI → 2×2, plans → snap-scroll, week → day list. SCR-34 members → stacked cards. SCR-35 → 1-col cards.
- **State matrix + tokens + icons carry over unchanged.** Likely delivered as one `SCR-MOBILE-Planner-Gallery.dc.html`.

---

## 3. Screen inventory

| SCR | Screen | Route | Backing IPI | Reuse basis | Status |
|:--:|---|---|---|---|:--:|
| 32 | Planner Workspace | `/app/planner/[instanceId]` (+ embeds `shoots/[id]/schedule`) | IPI-478 (+483/480 later) | new Timeline; Kanban=SCR-30; Calendar=shadcn; List=§5F | ⚪ build |
| 33 | Planner Dashboard | `/app/planner/dashboard` | IPI-479 | SCR-25 shell reskin | ⚪ build |
| 34 | Instance Settings (Members) | `/app/planner/[instanceId]/settings` | IPI-479 (C+F) | §5F table + shadcn Tabs/Dialog | ⚪ build |
| 35 | Planner Hub | `/app/planner` | **none — open one** | SCR-04 Shoots List reskin | 🔴 gated on issue |

**Agent:** all four are surfaced by the existing **`production-planner`** agent through the reused `PersistentChatDock` (IPI-482). No new agent.

### 3.1 Data model (verified against PR #283 migration)

> Terminology + relationships for the mockups. Data facts below are **verified against the merged PR #283 planner migration + generated `Database["planner"]` types** (enums, 10 tables, CHECKs, seed). Still **design-only** — do not author SQL/RLS/APIs here. Reuse existing platform tables; never duplicate them.

```mermaid
erDiagram
    ORGANIZATION ||--o{ WORKFLOW : owns
    WORKFLOW ||--o{ PHASE : defines
    PHASE ||--o{ GATE : optional
    ORGANIZATION ||--o{ PLANNER_INSTANCE : owns
    WORKFLOW ||--o{ PLANNER_INSTANCE : creates
    PLANNER_INSTANCE ||--o{ TASK : contains
    PLANNER_INSTANCE ||--o{ DEPENDENCY : contains
    PLANNER_INSTANCE ||--o{ ASSIGNMENT : members
    PLANNER_INSTANCE ||--o{ EVENT : activity
    PLANNER_INSTANCE ||--o{ VIEW_CONFIG : preferences
    PHASE ||--o{ TASK : groups
```

Hierarchy: **Organization → Workflow template → Planner Instance → Phases → Tasks → Dependencies → Assignments → Activity Events.**

### 3.2 Vocabulary & enums (use these exact values)

**Instance status** (`planner.instances.status`) — DB → UI label: `draft`→Draft · `planned`→Planned · `active`→Active · `blocked`→Blocked · `completed`→Completed · `archived`→Archived · `cancelled`→Cancelled.

**Task status** (`planner.tasks.status`): `todo`→To Do · `in_progress`→In Progress · `blocked`→Blocked · `done`→Done · `cancelled`→Cancelled.
> ⚠ **Never interchange:** a **task** ends at `done`; an **instance** ends at `completed`. "At risk" is **not** a status in either enum — it is a derived amber signal (§4.6).

**Entity type** (card badge, exact values): `shoot` · `campaign` · `crm_deal`. Render icon **+ text**, never colour-only.

**Dependency type** (`planner.dependencies.dependency_type`, **schema-proven** enum): `finish_to_start` · `start_to_start` · `finish_to_finish` · `start_to_finish`. Dependencies ARE stored; only the *line rendering / editor* is staged (§3.4).

**Planner views** (`planner.view_configs.default_view`, **schema-proven**): `timeline` · `kanban` · `calendar`. **List is a transient UI mode in v1 — a presentation of the same task data, NOT persisted** in `view_configs`.

**Roles (verified against PR #283 migration):**
- **Access Role** — the ONLY stored member role. `planner.assignments.role` four-tier CHECK: `owner` · `manager` · `contributor` · `viewer`. Drives all permissions; the **only** role column in SCR-34 Members.
- **Production personas** (Producer · Photographer · Retoucher · Stylist · Model · Client Approver · Coordinator) — ❌ **NOT a stored column.** `assignments.production_role` was verified **absent**. Use only as **display personas on the Dashboard (SCR-33)** and in copy — never a Members column or invite field. *(Task-level `planner.tasks.assignee_role` is a **free-text** field, distinct from the 4-tier access role — don't render it as a permission.)*
- Never show an Access Role as a job title, or a persona as a permission level.

### 3.3 Tables (10/10 schema-proven, PR #283)

**Planner tables:** `planner.workflows` · `planner.phases` · `planner.gate_conditions` · `planner.instances` · `planner.tasks` · `planner.dependencies` · `planner.assignments` · `planner.events` · `planner.view_configs` · `planner.notification_rules`. (Seed ships the **11-phase 5-Week Product Shoot** template — matches migration §8.)

**Existing platform tables (reuse — never duplicate):** `organizations` · `org_members` · `shoots` · `campaigns` · `crm_deals` · `profiles` · `public.notifications` (the Notification Center — SCR-15, reused; do **not** design a second inbox/activity/notification screen).

### 3.4 Field inventories

**Task fields (schema-proven, PR #283):** Title · Status · Start Date · End Date · Duration · Assignee · Phase · Priority — plus `assignee_role` (free text), `description`, `parent_task_id` (subtasks). Column names live in the generated `Database["planner"]["tasks"]` types; Claude Code regenerates types to confirm exact spellings. No extra fields unless a screen spec calls for them.

**Planner card fields:** Name · Status · Entity Badge · Date Range · **Progress (derived** — completed tasks / total tasks, not a stored column**)** · **Primary Assignee (derived** from `assignments`; **optional** — may be absent). **Cover** = the linked entity's asset or a muted placeholder (❌ no cover column on `instances`). Design empty/absent states for all derived fields. "At risk" (SCR-33 count, SCR-32 amber) is likewise **derived**, never a stored status.

**Gates** (`planner.gate_conditions`, schema-proven `gate_type` + `required_role` CHECKs) use the existing **ApprovalCard** pattern (no separate approval app). Gate types: **Approval · Review · Sign-off**. **ApprovalCard action contract = `Approve · Edit · Discard`** (the real component contract — do **not** invent Reject / Request-changes buttons). Gate *display* states on the board: `locked` (not yet reachable) · `ready for approval` · `approved` (a Discard outcome returns the phase to blocked).

**Timeline** supports: grouped phases · dependency lines (subtle neutral, **not** colour-coded) · drag handles (editable roles only) · milestone indicators · current-date marker.
> **Dependency-line scope (3 stages — the *data* is proven via `dependency_type`, only rendering is staged):** (1) **SCR-32 v1 prototype** — *static example* connectors only, no editing; (2) **IPI-483** — interactive connectors + dependency editing (`DependencyLine`, D-PLN-14); (3) **first engineering release** — may hide connectors entirely until IPI-483 lands. The *Dependency Editor* is out of MVP regardless.

**Realtime (design assumptions only):** changes appear automatically; presence avatars may come later; avoid full-screen loaders (use lightweight sync indicators); **no offline mode.**

### 3.5 Global design rules (specs don't state these — decide once, apply everywhere)

- **Dates & timezone:** Planner scheduling uses **date-only** values in the **organization's timezone**. Do **not** design timezone selectors or time-of-day pickers in v1; Timeline/Calendar render whole-day granularity.
- **Long content / overflow:** long task names → **truncate + tooltip**; wide Timeline → **horizontal scroll with a sticky phase (left) column**; long task lists → **virtualized**; many assignees/chips → show first 2–3 then **“+N”**; narrow columns keep a minimum bar-label width before truncating.
- **Instance naming:** an instance's display name comes from its **linked entity** (shoot/campaign/deal title) when present, else the **user-entered title** at creation, else the **workflow-template name** as fallback — in that precedence, so Hub cards read consistently.
- **Verification legend for this doc:** *schema-proven* = confirmed in PR #283 migration + generated types; *derived* = computed in the UI, never a stored column; *persona/future* = display metadata or later-phase, not stored. As of the PR #283 verify, §3 vocabulary is schema-accurate; the remaining engineering gate is regenerating types + registry/Hub process (§7).

---

## 4. Architecture & diagrams

> Diagrams 4.1–4.6 consolidate the validated set from `uploads/diagrams.md`; 4.7–4.10 are added here for the lifecycle/AI/HITL/notification flows the prompts reference but don't draw. Validate edits at mermaid.live.

### 4.1 Screen hierarchy

```mermaid
flowchart TD
    Shell["Operator Shell — NavSidebar / Workspace / IntelligencePanel"]
    Shell --> Hub["SCR-35 · Planner Hub (new, index)"]
    Shell --> Dashboard["SCR-33 · Planner Dashboard (new, personal)"]
    Shell --> Workspace["SCR-32 · Planner Workspace (new)"]
    Shell --> Settings["SCR-34 · Instance Settings (new)"]
    Shell --> Notif["SCR-15 · Notification Center (existing — reused)"]
    Shell --> ShootDetail["Shoot Detail (existing) — schedule tab embeds Workspace"]

    Hub --> Workspace
    Workspace --> Timeline["Timeline (new pattern)"]
    Workspace --> Kanban["Kanban (reskin SCR-30)"]
    Workspace --> Calendar["Calendar (shadcn primitive)"]
    Workspace --> List["List (existing table)"]
    Workspace --> Drawer["TaskDetailDrawer (shared, all 4 views)"]

    Settings --> Members["Members (MVP)"]
    Settings --> P1["Notifications (placeholder)"]
    Settings --> P2["Workflow (placeholder)"]
    Settings --> P3["Danger (placeholder)"]
```

### 4.2 User navigation flow

```mermaid
flowchart LR
    Login[Sign in] --> Dashboard["Planner Dashboard (SCR-33)"]
    Dashboard -->|stat card e.g. 'At Risk'| Workspace["Planner Workspace (SCR-32) pre-filtered"]
    Dashboard -->|'Recent plans' card| Workspace
    Hub["Planner Hub (SCR-35)"] -->|open a plan| Workspace
    Hub -->|New plan| Picker["Workflow-template picker"]
    Dashboard -->|bell| Notif["Notification Center (SCR-15)"]
    Notif -->|planner alert| Workspace
    Workspace -->|gear| Settings["Instance Settings (SCR-34)"]
    Workspace -->|click task/phase| Drawer["TaskDetailDrawer"]
    Drawer -->|gate pending| Approval["ApprovalCard (full variant)"]
    Settings -->|Invite member| Invite["Invite Member Dialog"]
    ShootDetail["Shoot Detail schedule tab"] --> Workspace
```

### 4.3 Component composition (reuse accounting)

```mermaid
flowchart TD
    subgraph S32["SCR-32 Workspace"]
        A1["PageHeader (reuse)"]
        A2["FilterBar → view toggle (reuse)"]
        A3["PlannerTimeline (NEW)"]
        A4["PlannerKanban (reskin SCR-30)"]
        A5["PlannerCalendar (shadcn + overlay)"]
        A6["PlannerList (table conv.)"]
        A7["TaskDetailDrawer (shadcn Sheet)"]
        A8["ApprovalCard (reuse, full)"]
        A9["IntelligencePanel (reuse, reskin)"]
        A10["PersistentChatDock (reuse)"]
    end
    subgraph S33["SCR-33 Dashboard"]
        B1["Greeting header (SCR-25)"]
        B2["Stat cards (SCR-25 KPI grid)"]
        B3["Recent plans row (4:3 cards)"]
        B4["Calendar strip (small composite)"]
        B5["IntelligencePanel (reuse)"]
        B6["ChatDock (reuse)"]
    end
    subgraph S34["SCR-34 Settings"]
        C1["Tabs (shadcn)"]
        C2["Member table (§5F)"]
        C3["Role pill (StatusChip ext.)"]
        C4["Invite Dialog (shadcn)"]
        C5["Placeholder tabs ×3"]
    end
    subgraph S35["SCR-35 Hub"]
        D1["PageHeader + FilterBar + Search (reuse)"]
        D2["Instance cards (SCR-04 reskin, 4:3)"]
        D3["EmptyState / SkeletonLoader (reuse)"]
    end
```

### 4.4 Workspace layout frame (SCR-32)

```mermaid
flowchart TD
    Root["grid-template-columns: 56px minmax(0,1fr) 340px"]
    Root --> Nav["NavSidebar (56 collapsed / 224 expanded)"]
    Root --> Main["Workspace column"]
    Root --> Intel["IntelligencePanel (340px)"]
    Main --> Toolbar["PageHeader + view toggle + role filter + Today"]
    Main --> ViewArea["View area — one of Timeline/Kanban/Calendar/List"]
    Main --> Dock["PersistentChatDock (pinned bottom)"]
    ViewArea -.click any task.-> Drawer["TaskDetailDrawer (slides from right)"]
    Intel --> Order["Fixed order: context → insights → evidence → approvals → conversation"]
```

### 4.5 Responsive reflow

```mermaid
flowchart TD
    D["Desktop >1280px"] --> D1["S32 full 3-panel, Timeline scrolls X"]
    D --> D2["S33 4-col stat grid"]
    D --> D3["S34 full member table"]
    T["Tablet 768–1280"] --> T1["S32 IntelligencePanel → BottomSheet"]
    T --> T2["S33 stat grid → 2-col"]
    T --> T3["S34 permissions col → expandable row"]
    M["Mobile <768px"] --> M1["S32 Timeline → vertical-by-week; Kanban → stage accordion"]
    M --> M2["S33 = DEFAULT mobile Planner landing; stats 1-col"]
    M --> M3["S34 member table → stacked cards"]
    M1 -.deep-link redirects.-> M2
```

### 4.6 Instance state machine (UI mapping)

> **Corrected to the official enum** (`planner.instances.status`): `draft · planned · active · blocked · completed · archived · cancelled`. There is **no `at_risk` status** — "at risk" is a **derived UI signal** (computed from task slippage / risk events), rendered as an amber treatment on top of whatever the real status is; never a state-machine value. Note the enum split: a **task** finishes at `done`, an **instance** finishes at `completed` — never interchange them.

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

- `Draft` → SCR-32 `EmptyState` ("Select a workflow template").
- `Planned`/`Active` → populated Timeline/Kanban/Calendar/List.
- `Blocked` → gate badge on bar; `ApprovalCard` full variant in drawer.
- **At-risk (derived, not a status)** → amber `--warning` border layered over an `active`/`blocked` instance; surfaced in SCR-33 "At Risk" count + SCR-32 IntelligencePanel. Computed from slippage/risk events, so it can coexist with any live status.
- `Completed`/`Archived` → read-only render (no drag handles, no edit controls).

### 4.7 Task lifecycle (per-task, within an active instance)

```mermaid
stateDiagram-v2
    [*] --> todo: task_created
    todo --> in_progress: assignee_starts
    in_progress --> blocked: dependency_unmet / gate
    blocked --> in_progress: unblocked
    in_progress --> done: complete
    todo --> cancelled: cancel
    in_progress --> cancelled: cancel
    done --> [*]
    cancelled --> [*]
```

Status enum drives `StatusChip` (extend, don't fork): `todo` grey · `in_progress` black/solid · `blocked` red · `done` green+check · `cancelled` muted strikethrough.

### 4.8 AI tool flow — `production-planner` agent (IPI-482)

> ⚠ **Future / conceptual architecture (IPI-482) — design mockups only.** These tool names are *planned*, not implemented. Do not imply any of these actions is currently available in the first Planner prototype; the AI **suggests**, the operator **approves**.

```mermaid
flowchart LR
    User["Operator (chat dock)"] --> Agent["production-planner agent"]
    Agent --> R1["buildSchedule"]
    Agent --> R2["detectScheduleRisks"]
    Agent --> R3["suggestDependencies"]
    Agent --> R4["shiftTimeline"]
    Agent --> R5["assignTasks"]
    Agent --> R6["explainDelay"]
    Agent --> R7["summarizeTimeline"]
    Agent --> W["commitSchedule (WRITE)"]
    W --> HITL{"HITL gate — ApprovalCard"}
    HITL -->|operator approves| DB["planner.tasks / phases updated"]
    HITL -->|reject| Agent
    R1 & R2 & R3 & R4 & R5 & R6 & R7 -.read-only.-> Panel["IntelligencePanel + drawer render"]
```

**Rule:** every read tool proposes; only `commitSchedule` writes, and it must pass the `ApprovalCard` HITL gate. The AI never mutates the schedule silently.

### 4.9 HITL approval (gate) flow

```mermaid
flowchart TD
    Phase["Phase reaches an approval gate"] --> Badge["Gate badge on bar/column (diamond/lock)"]
    Badge --> Open["Operator opens TaskDetailDrawer"]
    Open --> Card["ApprovalCard full variant — before/after diff"]
    Card -->|Approve| Advance["Gate opens → next phase reachable; event logged"]
    Card -->|Edit| Revise["Adjust the proposed change, then Approve"]
    Card -->|Discard| Hold["Phase stays locked/blocked; event logged"]
    Revise --> Advance
    Advance --> Notif["Notification fan-out (IPI-481)"]
    Hold --> Notif
```

> ApprovalCard's real action contract is **`Approve · Edit · Discard`** (§3.4) — there is no separate Reject/Request-changes button. "Discard" leaves the gate unmet; "Edit" lets the operator amend the proposal before approving.

### 4.10 Notification fan-out (IPI-481, reuses SCR-15)

> ⚠ **Future architecture (IPI-481) — not available in the first Planner prototype.** Shown so the design reuses the existing Notification Center (SCR-15) rather than inventing a second inbox; the queue/fan-out itself is later engineering.

```mermaid
flowchart LR
    Ev["planner.events (gate / risk / assignment / delay)"] --> Q["Queue (fan-out)"]
    Q --> Sub1["Assignee"]
    Q --> Sub2["Gate owner"]
    Q --> Sub3["Producer"]
    Sub1 & Sub2 & Sub3 --> NC["Notification Center (SCR-15, existing)"]
    NC --> Deep["Deep-link → Planner Workspace (SCR-32)"]
```

---

## 5. Wireframes (low-fi, Zeely Editorial)

> Text wireframes — structure and hierarchy only. Real builds lift exact tokens/spacing from `DESIGN.md` + the reused screens named per block. Numbers shown in `mono`.

### 5.1 SCR-32 · Planner Workspace — Timeline view (desktop)

```
┌────┬──────────────────────────────────────────────────────────┬───────────────┐
│ ▪  │  Summer Lookbook — Production Plan       [● Active]        │ INTELLIGENCE  │
│ ▫  │  ┌ Timeline │ Kanban │ Calendar │ List ┐   [Role ▾][Today]│ ───────────── │
│ ▫  │  ────────────────────────────────────────────────────────│ Context       │
│ ▫  │   WEEK      W1    W2    W3    W4    W5      (Geist Mono)   │ Summer Look…  │
│ ▫  │  ┌──────────┬─────┬─────┬─────┬─────┬─────┐  │today       │ AI insights   │
│ ▫  │  │ Casting  │▐███▌│     │     │     │     │  │ (thin black│ • Item deliv. │
│ ▫  │  │ Soft hold│     │▐██▌ │     │     │     │  │  vertical) │   at risk     │
│ ▫  │  │ Item del.│     │  ▐░░░░▌◇gate│     │     │             │ Evidence      │
│ ▫  │  │ Production│    │     │     │▐███▌│     │             │ ▸ 2 days slip │
│ ▫  │  │ Retouch  │     │     │     │  ▐██▌│     │             │ Approvals (2) │
│ ▫  │  │ Final appr│    │     │     │     │▐░░▌ │             │ [ApprovalCard]│
│ ▫  │  └──────────┴─────┴─────┴─────┴─────┴─────┘             │ Conversation  │
│    │  bars: grey=todo ▐░ black=in-prog ▐█ green✓ amber⚠ red  │               │
│ ▫  │ ─────────────────────────────────────────────────────── │               │
│ ▫  │  💬 "You're viewing Summer Lookbook. 2 tasks need approval"│               │
└────┴──────────────────────────────────────────────────────────┴───────────────┘
      click any bar → TaskDetailDrawer slides over from right
```

Kanban view = SCR-30 column pattern with **columns = workflow phases** (IPI-478 AC-B: dragging a card updates its `phase_id` **and** `status`) — **not** task-status columns. Each card shows its **task status** (StatusChip) + assignee; offer an optional **status filter** on the toolbar (filter, not columns). A **phase gate** locks its column (gate badge + ApprovalCard to enter); a task in `blocked` status shows the blocked chip on its card — phase-gate ≠ task-blocked (§4.9). Calendar view = shadcn month grid + multi-day status bars. List view = §5F table (**task · phase · assignee · start/end dates · duration · priority · StatusChip** — §3.4; List is a transient v1 mode, not persisted).

**Mobile (<768px):** deep-link redirects to Dashboard (SCR-33). If forced here: Timeline → vertical list grouped by week; Kanban → one column + stage-accordion switcher (same reflow as `SCR-MOBILE-CRM-Gallery`).

### 5.2 SCR-33 · Planner Dashboard (desktop)

```
┌────┬──────────────────────────────────────────────────────────┬───────────────┐
│ ▪  │  Good morning, Maya — 2 gates need approval, Item delivery │ INTELLIGENCE  │
│ ▫  │  is at risk.                                               │ Board health  │
│ ▫  │  ┌──────────┬──────────┬──────────┬──────────┐            │ 🟢 3 on track │
│ ▫  │  │ My Tasks │ Needs    │ At Risk  │ Due Today│  (SCR-25    │ Recommendation│
│ ▫  │  │   12     │ Approval │    3     │    4     │   KPI cards)│ ▸ Approve …   │
│ ▫  │  │  mono    │   2      │  mono⚠   │  mono    │            │ Recent activ. │
│ ▫  │  └──────────┴──────────┴──────────┴──────────┘            │ • gate opened │
│ ▫  │  Recent plans                                             │   2h ago      │
│ ▫  │  ┌────────┐ ┌────────┐ ┌────────┐   (4:3 cover, status    │               │
│ ▫  │  │ [img]● │ │ [img]● │ │ [img]● │    chip corner)         │               │
│ ▫  │  │ Summer │ │ SS26   │ │ Nike   │                         │               │
│ ▫  │  └────────┘ └────────┘ └────────┘                         │               │
│ ▫  │  Upcoming this week   Mon Tue Wed Thu Fri Sat Sun         │               │
│ ▫  │  ─────────────────────  ▪   ▪▪   ▪    ▪   (task chips)     │               │
│ ▫  │  💬 "You have 3 plans active. Item delivery needs attention"│              │
└────┴──────────────────────────────────────────────────────────┴───────────────┘
```

Stat cards are **links** (deep-link into SCR-32 pre-filtered). Show 3–4 role-relevant stats, not all 8. Role-conditional slots: Producer → budget gates; Client approver → only their approval gates.

**Mobile:** default Planner landing. Stats 1-col, recent plans horizontal scroll, calendar strip → vertical day list.

### 5.3 SCR-34 · Instance Settings — Members tab (desktop)

```
┌────┬──────────────────────────────────────────────────────────┬───────────────┐
│ ▪  │  Summer Lookbook · Settings                               │ (panel        │
│ ▫  │  ┌ Members │ Notifications⋯ │ Workflow⋯ │ Danger⋯ ┐       │  optional /   │
│ ▫  │  (active)   (aria-disabled "Coming soon")                 │  hidden on     │
│ ▫  │  ─────────────────────────────────────────  [+ Invite]   │  admin surface)│
│ ▫  │  ACCESS ROLE     NAME                              ⋯      │               │
│ ▫  │  ─────────────────────────────────────────────────────  │               │
│ ▫  │  [Owner]         Maya Chen                        ⋯      │               │
│ ▫  │  [Contributor]   Jon Alvi                         ⋯      │               │
│ ▫  │  [Contributor]   Priya R.                         ⋯      │               │
│ ▫  │  [Viewer]        dana@…            [Invited]        ⋯      │               │
│    │  (≥48px rows, soft dividers, uppercase muted header)     │               │
└────┴──────────────────────────────────────────────────────────┴───────────────┘
   ACCESS ROLE ONLY — the one stored member role (`assignments.role`):
     owner · manager · contributor · viewer   (chip)
   ❌ NO production-role column — `assignments.production_role` verified ABSENT (PR #283).
     Production personas (Producer/Photographer/…) are Dashboard display only (SCR-33),
     never a Members column or invite field.
   [+ Invite] → shadcn Dialog: email + access-role ▾   (no production-role field)
   Row ⋯ → change access role / remove (remove = confirm step)
```

**Mobile:** table → stacked cards (name · access-role chip · ⋯). Tablet: status/permissions detail → expandable row.

### 5.4 SCR-35 · Planner Hub (desktop) — reskin of SCR-04 Shoots List

```
┌────┬──────────────────────────────────────────────────────────┬───────────────┐
│ ▪  │  Planner                       12 plans · 3 need attention │ Cross-plan    │
│ ▫  │  ┌ Type: All │ Shoot │ Campaign │ CRM Deal ┐  [status ▾] 🔍│ summary       │
│ ▫  │  ─────────────────────────────────────────────  [+ New plan]│ • 4 active   │
│ ▫  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │ • 3 at risk   │
│ ▫  │  │ [4:3]● │ │ [4:3]● │ │ [4:3]● │ │ [4:3]● │  (Shoot-card  │               │
│ ▫  │  │ Summer │ │ SS26   │ │ Q3 push│ │ Elite  │   anatomy)    │               │
│ ▫  │  │🎬 shoot │ │📣campgn│ │🎬 shoot │ │💼crm_deal│            │               │
│ ▫  │  │ ●Active│ │●Planned│ │⚠At risk│ │●Draft  │              │               │
│ ▫  │  └────────┘ └────────┘ └────────┘ └────────┘              │               │
│ ▫  │  💬 "You have 4 active plans. Summarize what needs attention?"│             │
└────┴──────────────────────────────────────────────────────────┴───────────────┘
   card → SCR-32 (default_view).  [+ New plan] → workflow-template picker (not a new wizard)
   entity-type badge = icon + text, exact values shoot·campaign·crm_deal (never colour-only)
   card fields (reference): Name · Status · Entity Badge · Date Range · Progress · Primary Assignee
```

**Mobile:** single-column card stack (same as Shoots List mobile). Deep-link default still redirects to Dashboard.

---

## 6. Implementation tasks

> Priority: P0 critical path · P1 core · P2 later. Complexity: S/M/L. Design-lane tasks (`D-PLN-*`) produce the `.dc.html` prototype; engineering issues (`IPI-*`) are the backend/React they depend on. **Prototypes build on fixtures — no backend needed to design.**

| ID | Feature | Description | Depends on | Priority | Cx | Risks | Linear epic |
|---|---|---|---|:--:|:--:|---|---|
| **D-PLN-1** | SCR-32 Workspace shell + **Timeline** | 3-panel shell reuse; build the new Gantt Timeline (pill bars, status-border-only, mono week headers, black today line); wire view toggle | conventions §5 tokens | **P0** | **L** | Timeline is the only net-new visual — over-design risk; must obey status-colour-only rule | IPI-478 |
| **D-PLN-2** | SCR-32 **Kanban** view | Reskin `SCR-30-CRM-Pipeline` — **columns = workflow phases** (IPI-478 AC-B: drag updates `phase_id` + `status`), **not** task statuses; each card shows its **task-status StatusChip** + assignee; optional **status filter** on toolbar; phase **gate** locks its column (ApprovalCard to enter) | D-PLN-1 | P0 | M | ✅ **phase columns** per IPI-478 AC-B (reverted an earlier status-column error) | IPI-478 |
| **D-PLN-3** | SCR-32 **Calendar** + **List** views | shadcn Calendar (month scope v1; week/day later) + multi-day status bars; List = §5F table, **transient v1 mode, not persisted in `view_configs`** | D-PLN-1 | P1 | M | event-bar overlay is the only new bit | IPI-478 |
| **D-PLN-4** | `TaskDetailDrawer` (shared) | One shadcn `Sheet` from all 4 views; view-only variant for read-only roles; "Edit dates" form = non-drag alternative; fields per §3.4 (schema-proven, confirm exact names via generated types); **ApprovalCard contract = `Approve · Edit · Discard`** (no invented Reject/Request-changes) | D-PLN-1 | P0 | M | must be ONE drawer, not four | IPI-478 |
| **D-PLN-5** | SCR-32 states | empty (template picker) · loading (bar skeletons) · not-found (amber) · error (red) · read-only · **permission-denied** · **sync-failed** · approval-gate (diamond + ApprovalCard) | D-PLN-1..4 | P0 | M | gate state must reuse ApprovalCard, not a new modal | IPI-478 |
| **D-PLN-6** | SCR-33 Dashboard | Reskin `SCR-25` shell — greeting, 3–4 role KPI cards (links), recent-plans 4:3 row, week strip; **mark At Risk + Progress as derived** | SCR-25 | **P0** | M | don't cram 8 stats; role-conditional slots | IPI-479 |
| **D-PLN-7** | SCR-33 role variants + states | Producer + Client-approver **display personas** (not stored roles); empty (unassigned) / loading / error | D-PLN-6 | P1 | S | personas are Dashboard display only — access role (`assignments.role`) drives permissions | IPI-479 |
| **D-PLN-8** | SCR-34 Members tab | §5F member table with **one role column = Access Role** (`owner/manager/contributor/viewer`); Invite Dialog (shadcn, access-role only); disabled placeholder tabs ×3 | shadcn Tabs/Dialog | P1 | M | ✅ **access-role only** — `assignments.production_role` verified ABSENT (PR #283); reverted a two-column error | IPI-479 |
| **D-PLN-9** | SCR-34 states + destructive guard | owner-only / loading / **invite states: pending · expired (+resend) · accepted · failed** (inline); remove-member confirm step | D-PLN-8 | P1 | S | destructive action needs confirm | IPI-479 |
| **D-PLN-10** | SCR-35 Planner Hub | Reskin `SCR-04` — PageHeader + FilterBar (type/status) + search + 4:3 instance cards + New-plan → template picker | SCR-04 | P2 | M | **design-approved; engineering blocked until Linear issue exists** | *(new PLN-009)* |
| **D-PLN-11** | `StatusChip` planner enums | Add task enum (`todo/in_progress/blocked/done/cancelled`) + instance enum (`draft…cancelled`) MAP entries | — | P0 | S | extend, never fork the component | IPI-476 |
| **D-PLN-12** | Mobile reflows (all 4) | Timeline→week-list; Kanban→status-column accordion; Dashboard=mobile default landing; Members→cards; Hub→1-col. **Preserve deep-link intent** — a link to a specific instance opens that instance's mobile Workspace, don't silently bounce to Dashboard | D-PLN-1,6,8,10 | P1 | M | reuse existing mobile patterns, not new | IPI-478 F |
| **D-PLN-13** | `--planner-*` token block | 13 tokens (row/bar height, radii, grid gap, today marker, drop target…) into tokens.css referencing existing primitives | — | P0 | S | must reference `--color-*`/`--radius-*`, no raw hex | IPI-476 |
| D-PLN-14 | *(deferred)* `DependencyLine` | 1.5px grey SVG connectors on Timeline | D-PLN-1 | P2 | S | out of scope until issue active | IPI-483 |
| D-PLN-15 | *(deferred)* `PresenceBar` | active-viewer avatars (NavSidebar dot treatment) | D-PLN-1 | P2 | S | out of scope until issue active | IPI-480 |

### 6.1 Acceptance criteria (per screen, design DoD)

- **SCR-32:** desktop/tablet/mobile layouts · full keyboard nav (every bar/card/chip focusable, documented drag equivalents) · empty/loading/error/not-found/**permission-denied**/**sync-failed** states · read-only variant · gate states (locked/ready/approved) + **ApprovalCard `Approve·Edit·Discard`** · colour-independent status · **Kanban columns = phases** (cards show task-status StatusChip) · overflow rules (§3.5: truncate+tooltip, sticky phase column, horizontal scroll, virtualized lists, +N chips) · date-only rendering · `prefers-reduced-motion` respected.
- **SCR-33:** desktop 4-col / tablet 2-col / mobile 1-col (default landing) · stat cards are real focusable links with names beyond the number · empty/loading/error · Producer + Client-approver variants · At Risk + Progress shown as **derived** · calendar-strip cells have text equivalents.
- **SCR-34:** desktop table (**Access role column only**) / tablet expandable-row / mobile cards · table semantics + focus-trapped Invite dialog · owner-only/loading/**invite states (pending/expired+resend/accepted/failed)** · disabled tabs have `aria-disabled` + reason · remove-member confirm · **no production-role column** (verified absent).
- **SCR-35:** desktop/tablet/mobile · every card + filter focusable · empty/loading/error · entity-type badges (`shoot`/`campaign`/`crm_deal`) never colour-only · instance naming precedence (§3.5) · **a real Linear issue exists before implementation.**

### 6.2 Build order / critical path

```mermaid
flowchart LR
    T13["D-PLN-13 tokens"] --> T1["D-PLN-1 Workspace+Timeline"]
    T11["D-PLN-11 StatusChip enums"] --> T1
    T1 --> T2["D-PLN-2 Kanban"]
    T1 --> T4["D-PLN-4 TaskDetailDrawer"]
    T2 --> T5["D-PLN-5 states"]
    T4 --> T5
    T1 --> T3["D-PLN-3 Calendar+List"]
    T6["D-PLN-6 Dashboard"] --> T7["D-PLN-7 role variants"]
    T5 & T7 --> T12["D-PLN-12 mobile reflows"]
    T8["D-PLN-8 Members"] --> T9["D-PLN-9 states+guard"]
    ISSUE["🔴 open PLN-009"] --> T10["D-PLN-10 Hub"]
    T12 --> DONE["Planner design complete"]
    T3 & T9 & T10 --> DONE
```

**Recommended sequence:** tokens + StatusChip enums → Workspace/Timeline (highest-risk new pattern, do it first) → Kanban + TaskDetailDrawer + states → Dashboard (fast SCR-25 reskin) → Members → mobile reflows → *(unblock)* Hub. Deferred `DependencyLine`/`PresenceBar` last, only when their issues activate.

---

## 7. Readiness

| Dimension | Score | Note |
|---|:--:|---|
| Design spec completeness | 🟢 96 | 4 prompts + conventions + diagrams, all discipline-checked |
| Reuse discipline | 🟢 98 | 3 of 4 screens reskin shipped screens; only Timeline is new |
| Diagram coverage | 🟢 95 | 10 diagrams incl. lifecycle/AI/HITL/notif |
| Prototype build | 🟢 86 | all 4 built in `Pages/` + verified; see `planner-qa-handoff.md` |
| Backend readiness | 🟡 — | IPI-476…483; out of design scope, gates prototypes going live |
| Scope hygiene | 🟢 97 | deferred/out-of-scope explicitly fenced (conventions §6) |

**🔴 Blockers:** SCR-35 Hub has no Linear issue — open one before building it (design is otherwise ready).
**🟡 Watch:** keep the Timeline inside the status-colour-only rule; keep SCR-34's three extra tabs disabled; don't let any of the 8 deferred screens re-enter scope.
**🟢 Strength:** the Planner is a near-pure reuse of the existing system — low visual risk, one genuinely new pattern, everything mapped to real IPI issues.

---

## 8. Files

- **This plan:** `planner/planner.md`
- **Source prompts:** `uploads/00-review-and-conventions.md` · `uploads/SCR-32…35-*.md` · `uploads/diagrams.md` · **Planner Supabase design reference** (data model in §3, this doc)
- **Registry:** SCR-32…35 added to `docs/handoff/SCREEN-REGISTRY.md`
- **Reuse basis (existing prototypes):** `Pages/SCR-30-CRM-Pipeline.dc.html` (Kanban) · `Pages/SCR-25-Role-Dashboards.dc.html` (Dashboard) · `Pages/Shoots List.v2.image-first.dc.html` (Hub) · `components/*.dc.html` (shell primitives)
