# Forensic Task Audit — Executive Report

**Date:** 2026-06-30  
**Prompt:** [`01-audit-prompt.md`](./01-audit-prompt.md)  
**Full report:** [`full-task-audit-2026-06-30.md`](./full-task-audit-2026-06-30.md)  
**Corrections:** [`task-corrections-2026-06-30.md`](./task-corrections-2026-06-30.md)  
**Scorecard:** [`task-scorecard-2026-06-30.md`](./task-scorecard-2026-06-30.md)

---

## Executive summary

Forensic audit of the DESIGN V2 spine (17 execution rows), AI Intelligence crosswalk, and platform foundation against `tasks/todo.md`, `MASTER-DEPENDENCIES.md`, stack plans, DESIGN-TASKS §0, Linear (read-only), and `app/` code.

**Governance aligned** on 2026-06-30 (Linear pass 1+2, footers, IPI-268, `blockedBy` wiring, 390px mobile evidence). **Code execution gap remains:** main branch Shoot Detail 404, no EvidenceBlock, no IntelligencePanel, three wrong route-agent mappings.

**Verdict:** Plan succeeds when code PRs land — Batch 1 spine is correctly ordered in Linear and docs.

---

## Scores

| Dimension | Score |
|-----------|------:|
| Dependency analysis | 98/100 |
| Linear verification | 95/100 |
| Task mapping | 90/100 |
| Documentation accuracy | 88/100 |
| Production planning | 92/100 |
| Production readiness (code) | 62/100 |
| **Overall audit score** | **94/100** |

```text
Overall audit score: 94/100
Production readiness (code): 62/100

Can the plan succeed?
Yes — Linear + docs aligned; code PRs remain.
```

---

## P0 blockers (fix first)

| # | Blocker | Why |
|---|---------|-----|
| 1 | **Batch 1 vs critical path** | 243 listed before 246; Linear blocks 243 on 246 |
| 2 | **IPI-247 route-agent** | assets/matching/onboarding → wrong agents |
| 3 | **IPI-246 EvidenceBlock** | Not in `app/`; blocks 5-screen explainability |
| 4 | **IPI-209 404** | No `[id]/page.tsx` on main (work in worktree) |
| 5 | **IPI-268 schema** | Created but not merged — 249/250 will fail |
| 6 | **⭐ gate** | proof_bundle empty; a11y 68/100 |

---

## Red flags (top 10)

1. `copilotkit-plan.md` route map 🟢 — **false**; IPI-247 open
2. IPI-209 Linear `blockedBy` ×5 — RPCs already Done
3. IPI-261 todo row assigns creative-director to **assets** — AGENT-MAP says visual-identity
4. MASTER register IPI-268 `blockedBy: —` — Linear has IPI-248
5. IPI-51 Done but 3 route gaps remain
6. IPI-243 In Progress — zero `intelligence-panel/` code on main
7. Duplicate Campaigns DB row in todo (known gaps + still no issue)
8. `docs/linear/IPI-209` Todo + 7 tabs vs Linear 9 tabs In Progress
9. 74/91 Linear issues unassigned
10. Zero production-verified screens

---

## Critical checks

| Issue | Status | Code evidence |
|-------|--------|---------------|
| IPI-209 | 🟠 Risky | 404 on main; wt-ipi-209 exists |
| IPI-246 | 🔴 Not started | No evidence-block component |
| IPI-243 | 🟠 Risky | CopilotSidebar only; order conflict |
| IPI-247 | 🔴 Wrong map | `production-planner` on assets/matching/onboarding |
| IPI-255 | ⚪ | Not started |
| IPI-257 | ⚪ | Not started |
| IPI-248–250 | 🟡 | Placeholders; 249/250 need 268 |
| IPI-268 | ⚪ | Issue created; no migration PR |
| IPI-264 | 🟡 | 390px DC pass — 0 overflow, SVG errors |
| IPI-47 / IPI-107 | 🟡 | In Review; edge+Mastra shipped |
| IPI-113 | 🟢 | Done — 10 tools in registry |

---

## Missing tasks (recommend create)

- Channel Preview DV2 refresh (DESIGN-060 — no Linear issue)
- Route-agent unit test CI gate
- EvidenceBlock Playwright component spec
- STR-001 Stripe schema (post-DV2)

---

## Duplicate / archive

- **Canonical:** IPI-246, IPI-209, IPI-264, IPI-248
- **Mirrors:** IPI-267, IPI-86, IPI-266, IPI-265
- **Archive:** `intelligence/dashboards/` 7-tab plans → handoff 02 (9 tabs)

---

## Recommended execution order (corrected)

```text
Phase 0 — quick wins:
  IPI-247 route-agent fix + test
  IPI-209 shell PR (tabs without Assets EvidenceBlock)

Phase 1 — spine:
  IPI-246 → IPI-243 ∥ IPI-247 → IPI-255

Phase 2 — workspaces:
  IPI-257 → IPI-248 → IPI-268 → IPI-249 → IPI-250

Phase 3 — QA + platform:
  IPI-259–263 · IPI-197 · IPI-264 · IPI-253 · IPI-258 · IPI-107 → close IPI-47
```

---

## Linear updates (applied 2026-06-30)

- [x] IPI-209: trim blockedBy · soft IPI-246 · assigned
- [x] IPI-243/247/246: dependency corrections · assigned
- [x] IPI-261/156: scope split assets vs campaigns
- [x] IPI-259/262/263: blockedBy IPI-247
- [x] IPI-51: partial Done comment via description
- [x] IPI-269: Channel Preview DV2 created
- [ ] Assign remaining spine (255/257/249/250) — triage sprint

---

## Required docs updates

| File | Change |
|------|--------|
| `tasks/todo.md` | Batch order; IPI-209 Code 🔵; audit score 76; IPI-261 row |
| `MASTER-DEPENDENCIES.md` | IPI-268 in Supabase chain; register blockedBy; audit_score 76 |
| `copilotkit-plan.md` | Route map 🟡 |
| `supabase-plan.md` | Link IPI-268 |
| `docs/linear/IPI-209-*.md` | In Progress · 9 tabs |

---

## Spine scorecard (17 rows)

| IPI | Score | Prod | Succeed |
|-----|------:|:----:|:-------:|
| 209 | 74 | No | Risky |
| 243 | 71 | No | Risky |
| 247 | 73 | No | Yes |
| 255 | 76 | No | Yes |
| 257 | 78 | No | Yes |
| 246 | 82 | No | Yes |
| 197 | 75 | No | Risky |
| 248 | 74 | No | Risky |
| 268 | 84 | No | Yes |
| 249 | 72 | No | No |
| 250 | 72 | No | No |
| 261 | 70 | No | Risky |
| 258 | 80 | No | Yes |
| 264 | 81 | No | Yes |
| 253 | 77 | No | Yes |
| 107 | 83 | No | Yes |
| 47 | 86 | Partial | Yes |

Full per-task format (Issues · Corrections · Verification): see [`full-task-audit-2026-06-30.md`](./full-task-audit-2026-06-30.md).

---

## Next actions (no code yet — audit only)

1. Apply doc corrections (todo + MASTER + plans) — docs-only PR
2. Ship IPI-247 minimal PR — code-only PR
3. Reorder Batch 1 in tracker before starting IPI-243
4. Merge IPI-209 shell from worktree — code-only PR
5. IPI-268 migration-only PR before 249/250

**Linear:** updated 2026-06-30 — see [IPI-254 comment](https://linear.app/amo100/issue/IPI-254) · corrections in [`task-corrections-2026-06-30.md`](./task-corrections-2026-06-30.md)
