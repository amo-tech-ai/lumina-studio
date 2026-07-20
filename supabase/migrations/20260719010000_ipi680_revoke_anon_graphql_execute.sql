-- IPI-680 · SB-SEC-002 — Approach A attempt (anon EXECUTE revoke)
-- IPI-728 · SB-MIG-002 — existence-guarded REVOKE (fresh-project safe)
--
-- Applied on remote before discovering postgres cannot revoke
-- supabase_admin-owned GraphQL ACLs (REVOKE is a silent no-op warning).
-- Follow-up migration drops pg_graphql instead.
--
-- Fresh Supabase projects may lack graphql.* / graphql_public.* routines.
-- Unguarded REVOKE aborts the chain before the drop-extension migration runs.
-- Linked remotes that already applied this version do not re-run it.

do $ipi728_revoke$
declare
  r record;
begin
  for r in
    select *
    from (
      values
        ('graphql_public.graphql(text, text, jsonb, jsonb)'::text),
        ('graphql.resolve(text, jsonb, text, jsonb)'::text),
        ('graphql._internal_resolve(text, jsonb, text, jsonb)'::text)
    ) as t(sig)
  loop
    if to_regprocedure(r.sig) is not null then
      execute format('revoke execute on function %s from anon', r.sig);
    end if;
  end loop;
end;
$ipi728_revoke$;
