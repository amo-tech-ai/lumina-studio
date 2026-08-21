-- IPI-801 · MASTRA-PG-011 — public.mastra_* catalog after Path B DROP
-- IPI-1021 · SB-MIG-001 — dual-mode so QA (shadows still present) and
-- production (shadows dropped 2026-08-21) both stay honest.
--
-- QA still has the 33 locked shadows (ledger far behind prod; do not
-- --include-all apply there). Production has 0 public.mastra_* tables.
-- Catalog count must be 0 or 33 — never a partial leftover set.
--
-- Plan math:
--   always: 1 allowlist + 1 catalog-mode + 1 extras
--   + if n=33: 33×(exists + rls + policies + deny_acl + public_acl + owner + allow_count) = 231 → 234
--   + if n=0:  33×(must not reappear) = 33 → 36
--   + if n∉{0,33}: stop after the 3 always-tests (plan 3) so extras/catalog fail closed

set search_path to public, extensions;

begin;

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

create temporary table shadow_state (n bigint) on commit drop;
insert into shadow_state (n)
select count(*)::bigint
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
  and c.relname like 'mastra\_%' escape '\';

select plan(
  case (select n from shadow_state)
    when 0 then 36
    when 33 then 234
    else 3
  end
);

select is(
  (select count(*) from public_mastra_shadows),
  33::bigint,
  'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: expected 33 public shadow names'
);

select ok(
  (select n from shadow_state) in (0, 33),
  format(
    'IPI-801 · MASTRA-PG-011 — catalog public.mastra_* is 0 (prod DROP) or 33 (QA lockdown), got %s',
    (select n from shadow_state)
  )
);

select is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and c.relname like 'mastra\_%' escape '\'
      and c.relname not in (select tablename from public_mastra_shadows)
  ),
  0::bigint,
  'IPI-801 · MASTRA-PG-011 — no public.mastra_* relation outside the 33-name allowlist'
);

-- Production / post-DROP: tables must not reappear (anti-recreation).
select ok(
    to_regclass(format('public.%I', t.tablename)) is null,
    format('public.%I must not reappear after IPI-801 DROP', t.tablename)
  )
from public_mastra_shadows t
where (select n from shadow_state) = 0
order by t.tablename;

-- QA / pre-DROP: Phase A lockdown still holds.
select ok(
    to_regclass(format('public.%I', t.tablename)) is not null,
    format('public.%I still exists (lockdown must not DROP)', t.tablename)
  )
from public_mastra_shadows t
where (select n from shadow_state) = 33
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
where (select n from shadow_state) = 33
order by t.tablename;

select is(
    (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = t.tablename),
    0::bigint,
    format('public.%I has zero RLS policies (fail-closed)', t.tablename)
  )
from public_mastra_shadows t
where (select n from shadow_state) = 33
order by t.tablename;

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
where (select n from shadow_state) = 33
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
where (select n from shadow_state) = 33
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
where (select n from shadow_state) = 33
order by t.tablename;

select lives_ok(
    format('select count(*)::bigint from public.%I', t.tablename),
    format(
      'owner/bypass can count(*) public.%I (rows preserved; allow path)',
      t.tablename
    )
  )
from public_mastra_shadows t
where (select n from shadow_state) = 33
order by t.tablename;

select * from finish();
rollback;
