# Follow-up Work — IPI-832 · ONB2-DB-001 (slice A / PR #701)

**Applicability:** Applies. Merge record: [`pr-701-merge-record.md`](./pr-701-merge-record.md).  
**Review scope:** `20260801051934_onboarding_sessions_and_materialize_rpc.sql`, `008_onboarding_sessions.sql`.

## Status corrections (2026-08-01 — do not re-open closed work)

| Claim in draft post-merge note | Reality now |
| --- | --- |
| Migration not applied to any live DB | **Applied** on prod + QA; RPC/table verified via SQL |
| Slice B not started | **[#703](https://github.com/amo-tech-ai/lumina-studio/pull/703) merged** (`f06c7917`) — app calls RPC + shell `ai_profile` |
| Slice C blocked on IPI-829 at 0% | **[IPI-829](https://linear.app/amo100/issue/IPI-829) Done**; QA has migration; slice C can proceed |
| Parent IPI-832 still open | **IPI-832 → Done** after A+B merge |

## Unresolved risks (still open)

1. **Direct UPDATE bypass not pgTAP-proven** — `onboarding_sessions_update_own` gates outcome columns on `app.onboarding_materializing`. Suite exercises RPC + SELECT; no assert that a client `UPDATE … SET status='materialized'` without the GUC is rejected.
2. **Cross-user same `idempotency_key` untested** — unique is `(user_id, idempotency_key)`; two users may share a key value and must get isolated sessions.

## Missing tests (additions to `008` only — no DDL)

- INSERT policy: reject non-draft / non-null outcome columns / spoofed `user_id`
- DELETE policy: owner allow / stranger deny
- RPC `session not found` (`P0002`) for unknown key
- Direct UPDATE to materialized without GUC → rejected
- Cross-user same idempotency key → two sessions / two orgs

## Deferred scope (named elsewhere)

| Item | Tracker |
| --- | --- |
| Slice B app wiring | Done — #703 |
| Slice C QA race (`Promise.all` materialize) | Still needed — start when ready (QA migration live) |
| Ledger gap `20260801051614` | [IPI-891](https://linear.app/amo100/issue/IPI-891) / merge [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702) |
| booking-gate IPv6 | [IPI-892](https://linear.app/amo100/issue/IPI-892) |

## Documentation drift

None from #701 itself (migration + pgTAP only). This folder’s audit `ipi-832.md` header still says Todo/no PRs — update when convenient (separate docs concern).

## Cleanup

None from #701 diff.

## Suggested task (created)

**[IPI-893 · ONB2-DB-001b — Harden onboarding_sessions RLS/RPC edge-case pgTAP coverage](https://linear.app/amo100/issue/IPI-893)**

Scope: INSERT/DELETE policy asserts, direct-update bypass, session-not-found path, cross-user key isolation — all in `008_onboarding_sessions.sql` only.
