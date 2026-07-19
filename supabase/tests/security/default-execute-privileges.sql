-- IPI-684 · SB-SEC-001B — new functions must not inherit anon/authenticated EXECUTE
-- Creates a throwaway function with no explicit GRANT, asserts privilege matrix,
-- then drops it. Mirrors definer-grants.sql style (psql + ON_ERROR_STOP).

\set ON_ERROR_STOP on

do $$
declare
  sig text := 'public._ipi684_default_execute_probe()';
  bad text;
begin
  execute $sql$
    create or replace function public._ipi684_default_execute_probe()
    returns integer
    language sql
    stable
    as $f$ select 1 $f$
  $sql$;

  -- PUBLIC / anon / authenticated must have zero EXECUTE rows
  select string_agg(format('%s→%s', grantee, privilege_type), ', ' order by grantee)
    into bad
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = '_ipi684_default_execute_probe'
    and privilege_type = 'EXECUTE'
    and grantee in ('PUBLIC', 'anon', 'authenticated');

  if bad is not null then
    raise exception
      'IPI-684: new function unexpectedly executable by % — default privileges not applied',
      bad;
  end if;

  if has_function_privilege('anon', sig, 'EXECUTE') then
    raise exception 'IPI-684: anon still has EXECUTE on new function';
  end if;

  if has_function_privilege('authenticated', sig, 'EXECUTE') then
    raise exception 'IPI-684: authenticated still has EXECUTE on new function';
  end if;

  if not has_function_privilege('service_role', sig, 'EXECUTE') then
    raise exception 'IPI-684: service_role lost default EXECUTE on new function';
  end if;

  execute 'drop function public._ipi684_default_execute_probe()';

  raise notice 'ok: default EXECUTE revoke for new public functions (IPI-684)';
end $$;
