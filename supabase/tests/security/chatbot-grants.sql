-- IPI-668 · SB-TEST-001 — chatbot / lead_intake_drafts privilege matrix
-- Uses information_schema.table_privileges (includes PUBLIC inheritance).
-- Do not use role_table_grants alone — it can omit PUBLIC-inherited grants.

\set ON_ERROR_STOP on

do $$
declare
  bad text;
begin
  -- anon / authenticated / PUBLIC must have zero privileges on chatbot_* tables
  select string_agg(format('%s.%s→%s:%s', table_schema, table_name, grantee, privilege_type), ', ')
    into bad
  from information_schema.table_privileges
  where table_schema = 'public'
    and table_name in ('chatbot_conversations', 'chatbot_messages', 'chatbot_events')
    and grantee in ('anon', 'authenticated', 'PUBLIC');

  if bad is not null then
    raise exception 'chatbot_* unexpected privileges: %', bad;
  end if;

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

  if not has_table_privilege('service_role', 'public.lead_intake_drafts', 'INSERT') then
    raise exception 'lead_intake_drafts service_role missing INSERT (must preserve service-role writes)';
  end if;

  raise notice 'ok: chatbot / lead_intake_drafts grant matrix';
end $$;
