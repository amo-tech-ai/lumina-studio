# Follow-up Work — **IPI-832 · ONB2-DB-001** (slice A / [#701](https://github.com/amo-tech-ai/lumina-studio/pull/701))

**Applicability:** Applies. Merge record: [`pr-701-merge-record.md`](./pr-701-merge-record.md).  
**Review scope:** `20260801051934_onboarding_sessions_and_materialize_rpc.sql`, `008_onboarding_sessions.sql`.

## Status corrections (2026-08-01 — do not re-open closed work)

| Claim in draft post-merge note | Reality now |
| --- | --- |
| Migration not applied to any live DB | **Applied** on prod + QA; RPC/table verified via SQL |
| Slice B not started | **[#703](https://github.com/amo-tech-ai/lumina-studio/pull/703)** merged (`f06c7917`) — app calls RPC + shell `ai_profile` |
| Slice C blocked on **IPI-829 · ONB-QA-001** at 0% | **[IPI-829 · ONB-QA-001 — Provision a QA Supabase project and wire QA](https://linear.app/amo100/issue/IPI-829) Done**; QA has migration; race owned by **IPI-894** |
| Parent **IPI-832** still open | **IPI-832 → Done** after A+B merge (children track remaining proof) |

## Unresolved risks (still open)

1. **Direct UPDATE bypass not pgTAP-proven** — `onboarding_sessions_update_own` gates outcome columns on `app.onboarding_materializing`. Suite exercises RPC + SELECT; no assert that a client `UPDATE … SET status='materialized'` without the GUC is rejected. → **[IPI-893 · ONB2-DB-001b](https://linear.app/amo100/issue/IPI-893)**
2. **Cross-user same `idempotency_key` untested** — unique is `(user_id, idempotency_key)`; two users may share a key value and must get isolated sessions. → **IPI-893**

## Missing tests (additions to `008` only — no DDL) → **IPI-893**

- INSERT policy: reject non-draft / non-null outcome columns / spoofed `user_id`
- DELETE policy: owner allow / stranger deny
- RPC `session not found` (`P0002`) for unknown key
- Direct UPDATE to materialized without GUC → rejected
- Cross-user same idempotency key → two sessions / two orgs

## Deferred scope (named trackers)

| Item | Tracker |
| --- | --- |
| Slice B app wiring | Done — [#703](https://github.com/amo-tech-ai/lumina-studio/pull/703) |
| Slice C QA race (`Promise.all` materialize → identical org/brand) | **[IPI-894 · ONB2-DB-001c — QA race: concurrent materialize returns identical org/brand](https://linear.app/amo100/issue/IPI-894)** |
| Ledger gap `20260801051614` (**IPI-888** file not on `main`) | **[IPI-891 · SB-DRIFT-001](https://linear.app/amo100/issue/IPI-891)** / merge [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702) (**IPI-888 · SB-HYGIENE-004**) |
| booking-gate IPv6 | **[IPI-892 · CI-QA-NET-001](https://linear.app/amo100/issue/IPI-892)** |

## Documentation drift

None from [#701](https://github.com/amo-tech-ai/lumina-studio/pull/701) itself (migration + pgTAP only). This PR updates `ipi-832.md` header/body to the post-merge state (Done + PR SHAs + child trackers).

## Cleanup

None from #701 diff.

## Suggested tasks (created)

1. **[IPI-893 · ONB2-DB-001b — Harden onboarding_sessions RLS/RPC edge-case pgTAP coverage](https://linear.app/amo100/issue/IPI-893)** — `008` only  
2. **[IPI-894 · ONB2-DB-001c — QA race: concurrent materialize returns identical org/brand](https://linear.app/amo100/issue/IPI-894)** — live `QA_DATABASE_URL` concurrency proof
