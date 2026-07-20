# supabase/STATUS.md — Linear-sourced progress summary

> **This is a status summary, not an execution queue.**
> Execution order and dependencies live in [`./todo`](./todo) (Prime master queue).
> Architecture and roadmap live in [`./PLAN.md`](./PLAN.md).
> Linear is the final authority — this file is regenerated from Linear snapshots.
>
> **Snapshot:** 2026-07-20 (J20 audit rev 2) · HEAD `c640f01e` · migrations **216/216 zero drift** · 7 Edge functions ACTIVE

## Document responsibilities (don't duplicate)

| Document | Responsibility |
|---|---|
| [`PLAN.md`](./PLAN.md) | Architecture, goals, decisions, roadmap |
| [`todo`](./todo) | **Single ordered execution queue** (Prime) |
| `STATUS.md` (this file) | Small Linear-sourced summary |
| [Linear Supabase view](https://linear.app/amo100/view/supabase-2d1d1d63cb9c) | **Final authority** for status and dependencies |
| [`j20-supabase-audit.md`](./j20-supabase-audit.md) | J20 audit (evidence + scores + corrections) |

## Status legend

| Dot | Meaning |
|:---:|---|
| 🟢 | Verified complete (Done in Linear + evidence on `origin/main`) |
| 🟡 | Ops / partial (Done in Linear, follow-up open) |
| 🔵 | In Progress |
| 🔴 | Broken, unsafe, or blocked |
| ⚪ | Not started |
| ⏸ | Parked / waiting on explicit gate |
| ⚫ | Canceled or superseded |

## Done (2026-07-19 → 2026-07-20)

| ● | Linear | Evidence |
|:---:|---|---|
| 🟢 | [IPI-679 · SB-SEC-001 — DEFINER revoke](https://linear.app/amo100/issue/IPI-679) | #445 |
| 🟢 | [IPI-667 · SB-EDGE-001 — Quarantine legacy Edge](https://linear.app/amo100/issue/IPI-667) | #443 |
| 🟢 | [IPI-669 · SB-CI-002 — Edge Deno tests in CI](https://linear.app/amo100/issue/IPI-669) | #441 |
| 🟢 | [IPI-678 · SB-OPS-001 — Session-mode DATABASE_URL SSOT](https://linear.app/amo100/issue/IPI-678) | #444 |
| 🟢 | [IPI-681 · SB-SEC-003 — Anon Data API proof](https://linear.app/amo100/issue/IPI-681) | #442 |
| 🟢 | [IPI-691 · SB-SEC-001 — Real user JWT for DEFINER RPC probes](https://linear.app/amo100/issue/IPI-691) | #446 |
| 🟢 | [IPI-685 · SB-EDGE-002 — Harden capture-lead](https://linear.app/amo100/issue/IPI-685) | #450 + #452 |
| 🟢 | [IPI-688 · SB-EDGE-005 — Restrict edge-test](https://linear.app/amo100/issue/IPI-688) | #449 |
| 🟢 | [IPI-686 · SB-EDGE-003 — Crawl Deno tests](https://linear.app/amo100/issue/IPI-686) | #459 `2dcc7324` |
| 🟢 | [IPI-689 · SB-EDGE-006 — Inventory CI](https://linear.app/amo100/issue/IPI-689) | #463 `d547be05` |
| 🟢 | [IPI-692 · SB-EDGE-008 — Firecrawl webhook idempotent](https://linear.app/amo100/issue/IPI-692) | #470 + #477 · deployed v176 |
| 🟢 | [IPI-695 · CF-EDGE-001 — ADR addendum](https://linear.app/amo100/issue/IPI-695) | #448 |
| 🟢 | [IPI-680 · SB-SEC-002 — Disable unused pg_graphql](https://linear.app/amo100/issue/IPI-680) | #502 (extension dropped) |
| 🟢 | [IPI-684 · SB-SEC-001b — Revoke default EXECUTE](https://linear.app/amo100/issue/IPI-684) | #503 |
| 🟢 | [IPI-665 · SB-CI-001 — Sync types field order](https://linear.app/amo100/issue/IPI-665) | #499 |
| 🟢 | [IPI-241 · FIX — Chatbot default-deny RLS policy](https://linear.app/amo100/issue/IPI-241) | #500 |
| 🟢 | [IPI-647 · PLN-SEC-002 — Planner Instance Assignment](https://linear.app/amo100/issue/IPI-647) | #513 (3 migrations 20260720032*) |
| 🟡 | [IPI-690 · SB-EDGE-007 — GEMINI_API_KEY no-rotate](https://linear.app/amo100/issue/IPI-690) | Linear Done; checklist (owner, review date, billing alert, emergency rotate) still blank |

## Active

| ● | Linear | Status | Next |
|:---:|---|:---:|---|
| 🔵 | [IPI-502 · CF-UJ-002 — Journey test: AI Brand Intelligence](https://linear.app/amo100/issue/IPI-502) | In Progress | Finish Gemini baseline; CF rerun blocked by IPI-699 |
| ⚪ | [IPI-697 · CF-EDGE-003 — Gateway REST client + BI](https://linear.app/amo100/issue/IPI-697) | Todo | Implement; one code PR; no deploy |
| ⚪ | [IPI-693 · SB-EDGE-009 — Per-brand crawl quotas](https://linear.app/amo100/issue/IPI-693) | Todo · `needs-product` | Product fills 10-cell limits table → atomic RPC |
| ⚪ | [IPI-699 · CF-EDGE-005 — Canary + rollback (ops-only)](https://linear.app/amo100/issue/IPI-699) | Todo | `blockedBy IPI-697` · define baseline dataset first |
| ⚪ | [IPI-70 · PLT-008 — Production Backup Strategy](https://linear.app/amo100/issue/IPI-70) | Backlog | Isolated restore drill (independent of Edge work) |
| ⚪ | [IPI-460 · CF-AI-010 — AI Cost Tracking](https://linear.app/amo100/issue/IPI-460) | Backlog | Managed Gateway spend + 5 metadata fields |
| ⚪ | [IPI-682 · SB-PERF-001 — DB Advisor from workload](https://linear.app/amo100/issue/IPI-682) | Todo | **blocker removed 2026-07-20** · ready to start |

## Separate lane — Mastra database (epic IPI-486)

| ● | Linear | Status |
|:---:|---|:---:|
| ⚪ | [IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR](https://linear.app/amo100/issue/IPI-616) | Todo |
| ⚪ | [IPI-628 · MASTRA-SUPABASE-002 — Version-Pinned Mastra Schema Migration](https://linear.app/amo100/issue/IPI-628) | Todo · Urgent · blockedBy IPI-616 |
| ⚪ | IPI-629 · MASTRA-SUPABASE-003 — Runtime grants + RLS | (after 628) |
| ⚪ | IPI-630 · MASTRA-SUPABASE-004 — PostgresStore init control | (after 629) |

## Parked

| ● | Linear | Unblock gate |
|:---:|---|---|
| ⏸ | [IPI-698 · CF-EDGE-004 — DNA vision evaluation](https://linear.app/amo100/issue/IPI-698) | After IPI-699 canary |
| ⏸ | [IPI-455 · CF-EDGE-B — Full Worker port](https://linear.app/amo100/issue/IPI-455) | Cancel-gate after IPI-699 |
| ⏸ | [IPI-704 · SB-TEST-002 — pgTAP suite](https://linear.app/amo100/issue/IPI-704) | Clean local replay OR disposable DB OR PLT-010 squash (3 paths) |

## Canceled / superseded

| ● | Task |
|:---:|---|
| ⚫ | ~~IPI-696 · CF-EDGE-002~~ — merged into IPI-697 |
| ⚫ | ~~IPI-700 · CF-EDGE-006~~ — custom Worker auth not needed |
| ⚫ | ~~IPI-687~~ — merged into IPI-685 |

## J20 scorecard (overall 66/100 — not production-ready)

| Area | Score |
|---|---:|
| Plan accuracy | 82 |
| Migration safety | 95 |
| Database security | 78 |
| Edge security | 88 |
| CI coverage | 90 |
| Cost controls | 35 |
| Performance readiness | 55 |
| Cloudflare routing readiness | 45 |
| Operational rollback readiness | 30 |
| **Overall** | **66** |

> Score formula: unweighted mean of the 9 category scores. See [`j20-supabase-audit.md`](./j20-supabase-audit.md) for the full evidence table.
> **Stable foundation; cost + canary + DR gates not met.**

## Hard rules (do not break)

- **Never** `supabase start` for schema truth (remote-only policy)
- **Never** `supabase migration repair` (no squash / rewrite / renumber)
- **Never** `--prune` Edge Functions
- **Never** use Cloudflare AI Gateway spend limits as a Firecrawl cost control
- **Always** use full task names: `IPI-NNN · SPEC — Title`
