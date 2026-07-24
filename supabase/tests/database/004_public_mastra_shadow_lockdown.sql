-- IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables
-- Phase A lockdown proof for the 33 public.mastra_* shadow tables.
--
-- Asserts: tables still exist (not dropped), RLS on, zero policies,
-- deny-role + PUBLIC ACLs empty (all privilege_type / grantable bits),
-- ownership is not a PostgREST role (DROP OWNED BY is not used —
-- deny roles own zero public.mastra_* objects; owner is postgres),
-- and allow-path: owning/bypass session can count(*) without error
-- (rows preserved for rollback/inspection — counts only, no row payloads).
--
-- Plan math:
--   1 count
--   + 33×(exists + rls + policies + deny_acl + public_acl + owner + allow_count)
--   = 232

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

-- ACL fail-closed for anon/authenticated/service_role (any privilege_type / grantable).
select ok(
    not exists(
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(c.relacl) as acl
      join pg_roles gr on gr.oid = acl.grantee
      where n.nspname = 'public'
        and c.relname = t.tablename
        and c.relacl is not null
        and gr.rolname in ('anon', 'authenticated', 'service_role')
    ),
    format('deny roles have zero ACL entries on public.%I', t.tablename)
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

select ok(
    (
      select r.rolname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      where n.nspname = 'public' and c.relname = t.tablename
    ) not in ('anon', 'authenticated', 'service_role'),
    format('public.%I is not owned by a PostgREST role (no DROP OWNED BY needed)', t.tablename)
  )
from public_mastra_shadows t
order by t.tablename;

-- Allow path: session is owner/bypass (postgres in CI). Prove SELECT count(*)
-- still works after lockdown — rows preserved for rollback/inspection.
-- lives_ok: no error, no row payloads printed into the TAP stream.
select lives_ok(
    format('select count(*)::bigint from public.%I', t.tablename),
    format(
      'owner/bypass can count(*) public.%I (rows preserved; allow path)',
      t.tablename
    )
  )
from public_mastra_shadows t
order by t.tablename;

select * from finish();
rollback;
