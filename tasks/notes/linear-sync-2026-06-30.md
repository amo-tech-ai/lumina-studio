# Linear sync — forensic audit corrections

**Date:** 2026-06-30  
**Epic comments:** [IPI-254](https://linear.app/amo100/issue/IPI-254) (pass 1 + pass 2)

---

## Pass 1 — spine deps

| Issue | Change |
|-------|--------|
| IPI-209 | Trimmed blockedBy (85/84/183/184 removed); IPI-246 → related; removed blocks IPI-248; assigned S K |
| IPI-243 | Removed blockedBy IPI-246; phase split in description; assigned S K |
| IPI-247 | Removed blockedBy IPI-246; AGENT-MAP targets (creative-director on assets); assigned S K |
| IPI-246 | Removed stale blockers; clarified does NOT block 247/243; assigned S K |
| IPI-268 | blockedBy IPI-248 in description; assigned S K |
| IPI-51 | Partial Done + gaps → IPI-247 |
| IPI-259 | blockedBy IPI-247; scope fix (no campaigns) |
| IPI-262 | blockedBy **IPI-247** only · `/app/preview` · visual-identity |
| IPI-263 | blockedBy **IPI-247 · IPI-268** · `/app/matching` · social-discovery |
| IPI-261 | `/app/assets` scope; coordinate with IPI-156 |
| IPI-156 | `/app/campaigns` scope; blockedBy IPI-268 + IPI-247 |

### Created (pass 1)

| Issue | Title |
|-------|-------|
| [IPI-269](https://linear.app/amo100/issue/IPI-269) | DESIGN-060 Channel Preview DV2 refresh |

---

## Pass 2 — P0 remaining

| Issue | Change |
|-------|--------|
| IPI-267 | **Canceled** · duplicateOf IPI-246 |
| IPI-266 | **Canceled** · duplicateOf IPI-264 |
| IPI-249 | creative-director (not production-planner); blockedBy IPI-247 |
| IPI-251 | blockedBy IPI-243; assigned S K |
| IPI-260 | blockedBy IPI-247; assigned S K |
| IPI-269 | Todo; blockedBy IPI-246 + IPI-247; assigned S K |
| IPI-248 | Removed hard blockedBy IPI-257 (soft gate in description) |
| IPI-257 | Removed blockedBy IPI-255 (parallel lane) |
| IPI-246 | Removed blocks on IPI-261/262/263 |
| IPI-255 | API contracts table; assigned S K |
| IPI-264 | **In Progress**; assigned S K |
| Spine | 248–251, 255, 257–258, 264, 269 assignees → S K |

---

## Pass 3 — relations + assignees + soft gates

| Issue | Change |
|-------|--------|
| IPI-244 | Hard `blockedBy` IPI-243 · assignee S K |
| IPI-262 | IPI-246 soft in description · assignee S K |
| IPI-263 | IPI-246 soft in description · assignee S K |
| IPI-156 | Assignee S K |
| IPI-197 | Assignee S K |
| IPI-253 | Assignee S K |
| IPI-259 | Assignee S K |
| IPI-261 | Removed hard `blockedBy` IPI-248 · soft IPI-248/IPI-246 · assignee S K |
| IPI-264 | Removed hard `blockedBy` IPI-243 · soft gate note |
| IPI-268 | Removed hard `blockedBy` IPI-248 · soft gate note |
| IPI-258 | `blockedBy` IPI-209 + IPI-269 · QA scope updated |

---

## Docs synced (pass 3 — audit refresh)

| File | Version / note |
|------|----------------|
| `MASTER-DEPENDENCIES.md` | v1.6 · audit_score 94/100 |
| `tasks/audit/task-corrections-2026-06-30.md` | Full task names · blocker types · component map |
| `tasks/audit/02-tasks-audit.md` | Scorecard 94/100 |
| `tasks/todo.md` | audit 94/100 |

**Linear:** no further changes required — verified against live relations 2026-06-30.

---

## Docs synced (pass 1–2)

| File | Note |
|------|------|
| `tasks/audit/task-corrections-2026-06-30.md` | P0 applied checklist |
| `tasks/todo.md` | Batch order · IPI-269 row |
| `copilotkit-plan.md` | Route map 🟡 IPI-247 |
| `supabase-plan.md` | IPI-268 linked |
| `LINEAR-ISSUE-FOOTER.md` | Batch order |
| `docs/linear/issues/IPI-209-shoot-detail-page.md` | In Progress · 9 tabs · `[id]` |

---

## Canonical batches

```text
Batch 1:  246 → 247 → 243 → 209 → 255 ∥ 257
Batch 2:  197 · 248 · 268 · 249 · 250 · 261 · 269
Batch 3:  258 · 264 · 253 · 107 · 47
```

---

## Remaining (code, not Linear)

- Ship IPI-247 route-agent fix + test
- Merge IPI-209 from worktree
- IPI-246 EvidenceBlock component PR
- IPI-268 migration-only PR

## Optional (P2)

- IPI-270 route-agent CI gate
- IPI-271 EvidenceBlock Playwright spec
- Broader unassigned triage (non-spine)
