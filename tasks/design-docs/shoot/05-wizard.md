# 05 — Shoot Wizard checklist

Route `/app/shoots/new` · 6-step client wizard (`new/page.tsx` — `"use client"`).
Scope: IPI-274 visual reskin over the behavior-frozen flow. **Reuse-only** for approval UI
(`hitl/{Deliverable,ShotList,Budget}ApprovalCard.tsx`) — do **not** build an `AiDraftRow`.
Legend: ✅ verified live · 🟡 known gap · ⬜ not yet run.

## Steps (data source · empty · error)

| # | Step | Gate | Tool / endpoint | Empty | Error | Status |
|---|------|------|-----------------|-------|-------|--------|
| 1 | Basics | — | brands query / URL params | prompt to pick brand | inline field error | ✅ gate blocks until brand+name+≥1 channel |
| 2 | Brief | — | `suggestShootBrief` → `/api/shoots/suggest-brief` | "Generate brief" CTA | `role="alert"` banner + editable textarea | ✅ / 🟡 AI-1: 500 (provider access), no retry affordance |
| 3 | Deliverables | Gate 1 | `planDeliverables` → `workflows/shoot-wizard` | "Plan deliverables" CTA | AI error + retry | ✅ 4 deliverables · 27 assets, approve → `resume` 200 |
| 4 | Shot List | Gate 2 | `generateShotListDraft` → `workflows/resume` | "Generate shots" CTA | AI error + retry | ✅ 11 shots, approve → `resume` 200 |
| 5 | Budget | Gate 3 | `estimateShootBudget` → `workflows/resume` | hide until generated | AI error + retry | ✅ $3,679, approve → `commit` 201 |
| 6 | Confirmation | — | committed draft | n/a | commit error + retry | ✅ real shoot id, 2 exit links, no dead end |

## Behavior (reskin must not break)

- [x] Back → previous step · Continue advances
- [x] Each of 3 gates blocks Continue until AI fields approved/edited
- [x] Edit a draft field persists; Approve marks reviewed
- [x] Commit creates shoot + shows id / status `planning`
- [ ] Brief autogen success path (blocked in this env by AI-1)
- [ ] Dirty-exit guard on leaving with unsaved changes
- [x] No wizard-originated console errors (only the `suggest-brief` 500 fetch)

## Accessibility

- [x] Step inputs carry `aria-label` (Deliverable/Shot cells)
- [ ] Stepper `aria-current="step"`; completed vs todo conveyed non-visually
- [ ] "Why" disclosure semantics + confidence read out (UX principle #9 — not shipped)
- [ ] Visible focus ring on text inputs (A11Y-2: color-only, WCAG 2.4.7 risk)
- [ ] axe-core / Lighthouse automated scan

## Open items

- 🟡 **AI-1** `POST /api/shoots/suggest-brief` → 500 (`AI_APICallError: project denied access`, `route.ts:62`). Fails safe; add retry affordance + surface reason. Env/provider, not reskin.
- 🟡 No AI confidence / per-recommendation "why" on deliverables/shots/budget.
- 🟡 No draft persistence — refresh likely loses progress.
- ⬜ Downstream render (Shoots List / Shoot Detail) of the committed shoot not re-audited.

Full evidence: `tasks/design-docs/tests/104-shoot-wizard-e2e-report.md`.
