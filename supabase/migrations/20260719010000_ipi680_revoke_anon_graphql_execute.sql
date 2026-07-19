-- IPI-680 · SB-SEC-002 — Approach A attempt (anon EXECUTE revoke)
--
-- Applied on remote before discovering postgres cannot revoke
-- supabase_admin-owned GraphQL ACLs (REVOKE is a silent no-op warning).
-- Follow-up migration drops pg_graphql instead.

revoke execute on function graphql_public.graphql(text, text, jsonb, jsonb)
  from anon;

revoke execute on function graphql.resolve(text, jsonb, text, jsonb)
  from anon;

revoke execute on function graphql._internal_resolve(text, jsonb, text, jsonb)
  from anon;
