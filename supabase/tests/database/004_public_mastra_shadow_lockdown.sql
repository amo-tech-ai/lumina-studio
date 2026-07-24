-- IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables
-- Phase A lockdown proof for the 33 public.mastra_* shadow tables.
--
-- Asserts: tables still exist (not dropped), RLS on, zero policies, and
-- anon / authenticated / service_role have zero effective table privileges.
-- PUBLIC ACL (grantee 0) must be absent.
--
-- Plan math: 1 count + 33×(exists + rls + policies + 3 role denies + public) = 1 + 33×7 = 232

set search_path to public, extensions;

begin;
select plan(232);

create temporary table public_mastra_shadows (tablename text) on commit drop;

insert into public_mastra_shadows (tablename)
values
  ('mastra_agent_versions'),
  ('mastra_agents'),
  ('mastra_ai_spans'),
  ('mastra_background_tasks'),
  ('mastra_channel_config'),
  ('mastra_channel_installations'),
  ('mastra_dataset_items'),
  ('mastra_dataset_versions'),
  ('mastra_datasets'),
  ('mastra_experiment_results'),
  ('mastra_experiments'),
  ('mastra_favorites'),
  ('mastra_mcp_client_versions'),
  ('mastra_mcp_clients'),
  ('mastra_mcp_server_versions'),
  ('mastra_mcp_servers'),
  ('mastra_messages'),
  ('mastra_observational_memory'),
  ('mastra_prompt_block_versions'),
  ('mastra_prompt_blocks'),
  ('mastra_resources'),
  ('mastra_schedule_triggers'),
  ('mastra_schedules'),
  ('mastra_scorer_definition_versions'),
  ('mastra_scorer_definitions'),
  ('mastra_scorers'),
  ('mastra_skill_blobs'),
  ('mastra_skill_versions'),
  ('mastra_skills'),
  ('mastra_threads'),
  ('mastra_workflow_snapshot'),
  ('mastra_workspace_versions'),
  ('mastra_workspaces');

select is(
  (select count(*) from public_mastra_shadows),
  33::bigint,
  'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: expected 33 public shadow names'
);

select ok(
    to_regclass(format('public.%I', t.tablename)) is not null,
    format('public.%I still exists (lockdown must not DROP)', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select ok(
    exists(
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t.tablename
        and c.relrowsecurity
    ),
    format('public.%I has RLS enabled', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select is(
    (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = t.tablename),
    0::bigint,
    format('public.%I has zero RLS policies (fail-closed)', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select ok(
    not has_table_privilege('anon', format('public.%I', t.tablename), 'SELECT')
    and not has_table_privilege('anon', format('public.%I', t.tablename), 'INSERT')
    and not has_table_privilege('anon', format('public.%I', t.tablename), 'UPDATE')
    and not has_table_privilege('anon', format('public.%I', t.tablename), 'DELETE'),
    format('anon has zero DML on public.%I', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select ok(
    not has_table_privilege('authenticated', format('public.%I', t.tablename), 'SELECT')
    and not has_table_privilege('authenticated', format('public.%I', t.tablename), 'INSERT')
    and not has_table_privilege('authenticated', format('public.%I', t.tablename), 'UPDATE')
    and not has_table_privilege('authenticated', format('public.%I', t.tablename), 'DELETE'),
    format('authenticated has zero DML on public.%I', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select ok(
    not has_table_privilege('service_role', format('public.%I', t.tablename), 'SELECT')
    and not has_table_privilege('service_role', format('public.%I', t.tablename), 'INSERT')
    and not has_table_privilege('service_role', format('public.%I', t.tablename), 'UPDATE')
    and not has_table_privilege('service_role', format('public.%I', t.tablename), 'DELETE'),
    format('service_role has zero DML on public.%I', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select ok(
    not exists(
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(c.relacl) as acl
      where n.nspname = 'public'
        and c.relname = t.tablename
        and c.relacl is not null
        and acl.grantee = 0
    ),
    format('PUBLIC has no ACL entries on public.%I', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

select * from finish();
rollback;
