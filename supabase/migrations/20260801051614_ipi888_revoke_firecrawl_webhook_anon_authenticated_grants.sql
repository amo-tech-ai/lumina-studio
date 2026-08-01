-- IPI-888 · SB-HYGIENE-004 — re-revoke processed_firecrawl_webhooks SELECT
-- from anon/authenticated.
--
-- The creating migration (20260718200000_ipi692_processed_firecrawl_webhooks)
-- already ran `REVOKE ALL ... FROM PUBLIC, anon, authenticated` at line 32.
-- Live privileges drifted back to SELECT anyway:
--   relacl = {postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,
--             anon=r/postgres,authenticated=r/postgres}
--
-- Third occurrence of the same drift: IPI-872 (chatbot_*), IPI-875 (mastra
-- shadow), this one. Standing cause is the platform default ACL —
--   pg_default_acl: postgres / public / 'r' =
--     {anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,...}
-- — which auto-grants every new public table to anon+authenticated. Removing
-- that default is a separate, higher-blast-radius change (tracked separately);
-- this migration only re-asserts the intended end state for one table.
--
-- Not a live data leak today: RLS is enabled with zero policies, so anon and
-- authenticated select zero rows regardless. The grant is what keeps the table
-- exposed through PostgREST's schema cache. Defense-in-depth, not an incident.
--
-- Idempotent: safe to re-run.

revoke all on table public.processed_firecrawl_webhooks from anon, authenticated, public;

-- Re-assert the writer role so this file declares the full intended end state
-- rather than only a delta (matches 20260718200000_ipi692 lines 32-33).
grant select, insert, update on table public.processed_firecrawl_webhooks to service_role;
