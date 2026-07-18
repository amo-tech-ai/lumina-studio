-- IPI-679 · SB-SEC-001 — SECURITY DEFINER RPC privilege matrix
-- Uses information_schema.routine_privileges (includes PUBLIC inheritance).
-- Mirrors chatbot-grants.sql: PUBLIC / anon / authenticated must lack EXECUTE;
-- service_role must retain it. Signatures match live pg_get_function_identity_arguments.

\set ON_ERROR_STOP on

do $$
declare
  bad text;
  rec record;
begin
  for rec in
    select *
    from (
      values
        (
          'search_context_snapshots',
          'public.search_context_snapshots(uuid, vector, text, integer)'
        ),
        (
          'traverse_brand_graph',
          'public.traverse_brand_graph(uuid, integer, text[])'
        ),
        (
          'identify_rls_policies_needing_optimization',
          'public.identify_rls_policies_needing_optimization()'
        )
    ) as t(fn, sig)
  loop
    if to_regprocedure(rec.sig) is null then
      raise exception '% missing — cannot assert grants', rec.sig;
    end if;

    -- PUBLIC / anon / authenticated must have zero EXECUTE rows
    select string_agg(format('%s→%s', grantee, privilege_type), ', ' order by grantee)
      into bad
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name = rec.fn
      and privilege_type = 'EXECUTE'
      and grantee in ('PUBLIC', 'anon', 'authenticated');

    if bad is not null then
      raise exception '% unexpected EXECUTE grants: %', rec.fn, bad;
    end if;

    if not has_function_privilege('service_role', rec.sig, 'EXECUTE') then
      raise exception '% service_role missing EXECUTE', rec.sig;
    end if;

    -- Fixed search_path (not mutable default)
    if not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.oid = to_regprocedure(rec.sig)
        and p.proconfig is not null
        and exists (
          select 1
          from unnest(p.proconfig) cfg
          where cfg like 'search_path=%'
        )
    ) then
      raise exception '% missing fixed search_path', rec.sig;
    end if;
  end loop;

  raise notice 'ok: definer RPC grant + search_path matrix (IPI-679)';
end $$;
