# Merge Record

**Task:** [IPI-832 · ONB2-DB-001 — Onboarding Sessions, Atomic Materialization RPC, and Database Authorization Proof](https://linear.app/amo100/issue/IPI-832) (slice A)  
**PR:** [#701](https://github.com/amo-tech-ai/lumina-studio/pull/701) — IPI-832 · ONB2-DB-001 — Onboarding sessions table and atomic materialize RPC (slice A)  
**Merge SHA:** `91bf039505f5616e5ce8c560327c041a28ece940` (merged to `main`)  
**Merged:** 2026-08-01T05:48:35Z  
**Recorded:** 2026-08-01

## Squashed commits (folded into merge)

- `feat(ipi-832): add onboarding_sessions table and materialize RPC`
- `fix(ipi-832): clear JWT claims before null-auth materialize RLS assert`
- `fix(ipi-832): lock outcome columns, add updated_at trigger, expand pgTAP`
- `fix(ipi-832): SET NULL onboarding session FKs so brand/org delete works`

## Purpose

Adds the database half of a fix for orphan organizations created by the legacy `/app/onboarding` create path (two hand-rolled inserts with manual undo). Introduces a draft `onboarding_sessions` table and a single atomic RPC that converts a draft into exactly one organization + brand pair.

**Single concern:** migration + pgTAP only. No application wiring (slice B = [#703](https://github.com/amo-tech-ai/lumina-studio/pull/703), merged same day).

## Files / systems changed

| Path | Change |
| --- | --- |
| `supabase/migrations/20260801051934_onboarding_sessions_and_materialize_rpc.sql` | Table, unique `(user_id, idempotency_key)`, `set_updated_at` trigger, split RLS (draft-shaped client writes; outcome UPDATE via `app.onboarding_materializing`), `materialize_onboarding_session` SECURITY INVOKER RPC, `ON DELETE SET NULL` FKs |
| `supabase/tests/database/008_onboarding_sessions.sql` | pgTAP plan(17) — constraints, RLS, grants, success/replay, atomic rollback |

## Tests / CI at merge

- Local pgTAP `008_onboarding_sessions.sql` — **17/17 PASS** (pre-merge on slice-A worktree)
- Required-ish CI: `supabase-web015`, `supabase-verify-rls`, `app-build` — green
- Soft infra fails (documented on PR, tracked outside this PR):
  - `supabase-linked-gates` — remote-only `20260801051614` (= IPI-888 / [#702](https://github.com/amo-tech-ai/lumina-studio/pull/702)) → [IPI-891](https://linear.app/amo100/issue/IPI-891)
  - `booking-gate` — QA IPv6 unreachable → [IPI-892](https://linear.app/amo100/issue/IPI-892)

## Production impact (post-apply)

**At merge:** additive DDL only; app did not call the RPC until slice B.

**Applied same day (2026-08-01):**

| Project | Ref | Result |
| --- | --- | --- |
| prod `fashionos` | `nvdlhrodvevgwdsneplk` | `onboarding_sessions` + `materialize_onboarding_session(text,text,text)` verified |
| QA `ipix-planner-staging` | `wtuhdynujhszsbwxlbdi` | same (also applied `20260801051614` while pushing) |

## Known limitations

- Slice A only in this PR — app wiring was slice B (#703)
- `onboarding_sessions.status` independent of `brands.intake_status` by design
- pgTAP mirrors DDL inside `begin…rollback` (same pattern as `007`)

## Rollback

```sql
drop function public.materialize_onboarding_session(text, text, text);
drop trigger if exists onboarding_sessions_set_updated_at on public.onboarding_sessions;
drop table public.onboarding_sessions;
```

## Follow-ups

See [`pr-701-follow-up.md`](./pr-701-follow-up.md).
