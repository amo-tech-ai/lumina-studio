-- IPI-668 · SB-TEST-001 — chatbot / lead_intake_drafts privilege matrix
-- Uses information_schema.table_privileges (includes PUBLIC inheritance).
-- Do not use role_table_grants alone — it can omit PUBLIC-inherited grants.
--
-- Also asserts table existence, service_role DML needed by capture-lead,
-- lead_intake_drafts RLS + owner SELECT policy, and claim_lead_draft EXECUTE.

\set ON_ERROR_STOP on

do $$
declare
  bad text;
  tbl text;
  chatbot_tables text[] := array[
    'chatbot_conversations',
    'chatbot_messages',
    'chatbot_events'
  ];
  need_priv text;
  need_privs text[] := array['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
begin
  -- Tables must exist (empty privilege rows must not silently pass)
  foreach tbl in array chatbot_tables || array['lead_intake_drafts']
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise exception '% missing — capture-lead / claim path broken', tbl;
    end if;
  end loop;

  if to_regprocedure('public.claim_lead_draft(uuid, text)') is null then
    raise exception 'claim_lead_draft(uuid, text) missing';
  end if;

  -- anon / authenticated / PUBLIC must have zero privileges on chatbot_* tables
  select string_agg(format('%s.%s→%s:%s', table_schema, table_name, grantee, privilege_type), ', ')
    into bad
  from information_schema.table_privileges
  where table_schema = 'public'
    and table_name = any (chatbot_tables)
    and grantee in ('anon', 'authenticated', 'PUBLIC');

  if bad is not null then
    raise exception 'chatbot_* unexpected privileges: %', bad;
  end if;

  -- service_role must retain full DML on chatbot_* (capture-lead SELECT/INSERT path)
  foreach tbl in array chatbot_tables
  loop
    foreach need_priv in array need_privs
    loop
      if not has_table_privilege('service_role', format('public.%I', tbl), need_priv) then
        raise exception '% service_role missing %', tbl, need_priv;
      end if;
    end loop;

    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = tbl
        and c.relrowsecurity
    ) then
      raise exception '% RLS disabled', tbl;
    end if;
  end loop;

  -- lead_intake_drafts: anon + PUBLIC → none
  select string_agg(format('%s→%s', grantee, privilege_type), ', ')
    into bad
  from information_schema.table_privileges
  where table_schema = 'public'
    and table_name = 'lead_intake_drafts'
    and grantee in ('anon', 'PUBLIC');

  if bad is not null then
    raise exception 'lead_intake_drafts unexpected anon/PUBLIC privileges: %', bad;
  end if;

  -- authenticated → SELECT only
  select string_agg(privilege_type, ', ' order by privilege_type)
    into bad
  from information_schema.table_privileges
  where table_schema = 'public'
    and table_name = 'lead_intake_drafts'
    and grantee = 'authenticated'
    and privilege_type <> 'SELECT';

  if bad is not null then
    raise exception 'lead_intake_drafts authenticated non-SELECT privileges: %', bad;
  end if;

  if not has_table_privilege('authenticated', 'public.lead_intake_drafts', 'SELECT') then
    raise exception 'lead_intake_drafts authenticated missing SELECT';
  end if;

  -- RLS + owner-only SELECT policy must back authenticated SELECT
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'lead_intake_drafts'
      and c.relrowsecurity
  ) then
    raise exception 'lead_intake_drafts RLS disabled — authenticated SELECT is unsafe';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lead_intake_drafts'
      and cmd = 'SELECT'
      and roles @> array['authenticated']::name[]
      and qual is not null
      and qual ilike '%user_id%'
      and qual ilike '%auth.uid%'
  ) then
    raise exception
      'lead_intake_drafts missing owner-only SELECT policy for authenticated';
  end if;

  -- service_role: SELECT + INSERT + UPDATE required by capture-lead idempotent path
  foreach need_priv in array array['SELECT', 'INSERT', 'UPDATE']
  loop
    if not has_table_privilege('service_role', 'public.lead_intake_drafts', need_priv) then
      raise exception 'lead_intake_drafts service_role missing %', need_priv;
    end if;
  end loop;

  -- claim_lead_draft EXECUTE matrix (WEB-015 hand-off)
  if not has_function_privilege(
    'authenticated',
    'public.claim_lead_draft(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'claim_lead_draft authenticated missing EXECUTE';
  end if;

  select string_agg(format('%s→%s', grantee, privilege_type), ', ')
    into bad
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = 'claim_lead_draft'
    and grantee in ('anon', 'PUBLIC')
    and privilege_type = 'EXECUTE';

  if bad is not null then
    raise exception 'claim_lead_draft unexpected EXECUTE grants: %', bad;
  end if;

  raise notice 'ok: chatbot / lead_intake_drafts grant + RLS + claim matrix';
end $$;
