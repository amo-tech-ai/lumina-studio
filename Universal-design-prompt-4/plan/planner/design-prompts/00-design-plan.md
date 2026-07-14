# Planner — Design plan (SSOT)

**Status:** Revised 2026-07-10 after schema verification (PR #283 migration + `Database["planner"]` types) and `design-prompt-audit.md`.  
**Scope:** Design planning only — no React, no SQL.  
**Authority chain:** IPI AC → this plan + `supabase-reference.md` → screen prompts. On conflict, **IPI acceptance criteria win**.

| Doc | Role |
|-----|------|
| **This file** | Progress, scope, wireframe rules, task IDs |
| `supabase-reference.md` | Schema-proven enums/fields/tables |
| `00-review-and-conventions.md` | Tokens + reuse map |
| `SCR-32`…`SCR-35` | Claude Design prompts |
| `diagrams.md` | Mermaid companions |
| `../planner.md` | **Engineering** PR/epic audit — **not** this design plan |

**Prime directive:** Planner is one more surface in the operator app. Zeely Editorial v3 — white/grey/black, Inter, Geist Mono for numbers, black CTAs, hairline borders, amber = pending/at-risk (border+dot only). Colour = **status only**.

---

## 0. Progress tracker

Legend: 🟢 complete · 🟡 in progress · 🔴 blocked · ⚪ not started

### 0.1 Design artifacts

| Artifact | Status | Location |
|---|:--:|---|
| Review & conventions | 🟢 | `00-review-and-conventions.md` |
| SCR-32…35 prompts | 🟡 | Synced to schema 2026-07-10 — see consistency audit |
| Diagrams | 🟡 | `diagrams.md` — AtRisk state corrected |
| Supabase design reference | 🟢 | `supabase-reference.md` — verified vs PR #283 |
| This design plan | 🟢 | `00-design-plan.md` |
| Registry SCR-32…35 | 🔴 | **Not** in `docs/handoff/SCREEN-REGISTRY.md` yet |
| Prototypes `.dc.html` | ⚪ | None |

### 0.2 Screens

| Screen | SCR | Route | Design | Proto | Backend / Linear |
|---|:--:|---|:--:|:--:|---|
| Workspace | 32 | `/app/planner/[instanceId]` | 🟢 | ⚪ | IPI-478 (+483/480 later) |
| Dashboard | 33 | `/app/planner/dashboard` | 🟢 | ⚪ | IPI-479 |
| Settings (Members) | 34 | `/app/planner/[instanceId]/settings` | 🟢 | ⚪ | IPI-479 C+F |
| Hub | 35 | `/app/planner` | 🟢 | ⚪ | 🔴 **no Linear issue** |

### 0.3 Needs attention (post-audit)

- 🟢 **Kanban = phases** (IPI-478 AC-B) — status-column “fix” **rejected**; task status stays on cards.  
- 🟢 **No `at_risk` instance status** — derived amber only.  
- 🟢 **Access roles only** on Members (`owner|manager|contributor|viewer`); production personas = display slots on Dashboard, not a DB column.  
- 🔴 Open Linear issue for SCR-35 before implementation.  
- 🔴 Add SCR-32…35 to `SCREEN-REGISTRY.md`.  
- 🟡 List view = transient UI mode (not in `view_configs`); demote vs IPI-478 three-view AC if needed.

---

## 1. Scope

**In:** SCR-32 Workspace · SCR-33 Dashboard · SCR-34 Members · SCR-35 Hub (design only until issue).  
**Deferred:** Settings Notifications/Workflow/Danger panels; `DependencyLine` (IPI-483); `PresenceBar` (IPI-480).  
**Out:** Workflow Builder, Approval History page, Comments, Dependency Inspector, Notification Rules screen, Analytics, 6-mode AI taxonomy.

**Agent:** existing `production-planner` via `PersistentChatDock` (IPI-482 tools = **future**).

---

## 2. Data model (pointer)

Full field lists: **`supabase-reference.md`**. Summary:

- **10 tables** in `planner.*` — all schema-proven.  
- **3 Postgres enums:** `instance_status`, `task_status`, `dependency_type`.  
- **Kanban columns = `phases`**; cards = `tasks` with `status` chip.  
- **Gates** on `phases.gate_type` — not task columns.  
- **Derived:** at-risk, progress %, cover image, primary assignee.  
- **Not proven:** `production_role`, `at_risk` status, comments, labels.

---

## 3. Navigation & mobile

```text
Desktop: Hub | Dashboard | Workspace | Settings | SCR-15 notifications
Mobile default landing: Dashboard (SCR-33) per IPI-478 F
Deep-link to /app/planner/[instanceId]: open mobile Workspace reflow (week list / phase accordion) — do not silently bounce away from the instance
Hub / bare /app/planner on mobile: prefer Dashboard landing; if forced, 1-col cards
```

---

## 4. Wireframe rules (Zeely)

### SCR-32 Workspace

- Timeline = only net-new Gantt pattern (status border colours only).  
- **Kanban = phase columns** (SCR-30 reskin); gated phases locked.  
- Calendar = shadcn + multi-day bars.  
- List = optional transient table (8 task fields from reference) — not persisted.  
- One `TaskDetailDrawer` (Sheet); ApprovalCard = Approve / Edit / Discard.  
- Viewer = no drag handles.

### SCR-33 Dashboard

- SCR-25 reskin; 3–4 KPI cards as links into SCR-32.  
- At Risk / Progress = **derived**.  
- Persona slots (Producer / Client Approver / …) = **display** — filter via access role + assignment, not `production_role`.

### SCR-34 Members

- Table: Name · **Access role** chip · optional permissions summary · ⋯  
- Invite: email + **access role** (no production-role field in MVP).  
- Three tabs disabled (`aria-disabled` + “Coming soon”).

### SCR-35 Hub

- SCR-04 reskin; entity badges `shoot|campaign|crm_deal`; instance status enum.  
- Cover = entity asset or muted placeholder.  
- **Blocked on Linear issue.**

---

## 5. Implementation tasks (design lane)

| ID | Feature | Priority | Linear |
|----|---------|:--------:|--------|
| D-PLN-13 | `--planner-*` tokens | P0 | IPI-476 |
| D-PLN-11 | StatusChip instance + task enums | P0 | IPI-476 |
| D-PLN-1 | Workspace shell + Timeline | P0 | IPI-478 |
| D-PLN-2 | Kanban **phase** columns | P0 | IPI-478 |
| D-PLN-4 | TaskDetailDrawer + ApprovalCard | P0 | IPI-478 |
| D-PLN-5 | Workspace states | P0 | IPI-478 |
| D-PLN-3 | Calendar (+ List optional/P2) | P1 | IPI-478 |
| D-PLN-6/7 | Dashboard + role slots | P0/P1 | IPI-479 |
| D-PLN-8/9 | Members + invite states | P1 | IPI-479 |
| D-PLN-12 | Mobile reflows | P1 | IPI-478 F |
| D-PLN-10 | Hub | P2 | 🔴 open issue first |
| D-PLN-14/15 | DependencyLine / PresenceBar | P2 | IPI-483 / 480 |

**Build order:** tokens + chips → Timeline → phase Kanban + drawer + states → Dashboard → Members → mobile → (issue) Hub.

---

## 6. Readiness

| Dimension | Score | Note |
|---|:--:|---|
| Schema-aligned vocabulary | 🟢 95 | Verified vs #283 |
| Authority-chain (Kanban) | 🟢 95 | Phases restored |
| Registry / Hub issue | 🔴 | Still open |
| Prototypes | ⚪ 0 | — |

**Do not start React** until Claude Design `.dc.html` exists for SCR-32 and registry/Hub process gaps are acknowledged.
