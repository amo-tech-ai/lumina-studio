-- IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables
-- Phase B anti-recreation proof (inverted from Phase A lockdown assertions).
--
-- Asserts: zero public.mastra_% relations exist (all 33 allowlisted shadow
-- tables dropped by 20260816000000), none of the 33 allowlisted names has
-- reappeared, and the private mastra.* schema tables (threads/messages/
-- workflow_snapshot) still exist.
--
-- Plan math:
--   1 allowlist count
--   + 1 catalog count (zero public.mastra_%)
--   + 1 extras count (allowlist membership)
--   + 33 × absent check (to_regclass IS NULL)
--   + 3 × private mastra.* exists
--   = 39

set search_path to public, extensions;

begin;
select plan(39);

create temporary table retired_public_mastra_shadows (tablename text) on commit drop;

insert into retired_public_mastra_shadows (tablename)
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
  (select count(*) from retired_public_mastra_shadows),
  33::bigint,
  'IPI-801 · Phase B: expected 33 retired public shadow names'
);

-- Anti-recreation: catalog must have ZERO public.mastra_% relations.
select is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and c.relname like 'mastra\_%' escape '\'
  ),
  0::bigint,
  'IPI-801 · Phase B: zero public.mastra_* relations remain (shadows dropped)'
);

-- None of the 33 allowlisted names may reappear (CI fails on recreation).
select is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and c.relname in (select tablename from retired_public_mastra_shadows)
  ),
  0::bigint,
  'IPI-801 · Phase B: no allowlisted public.mastra_* name has reappeared'
);

select ok(
    to_regclass(format('public.%I', t.tablename)) is null,
    format('public.%I is absent (dropped in Phase B)', t.tablename)
  )
from retired_public_mastra_shadows t
order by t.tablename;

-- Private schema must be untouched: the live Mastra tables still exist.
select ok(
  to_regclass('mastra.mastra_threads') is not null,
  'private mastra.mastra_threads still exists'
);

select ok(
  to_regclass('mastra.mastra_messages') is not null,
  'private mastra.mastra_messages still exists'
);

select ok(
  to_regclass('mastra.mastra_workflow_snapshot') is not null,
  'private mastra.mastra_workflow_snapshot still exists'
);

select * from finish();
rollback;
