# IPI-V2-000 · SB-FIX-001 — Merge Record

**Task:** IPI-V2-000 · SB-FIX-001 — Remove anonymous EXECUTE from `get_brand_assets`
**PR title:** IPI-V2-000 · SB-FIX-001 — Remove anonymous EXECUTE from `get_brand_assets`
**PR number:** not present in local commit metadata (merge commit carries no `(#NNN)` suffix; not independently looked up, per action constraints)
**Merge SHA:** `b4f9a6e6b3419ee707fcc8ceee867a69476a8c0d` (`main`)
**Author:** amo-tech-ai · **Merged:** 2026-08-24T02:36:46-05:00

---

## Purpose

Revokes `EXECUTE` on `public.get_brand_assets(uuid, uuid)` (SECURITY DEFINER) from `anon` (and `public`), leaving only `authenticated`. The function body already rejected unauthenticated callers and enforced brand/org membership, but the anonymous role could still *attempt* the call, which Security Advisor flagged as `anon_security_definer_function_executable`.

**Not a no-op:** earlier migrations (`20260703030218_get_brand_assets_rpc.sql`, `20260703240000_shoot_data_contract_nits.sql`, `20260810025951_cld_dna_001_single_source.sql`) revoked from `public`/re-granted `authenticated` but did not drop a separate implicit `GRANT TO anon` that Postgres creates by default on `CREATE FUNCTION`. Live state on `2026-08-24` before this migration: `anon` EXECUTE = `true`. After: `false`.

## Files / systems changed

- `supabase/migrations/20260824064755_ipi_v2_000_sb_fix_001_revoke_anon_get_brand_assets.sql` (new, +15/-0):
  - `revoke execute on function public.get_brand_assets(uuid, uuid) from public, anon;`
  - `grant execute on function public.get_brand_assets(uuid, uuid) to authenticated;`
- No application code changed. `app/src/lib/shoot/get-brand-assets.ts` already calls the RPC exclusively via the authenticated client and is unaffected.
- No other SECURITY DEFINER RPCs, leaked-password protection, or shoot tables touched (explicitly out of scope per PR description).

## Tests / CI results

Per PR test plan (author-reported, live production checks):

- [x] Live: `anon` EXECUTE = `false`; `authenticated` EXECUTE = `true`
- [x] JWT claim for org A owner → own brand returns JSON array
- [x] Same caller → other org brand raises `not_found` (`P0002`)
- [x] Security Advisor `anon_security_definer_function_executable` on this function: 1 → 0
- [ ] Unchecked by reviewer at merge time: confirm migration version `20260824064755` was already applied on `nvdlhrodvevgwdsneplk` and not re-run

No independent CI workflow results (e.g. `supabase-verify-rls`) were recorded in the PR context beyond the author's live checks above.

## Production impact

Migration `20260824064755` was already applied live on project `nvdlhrodvevgwdsneplk` prior to this PR; the PR records that applied change in Git. No production rows changed. Effect is privilege-only: `anon` callers can no longer invoke `get_brand_assets`; `authenticated` callers are unaffected.

## Known limitations

- Does not audit other SECURITY DEFINER RPCs for the same implicit-`anon`-grant pattern.
- Does not enable leaked-password protection.
- Does not change any shoot tables.
- Reviewer confirmation that the migration was not re-run against production was left unchecked in the PR test plan.

## Rollback / cleanup notes

- Rollback **widens access** — do not run in production.
- Restoring the pre-fix (2026-08-24) hole requires: `grant execute on function public.get_brand_assets(uuid, uuid) to anon;`
- Do **not** `grant ... to public` as a rollback — broader than the live pre-state (which had an explicit `anon` grant, not a `public` grant).
- To stay locked down, leave the `revoke` in place; no other cleanup required.

## Follow-up tasks

- Audit remaining SECURITY DEFINER RPCs for the same implicit `GRANT TO anon` default-privilege gap identified here.
- Consider enabling leaked-password protection (called out as explicitly out of scope for this PR).
- Confirm/close out the unchecked reviewer test-plan item (verify no duplicate re-run of `20260824064755` against `nvdlhrodvevgwdsneplk`).