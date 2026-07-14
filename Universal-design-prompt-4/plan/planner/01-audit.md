# Production Planner — Plan Audit

**Date:** 2026-07-09
**Auditor scope:** `plan/planner/architecture-plan.md`, `wireframes.md`, `mermaid-diagrams.md` vs. Linear epic [IPI-484](https://linear.app/amo100/issue/IPI-484/production-planner-epic-tracker), its 8 sub-issues, the real spec files at `linear/issues/IPI-476..483-PLN-*.md`, actual GitHub PRs, and the existing Claude Design library at `Universal-design-prompt5/Pages/`.
**Method:** every claim below was checked against disk (specs, migrations, agent registry) or a live system (Linear MCP, `gh pr`) — nothing here is taken from the plan doc's own word.

## Dot legend
🟢 verified correct/on track · 🟡 works but needs a fix or attention · ⚪ not started / not yet applicable · 🔴 blocking error or critical risk

## Scorecard

| Area | Score | Grade |
|---|---|---|
| Linear epic ↔ sub-issue dependency chain | 96/100 | 🟢 |
| Real spec quality (`linear/issues/IPI-476..483-PLN-*.md`) | 90/100 | 🟢 |
| `architecture-plan.md` accuracy vs. current reality | 55/100 | 🔴 |
| `wireframes.md` accuracy vs. specs | 80/100 | 🟡 |
| `mermaid-diagrams.md` accuracy vs. specs | 92/100 | 🟢 |
| IPI-476 (Foundation) implementation | 75/100 | 🟡 |
| IPI-477–483 (not started) | — | ⚪ |
| Design-prompt coverage for new Planner UI | 20/100 | 🔴 |
| SLA health | — | 🔴 |

**Overall: the plan's engineering substance is sound (specs, sequencing, schema audit) but the planning docs in this folder are stale, and the design pipeline is missing entirely for 3 new screens.** Neither is a rewrite — both are a sync pass.

---

## 1. Linear epic vs. sub-issues — 🟢 correct

IPI-484 tracks IPI-476→483, and every sub-issue's "Blocked by / Unblocks" matches the epic's own dependency table and Gantt exactly:

```
IPI-476 → IPI-477 → IPI-478 → { IPI-479, IPI-480 → IPI-481, IPI-482 } → IPI-483
```

Critical path ≈ 476(14d)+477(10d)+478(14d)+479(10d)+483(12d) = **60 working days**, consistent with the architecture plan's own 12-week phased estimate. No cycles, no orphaned tasks, no missing blockers. This part of the plan is real work, not vaporware.

🔴 **SLA risk:** IPI-476 and the IPI-484 epic itself both show `slaBreachesAt: 2026-07-10` — **tomorrow**. IPI-476 is "In Progress" with two PRs open but **not yet merged**. This isn't a plan-quality issue, it's an operational one: flag to whoever owns SLA policy before it fires.

---

## 2. `architecture-plan.md` — 🔴 stale, needs a sync pass

This is the single biggest finding. The document was written *before* IPI-476 went through its audit revision, and nothing in this folder was updated afterward.

| # | Finding | Evidence | Severity |
|---|---|---|---|
| 1 | **Task IDs are wrong.** Section 13 lists `IPI-300`–`IPI-307`. The real, currently-tracked issues are `IPI-476`–`IPI-483`. | Linear epic IPI-484 lists 476–483; no IPI-300 series exists in this workspace. | 🔴 Anyone following this doc to "open IPI-300" will fail. |
| 2 | **Schema section (§4.1) is behind the audited schema.** Plan lists 9 tables with a binary org-member RLS model. The real, audited IPI-476 spec (already merged into 2 open PRs) has **10 tables + 3 enums**, a **four-tier RLS role matrix** (owner/manager/contributor/viewer via `planner.is_assigned`/`planner.is_at_least` helpers), status enums, cycle detection, and 6 indexes. | IPI-476 description ("Audit score: 84/100... Key changes per audit"); PR #283 diff (`supabase/migrations/20260709000000_planner_schema_rls.sql`, 627 LOC). | 🟡 Not wrong, just superseded — the audit already fixed real gaps (no dedup constraint, no role granularity) that this doc still describes as the plan. |
| 3 | **"Next Step" (§15) points at a path and state that no longer exist.** It says convert the plan into `docs/linear/issues/IPI-300.md`…`IPI-307.md` and "open IPI-300 for implementation in a fresh worktree." The real specs already exist at `linear/issues/IPI-476-PLN-001-....md` (no `docs/` prefix) through `IPI-483-PLN-008-...md`, and IPI-476 is already mid-implementation with 2 PRs against CI. | `find` confirms 8 real spec files at `linear/issues/`; `gh pr view 283/284`. | 🟡 The step this doc tells the reader to do next was already done, one level deeper than described. |
| 4 | Two-PR split for IPI-476 (schema vs. engine, "prevents oversized ~250+ LOC migration") isn't mentioned anywhere in the plan. | IPI-476 description, PR #283 (627 LOC) + #284 (1012 LOC). | ⚪ Not an error, just missing context worth back-porting. |

**Fix:** don't hand-edit this file piecemeal — the real specs in `linear/issues/` are now the source of truth. Either (a) regenerate `architecture-plan.md` §4, §13, §15 from those specs, or (b) add a one-line banner at the top of the file pointing to `linear/issues/IPI-476-PLN-001-...md` as canonical and marking §13/§15 historical. Option (b) is the lazier, safer fix — it's a planning artifact, not code, so it doesn't need to be perfectly current, just not actively misleading.

---

## 3. `wireframes.md` — 🟡 mostly consistent, two drift points

- Screen inventory (§1), routes, and states all match the real specs' embedded wireframes almost verbatim (good sign these were generated together).
- **Drift 1:** Wireframe 6 (Notification Center) describes it as something to build. The real IPI-481 spec explicitly scopes it as **"reuse existing"** (SCR-15 already ships this) — IPI-481 only adds planner CTA links and a mute-settings panel. Low severity, but worth a one-line correction so nobody rebuilds SCR-15 from scratch.
- **Drift 2:** Wireframe 7 (Instance Settings) shows 4 tabs — Members / Workflow / Notifications / Danger. The real IPI-479 acceptance criteria only commit to the **Members** tab for MVP. The other 3 tabs are aspirational, not currently blocked/tracked by any issue. Fine as a north star, but the audit calls it out so nobody assumes Workflow/Danger tabs are in scope for IPI-479's "Done."

---

## 4. `mermaid-diagrams.md` — 🟢 accurate

Cross-checked the C4 container, ERD, Gantt, and state diagram against the real specs (IPI-480's sequence diagram, IPI-483's flowchart) — they match closely enough to be clearly derived from the same source. No action needed.

---

## 5. Implementation status (grounded in GitHub, not the plan doc)

| Task | Linear status | Reality check | Grade |
|---|---|---|---|
| IPI-476 Schema & engine core | In Progress | PR #283 (schema+RLS, 627 LOC) + PR #284 (engine+types+24 tests, 1012 LOC) — **both open, both green CI** (app-build, booking-gate, supabase-web015 all pass) | 🟡 healthy but unmerged, SLA breaches tomorrow |
| IPI-477 Shoot timeline template | Backlog | Not started; correctly blocked on 476 | ⚪ |
| IPI-478 Timeline/Kanban/Calendar UI | Backlog | Not started; spec has an ASCII wireframe but **no Claude Design file** (see §6) | ⚪ / 🟡 process risk |
| IPI-479 Role-based views | Backlog | Not started | ⚪ |
| IPI-480 Real-time sync | Backlog | Not started | ⚪ |
| IPI-481 Notifications | Backlog | Not started | ⚪ |
| IPI-482 Mastra AI tools + HITL | Backlog | `production-planner` agent already registered (`app/src/mastra/agents/index.ts:25`), so the extension point this spec assumes is real, not hypothetical | ⚪ |
| IPI-483 Workflow v2 | Backlog | Not started | ⚪ |

Confirmed real (not fictional integration points the plan invented): `shoot.shoots` schema exists (`20260622120000_shoot_core_schema.sql`), `public.campaigns` exists (`20260707100000_ipi268_campaigns_schema.sql`), `public.crm_deals` / CRM schema exists (`20260704090000_crm_core_schema.sql`), and the `production-planner` Mastra agent is already live. Section 11 of the architecture plan ("Integration with Existing Modules") is accurate.

---

## 6. Design-prompt gap — 🔴 the part you flagged is real

Per this repo's own convention (every shipped operator surface has a `*.dc.html` in `Universal-design-prompt5/Pages/` **before** production code lands — see SCR-01 through SCR-31), the Planner has **zero Claude Design files**. IPI-478 and IPI-479's specs carry only ASCII-art wireframes, which is a lighter bar than every other screen in this system got.

**Needed, ranked by what's about to be built (IPI-478 is next in the dependency chain after 476/477):**

| New screen | Route | Backing issue | Suggested ID |
|---|---|---|---|
| Planner Workspace — Timeline / Kanban / Calendar (view-toggle shell) | `/app/planner/[instanceId]` | IPI-478 (+ dependency lines for IPI-483) | SCR-32 |
| Planner Role Dashboard | `/app/planner/dashboard` | IPI-479 | SCR-33 |
| Planner Instance Settings (Members tab only, matching MVP scope) | `/app/planner/[instanceId]/settings` | IPI-479 | SCR-34 |

**Reuse, don't recreate:**
- Notification Center → **SCR-15**, extend only (matches IPI-481's own "reuse existing" scope).
- Role-dashboard visual pattern → **SCR-25** (Role Dashboards) is the closest existing analog (stat cards + recent items), but it's Model/Agency-facing (offers to accept/decline). SCR-33 needs its own file since the persona set (producer/photographer/retoucher/client_approver) and cards (My Tasks/Needs Approval/At Risk) differ — reference SCR-25's layout, don't fork its content.
- Kanban interaction pattern → **SCR-30** (CRM Pipeline) already has the desktop-kanban/mobile-accordion pattern this repo uses; SCR-32's kanban view should follow it for consistency rather than inventing a new drag/drop pattern.

Numbering: `SCR-12`, `13`, `14`, `19` are gaps in the existing index (reserved/retired) — used `32`+ instead of guessing at intent for those gaps.

**This audit does not author the `.dc.html` files.** Per this project's design ownership rule, screen visuals are Claude Design's job, not Claude Code's — the action item is to open a Claude Design session against SCR-32/33/34 before IPI-478 implementation starts, so the UI is built from an approved design file instead of the spec's ASCII wireframe (which is what happened for zero other screens in this system).

**Update 2026-07-09:** the design briefs for SCR-32/33/34 (component inventory reviewed against the live library, responsive/state/a11y notes, and 6 supporting Mermaid diagrams) are now written at `plan/design-prompts/`. What's still outstanding is running an actual Claude Design session against them to produce the `.dc.html` files themselves.

---

## 7. Ranked next actions

1. 🔴 **Now:** merge or explicitly extend the SLA on IPI-476 (PRs #283/#284 are green, unmerged, breach tomorrow).
2. 🔴 **Before IPI-478 starts:** commission SCR-32 (Planner Workspace), SCR-33 (Role Dashboard), SCR-34 (Settings) in Claude Design so the UI PR has a real design file to build from, not just the spec's ASCII wireframe.
3. 🟡 **Low effort, do anytime:** patch `architecture-plan.md` — fix §13's task IDs (300s → 476–483), add a pointer to `linear/issues/` as canonical, correct §15's "next step" (already done, one level past what's described).
4. 🟡 **Low effort:** fix `wireframes.md` Wireframe 6 to say "reuse SCR-15" instead of implying a new build, and annotate Wireframe 7's Workflow/Danger tabs as post-MVP (not in IPI-479's acceptance criteria).
5. ⚪ No action needed on `mermaid-diagrams.md` or the Linear dependency chain — both are accurate.
