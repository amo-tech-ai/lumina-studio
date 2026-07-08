# 11 — Corrected build order

**Scope:** Safe, dependency-respecting implementation sequence.

## Verdict: 🟡 Next safe PRs identified

## Immediate (this week)

| Order | Action | Effort | Risk |
|-------|--------|--------|------|
| 1 | **Ship PR #261** (shoot asset type) | 10min | None — mergeable, green |
| 2 | **Create (operator)/error.tsx** | 15min | P0 blocker |
| 3 | **Fix PR #236** (lean CI fix — rebase) | 15min | CI fix |
| 4 | **Start IPI-389** (CRM Companies list) | 2hr | Low — backend live, StatusChip/EntityList done |
| 5 | **Start IPI-390** (CRM Contacts list) | 2hr | Low — same pattern as 389 |

## Next week

| Order | Action | Effort | Risk |
|-------|--------|--------|------|
| 6 | IPI-391 (CRM Company detail) | 4hr | Low — follows list pattern |
| 7 | IPI-392 (CRM Contact detail + Profile360) | 4hr | Medium — template extraction |
| 8 | IPI-409 (Talent Profile) | 3hr | Low — backend live |
| 9 | IPI-410 (Booking Wizard) | 4hr | Medium — first booking UI |
| 10 | IPI-365 (Pipeline kanban) | 4hr | Medium — drag-and-drop complexity |

## Deferred

| Issue | Reason |
|-------|--------|
| Mobile (IPI-415-425) | Desktop parity gate not met — 7 screens still greenfield |
| CLD backlog (IPI-431-449) | 19 issues — post-MVP |
| IPI-360 (golden eval) | Needed before Groq prod cutover, not blocking current work |
| IPI-367 (Won/Lost gate) | Blocked on IPI-365 (Pipeline) |
