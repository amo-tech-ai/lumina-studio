# 04 — CRM audit

**Scope:** 30 CRM issues. Backend done, UI in Todo/Backlog.

## Verdict: 🟡 82/100 — Backend solid, UI chain correctly sequenced

## Status breakdown

{'Backlog': 11, 'Todo': 10, 'Done': 8, 'In Progress': 1}

## Key findings

| Area | Grade | Evidence |
|------|-------|----------|
| Schema + RLS (IPI-362) | 🟢 Done | crm_companies/contacts/deals/activities all live |
| CRM agent (IPI-368) | 🟢 Done | crm-assistant Mastra agent shipped |
| Companies UI (IPI-363) | 🟢 Done | Companies list + detail screens |
| Contacts UI (IPI-364) | 🟢 Done | Contacts list + detail screens |
| Deal detail (IPI-366) | 🟢 Done | Deal detail read + ungated stage moves |
| CRM design (IPI-373) | 🟡 In Progress | Claude Design prompts completing |
| Pipeline (IPI-365) | 🟡 Todo | Kanban + ungated stage moves + Realtime |
| Won/Lost gate (IPI-367) | 🟡 Todo | HITL gate + brand conversion — **blocked by IPI-365** |
| CRM QA (IPI-370) | 🟡 Todo | MVP acceptance verification |
| Company list React (IPI-389) | 🟡 Todo | SCR-26 parity |
| Contact list React (IPI-390) | 🟡 Todo | SCR-28 parity |
| Company detail React (IPI-391) | 🟡 Todo | RF-04a |
| Contact detail React (IPI-392) | 🟡 Todo | RF-04b |
| Pipeline React (IPI-395) | ⚪ Backlog | SCR-30 parity |
| Deal detail React (IPI-396) | ⚪ Backlog | SCR-31 parity |
| Company detail React (IPI-393) | ⚪ Backlog | SCR-27 parity |
| Contact detail React (IPI-394) | ⚪ Backlog | SCR-29 parity |

## Execution order check

Expected: 388 → 391 → 392 → 365 → 367 → 370

| Link | Status |
|------|--------|
| IPI-388 (RF-03 CRM lists) | ✅ Done |
| → IPI-391 (Company detail) | ✅ Todo, correctly ordered |
| → IPI-392 (Profile360) | ✅ Todo, correctly ordered |
| → IPI-365 (Pipeline) | ✅ Todo — can start after 391 |
| → IPI-367 (Won/Lost) | ✅ Todo — blocked by 365 correctly |
| → IPI-370 (QA) | ✅ Todo — correctly last |

## Recommended action

Execute in order: 389 → 390 → 391 → 392 → 365 → 367 → 370. No blockers in the chain.
