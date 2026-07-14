# Planner Design Plan — Audit

**Audited artifact:** Planner design pack under `plan/planner/design-prompts/`  
**First pass:** 2026-07-10 (paste / intended `planner.md` design plan)  
**Remediation pass:** 2026-07-10 (schema verify + doc sync)  
**Method:** claims checked against disk, PR **#283** migration, `Database["planner"]` types, `SCREEN-REGISTRY.md`, Linear IPI-476…483, `DESIGN.md` v3.  
**Scope:** design planning only (no React / SQL authored in this audit).

---

## Verdict (updated after remediation)

| | First pass | After remediation |
|---|---|---|
| **Ship as Claude Design brief?** | 🔴 blocked (Kanban AC break) | 🟡 **vocabulary-ready** — still blocked on registry + Hub Linear issue + `.dc.html` |
| Authority-chain (IPI-478 Kanban) | 🔴 45 | 🟢 **95** — phase columns restored |
| Path / SSOT honesty | 🔴 30 | 🟢 **95** — `00-design-plan.md` + banners |
| Data-model discipline | 🟡 78 | 🟢 **95** — verified vs #283 |
| Spec completeness | 🟡 82 | 🟢 **90** — prompts patched |
| Scope hygiene | 🟢 92 | 🟢 **95** |
| Prototype readiness | ⚪ 0 | ⚪ **0** |
| Registry / Hub process | 🔴 | 🔴 **unchanged** |

**Overall after remediation:** design vocabulary is aligned with schema + IPI-478. Do **not** start React until Claude Design `.dc.html` exists for SCR-32. Do **not** implement SCR-35 until a Linear issue exists. Add SCR-32…35 to `SCREEN-REGISTRY.md` before handoff claims “complete.”

---

## 0. Changelog — all improvements applied (2026-07-10)

### 0.1 New files

| File | Purpose |
|------|---------|
| `design-prompts/00-design-plan.md` | **Design SSOT** — progress tracker, scope, Kanban=phases, task IDs, readiness. Replaces the unsaved paste / `uploads/` fiction. |
| `design-prompts/design-prompt-audit.md` | This audit (findings + remediation record). |

### 0.2 Rewritten / heavily updated

| File | Improvements |
|------|----------------|
| `supabase-reference.md` | Full rewrite from PR #283 migration + generated types. Legend: schema-proven / derived / persona / future. Removed invented columns. Documented 3 enums, 10 tables, CHECKs, seed 11 phases, Kanban=phases, access roles only, ApprovalCard actions, engineering caveats updated (`planner` in `config.toml` ✅). |
| `design-prompt-audit.md` | First-pass findings retained; remediation status + this changelog added. |

### 0.3 Patched screen prompts

| File | Improvements |
|------|----------------|
| `SCR-32-planner-workspace.md` | Links to reference + design-plan. **Kanban = phase columns** (IPI-478 AC-B) explicit; task status on cards. List = transient / not in `view_configs`. Instance vs task status chips. ApprovalCard = **Approve · Edit · Discard**. Mobile: nav landing = Dashboard; **deep-link stays on Workspace** reflow. Gate vs task-`blocked` distinguished. Sync-failed state. |
| `SCR-33-planner-dashboard.md` | Personas = **display only**; access = `assignments.role`. At-risk / progress = **derived**. No `production_role`. Cover = entity or placeholder. Links to SSOT docs. |
| `SCR-34-planner-instance-settings.md` | **Access roles only** (`owner\|manager\|contributor\|viewer`). Removed production-role column/invite field. Invite pending/expired/failed hedged (no invented DB invite enum). Links to SSOT docs. |
| `SCR-35-planner-hub.md` | Cover/progress = derived/external. Naming precedence via reference. Still gated on Linear issue. Links to SSOT docs. |

### 0.4 Patched companions

| File | Improvements |
|------|----------------|
| `diagrams.md` | Removed **`AtRisk`** from instance state machine. UI mapping: at-risk = derived amber. Kanban node labeled **phase columns**. |
| `00-review-and-conventions.md` | Points at `00-design-plan.md` + `supabase-reference.md`. Kanban reuse row: deal stages → **workflow phases** (not task statuses). |
| `../planner.md` | Banner: **engineering audit only** — not the design SSOT. |

### 0.5 Schema verification outcomes (relabel / remove)

| Was claimed or implied | Now |
|------------------------|-----|
| Kanban columns = task statuses (“must-fix”) | ❌ **Rejected** — columns = **phases** |
| `at_risk` instance status | ❌ → **derived** amber signal |
| `production_role` / Members production column | ❌ **does not exist** — removed from SCR-34 |
| Cover on `instances` | ❌ → entity asset or muted placeholder |
| Progress % / primary assignee | ❌ → **derived** |
| List in `view_configs` | ❌ → UI-only; stored views = timeline\|kanban\|calendar |
| ApprovalCard Reject / Request changes | ❌ → **Approve · Edit · Discard** |
| `uploads/` paths as SSOT | ❌ → `design-prompts/` |
| Design plan = `planner.md` | ❌ → `00-design-plan.md`; `planner.md` = engineering |
| GRANTs / PostgREST as design blockers | Updated: migration + `schemas` include `planner` on main post-#283; grants follow-ups don’t block design |

### 0.6 Finding status board (first pass → now)

| ID | Finding | Status |
|----|---------|:------:|
| **B1** | Kanban ≠ IPI-478 (status columns) | ✅ **Fixed** |
| **B2** | SCR-32…35 missing from SCREEN-REGISTRY | 🔴 **Open** |
| **B3** | SCR-35 no Linear issue | 🔴 **Open** |
| **B4** | Path / `planner.md` collision | ✅ **Fixed** |
| **R1** | Phase gate vs task blocked conflated | ✅ **Fixed** (SCR-32 + reference) |
| **R2** | SCR-34 production roles as schema | ✅ **Fixed** |
| **R3** | Invented HITL buttons | ✅ **Fixed** |
| **R4** | Mobile deep-link conflict | ✅ **Fixed** (one rule) |
| **R5** | List outside IPI-478 three-view AC | ✅ **Mitigated** (transient / P2 in design-plan) |
| **R6** | Over-claimed “ready” / unverified fields | ✅ **Fixed** (schema verify + honest readiness) |
| **R7** | Conventions vs plan Kanban war | ✅ **Fixed** (all say phases) |
| **F1–F8** | Failure points | ✅ mitigated in docs except **F8** registry |
| Gaps (§4) | Missing UX specs | 🟡 partially addressed; see §4 remaining |

---

## 1. Critical blockers

### B1 — Kanban columns contradict IPI-478 ✅ FIXED

| Source | Says |
|---|---|
| **IPI-478 AC-B** | Columns **per phase**; drag updates `phase_id` + `status` |
| **Now** (`00-design-plan`, SCR-32, supabase-reference, conventions, diagrams) | Same — phase columns; status on **cards** |

**Was:** consolidated paste called status columns an IPI-478 “must-fix.”  
**Done:** that “fix” rejected; all design SSOT files restored to phase Kanban.

---

### B2 — `SCREEN-REGISTRY.md` missing SCR-32…35 🔴 OPEN

**Evidence:** registry still ends at SCR-31.  
**Tracker:** `00-design-plan.md` correctly marks registry 🔴 (no false 🟢).  
**Still required:** add four rows (route, `production-planner`, ⚪ proto, Linear refs).

---

### B3 — SCR-35 Hub has no Linear issue 🔴 OPEN

No `PLN-009` / Hub issue in Linear. SCR-35 + D-PLN-10 remain gated. Do not implement Hub until an issue exists.

---

### B4 — Path / file SSOT wrong ✅ FIXED

| Before | After |
|---|---|
| `uploads/…` citations | All live under `design-prompts/` |
| Design plan confused with `planner.md` | **`00-design-plan.md`** = design; **`planner.md`** bannered engineering-only |

---

## 2. Red flags

### R1 — Gate vs task-blocked ✅ FIXED

SCR-32 + reference: phase gate → column lock + ApprovalCard; task `blocked` → StatusChip / bar only.

### R2 — SCR-34 role axes ✅ FIXED

Members MVP = access role only. Production personas = Dashboard display slots, not a column. No `production_role` in invite dialog.

### R3 — HITL button invention ✅ FIXED

Documented ApprovalCard contract: **Approve · Edit · Discard** everywhere relevant.

### R4 — Mobile deep-link ✅ FIXED

**Rule (single):** Planner **nav landing** on mobile = SCR-33 Dashboard. **Instance deep-links** open SCR-32 mobile reflow (week list / phase accordion) — do not bounce away from the instance. Hub forced mobile = 1-col cards / prefer Dashboard landing.

### R5 — List view scope ✅ MITIGATED

List = optional transient UI mode; not in `view_configs`; design-plan marks Calendar P1 / List optional-P2 vs IPI-478 three-view AC.

### R6 — Over-claim readiness ✅ FIXED

Schema verified; readiness in `00-design-plan` honest (registry/Hub/proto open). Reference uses proven/derived/persona/future legend.

### R7 — Doc war ✅ FIXED

Conventions, SCR-32, reference, design-plan, diagrams, IPI-478 all agree: **Kanban = phases**.

---

## 3. Failure points — residual risk

| # | Failure point | After remediation |
|---|---|---|
| F1 | Status Kanban from bad plan | ✅ Docs fixed — still risk if someone uses old paste |
| F2 | `production_role` invented | ✅ Removed from SCR-34 |
| F3 | Cover on Hub | ✅ Placeholder / entity join documented |
| F4 | Derived fields as stored | ✅ Labeled derived in reference + prompts |
| F5 | AI tools as live | ✅ Reference §9 **future** IPI-482 |
| F6 | Dependency lines | ✅ Three-stage / future IPI-483 in reference |
| F7 | Wrong `planner.md` | ✅ Banner + `00-design-plan.md` |
| F8 | Registry miss | 🔴 **Still open** |

---

## 4. What’s missing (remaining gaps)

| Gap | Status |
|---|---|
| Create-instance / template-picker dedicated prompt | 🟡 Still thin (pointed from Hub + SCR-32 empty only) |
| SCR-32 IntelligencePanel content per view | 🟡 Still thin |
| Concurrent edit copy beyond sync-failed banner | 🟡 Minimal state only |
| Zero-task phase empty column | ⚪ Not specified |
| NavSidebar Planner slot vs More | ⚪ Undecided |
| Shoot Detail schedule embed chrome | ⚪ Diagram only |
| Viewer chrome called out | ✅ SCR-32 read-only + reference matrix |
| Calendar week/day later | ⚪ No AC |
| Invite “already member” copy | 🟡 States hedged; edge copy thin |
| Registry + Hub Linear | 🔴 Open |
| Design-plan file | ✅ `00-design-plan.md` |
| Shared fixture pack (1 instance × 11 phases × …) | ⚪ Suggested, not written |
| Traceability table wireframe→column | ⚪ Suggested, not written |

---

## 5. Critical fixes — completion log

| # | Fix | Status |
|---|-----|:------:|
| 1 | Revert Kanban to phases | ✅ |
| 2 | Add SCR-32…35 to SCREEN-REGISTRY | 🔴 |
| 3 | Persist `00-design-plan.md`; disambiguate `planner.md` | ✅ |
| 4 | Patch SCR-34 access-only | ✅ |
| 5 | ApprovalCard Approve/Edit/Discard | ✅ |
| 6 | Single mobile deep-link rule | ✅ |
| 7 | Demote List vs AC | ✅ |
| 8 | Open Linear for SCR-35 | 🔴 |
| 9 | Template-picker mini-prompt | ⚪ |
| 10 | Honest readiness scores | ✅ |

---

## 6. Suggested improvements (still optional)

- Shared **fixture pack** across SCR-32…35.  
- Wireframe region → `table.column` | derived traceability table.  
- Keep `diagrams.md` as sole Mermaid SSOT (design-plan points at it).  
- Timeline DoD checkbox: colour = status only.  
- Explicit Hub ASCII with muted cover placeholder (prompt text done; wireframe art optional).  
- Optional **status filter** (not columns) on Workspace toolbar.

---

## 7. What was already right (kept)

- Operator-app surface; Zeely Editorial.  
- No `at_risk` status (derived).  
- Entity badges `shoot` / `campaign` / `crm_deal`.  
- Deferred fence (Workflow Builder, Approval History, Comments, Analytics, 6-mode AI).  
- Dependency-line staging; AI/notif future labels.  
- Date-only / overflow / naming precedence (in reference).  
- Reuse: SCR-30 / SCR-25 / SCR-04 / ApprovalCard / ChatDock.  
- SCR-35 gated on Linear — process instinct correct.

---

## 8. Scorecard vs source prompts (current)

| Artifact | Status | Note |
|---|:--:|---|
| `00-design-plan.md` | 🟢 | Design SSOT |
| `supabase-reference.md` | 🟢 | Verified vs #283 + types |
| `00-review-and-conventions.md` | 🟢 | Phase Kanban + SSOT links |
| `SCR-32-*.md` | 🟢 | Phase Kanban, HITL, mobile |
| `SCR-33-*.md` | 🟢 | Personas ≠ DB |
| `SCR-34-*.md` | 🟢 | Access roles only |
| `SCR-35-*.md` | 🟡 | Spec OK; no Linear issue |
| `diagrams.md` | 🟢 | No AtRisk state |
| `../planner.md` | 🟢 | Engineering-only banner |
| `SCREEN-REGISTRY.md` | 🔴 | Missing SCR-32…35 |
| Prototypes `.dc.html` | ⚪ | None |

---

## 9. Recommended next actions

```text
[x] B1 Kanban → phases
[x] B4 00-design-plan.md + planner.md banner
[x] R2–R4 / R7 prompt + diagram patches
[x] Schema verify → supabase-reference rewrite
[ ] B2 Add SCR-32…35 to docs/handoff/SCREEN-REGISTRY.md
[ ] B3 Open Linear issue for SCR-35 Hub (or fold into IPI-479)
[ ] Optional: template-picker appendix + fixture pack
[ ] Claude Design: D-PLN-13/11 → Timeline → phase Kanban → drawer → Dashboard → Members
[ ] Do not start React until SCR-32 .dc.html exists
```

---

## 10. Schema verification (PR #283 + types)

**Sources:** merged PR #283 · `supabase/migrations/20260709000000_planner_schema_rls.sql` · `Database["planner"]` types.

### 10.1 Enums — proven

| Enum | Values |
|------|--------|
| `instance_status` | draft · planned · active · blocked · completed · archived · cancelled |
| `task_status` | todo · in_progress · blocked · done · cancelled |
| `dependency_type` | finish_to_start · start_to_start · finish_to_finish · start_to_finish |

### 10.2 Tables — 10/10 proven

`workflows` · `phases` · `gate_conditions` · `instances` · `tasks` · `dependencies` · `assignments` · `events` · `view_configs` · `notification_rules`

### 10.3 Field audit

| Claim | Verdict |
|-------|---------|
| Task core fields + `assignee_role` (text) + `description` + `parent_task_id` | ✅ proven |
| Instance core fields | ✅ proven |
| Cover / progress / primary assignee / at-risk | ❌ derived/external |
| `assignments.role` four-tier | ✅ CHECK |
| `production_role` | ❌ absent |
| `default_view` timeline\|kanban\|calendar | ✅; List not stored |
| `gate_type` / `required_role` / condition CHECKs | ✅ |
| Seed 11-phase template | ✅ matches migration §8 |

### 10.4 Engineering (design-unblocking)

| Item | After #283 |
|------|------------|
| Migration on `main` | ✅ |
| `config.toml` schemas includes `planner` | ✅ |
| Generated planner types | ✅ when regenerated |
| GRANTs / extra probes | Follow-up (e.g. #295) — design OK |

---

## 11. Consistency matrix — SCR-32…35

| Check | 32 | 33 | 34 | 35 |
|-------|:--:|:--:|:--:|:--:|
| Instance status enum | ✅ | ✅ | — | ✅ |
| Task status enum | ✅ | ✅ | — | — |
| Kanban = phases | ✅ | — | — | — |
| Access roles only | ✅ | ✅ | ✅ | ✅ |
| No `production_role` | ✅ | ✅ | ✅ | ✅ |
| At-risk derived | ✅ | ✅ | — | ✅ |
| Entity badges | — | — | — | ✅ |
| List not persisted | ✅ | — | — | — |
| ApprovalCard A/E/D | ✅ | — | — | — |
| Mobile rule | ✅ | ✅ | — | ✅ |
| Zeely / reuse | ✅ | ✅ | ✅ | ✅ |
| → supabase-reference | ✅ | ✅ | ✅ | ✅ |
| Linear backing | 478 | 479 | 479 | 🔴 |

**Vocabulary / schema consistency:** 🟢 ~95.  
**Process blockers left:** registry · Hub issue · prototypes.
