-- IPI-245 · SB-TEST-002 — structural RLS proof for every table scripts/verify-rls.mjs
-- exercises behaviorally (anon/authenticated read/write probes across CRM + planner).
-- This file proves the SCHEMA-LEVEL half pgTAP is actually good at: RLS is turned on,
-- and at least one policy exists, per table. It does not replay row-level behavior —
-- that stays in verify-rls.mjs (real JWT sessions, org fixtures, RPC side effects).
--
-- Run: supabase test db --db-url "$DATABASE_URL" supabase/tests/database
--
-- Note: `row_security_active()` reports false for a BYPASSRLS/superuser session
-- (which is what this test connects as) regardless of the table's actual setting —
-- it answers "is RLS enforced for ME right now", not "is RLS turned on for this
-- table". `pg_class.relrowsecurity` is the role-independent structural flag, so
-- that's what these tests assert against.
--
-- Every assertion below is built from a SELECT over a set (never a bare PL/pgSQL
-- PERFORM) — pgTAP's ok()/is() emit their "ok N - ..." line as the function's
-- return value, which only reaches the TAP stream pg_prove reads when it is
-- actually SELECTed. A PERFORM inside a DO block silently drops that output.

set search_path to public, extensions;

begin;
select plan(79);

-- One row per (schema, table) that verify-rls.mjs checks RLS on today.
create temporary table rls_tables (schemaname text, tablename text) on commit drop;
insert into rls_tables (schemaname, tablename) values
  ('public', 'ai_agent_logs'),
  ('public', 'assets'),
  ('public', 'brand_agent_results'),
  ('public', 'brand_competitors'),
  ('public', 'brand_crawl_results'),
  ('public', 'brand_crawls'),
  ('public', 'brand_intake_drafts'),
  ('public', 'brands'),
  ('public', 'brand_scores'),
  ('public', 'brand_social_channels'),
  ('public', 'commerce_product_links'),
  ('public', 'crm_activities'),
  ('public', 'crm_companies'),
  ('public', 'crm_contacts'),
  ('public', 'crm_deals'),
  ('public', 'notifications'),
  ('public', 'organizations'),
  ('public', 'org_members'),
  ('public', 'platforms'),
  ('public', 'image_type_defs'),
  ('public', 'image_specs'),
  ('public', 'recommendation_rules'),
  ('public', 'profiles'),
  ('planner', 'assignments'),
  ('planner', 'dependencies'),
  ('planner', 'events'),
  ('planner', 'instances'),
  ('planner', 'phases'),
  ('planner', 'tasks'),
  ('planner', 'workflows');

-- RLS enabled (relrowsecurity), one assertion per table (30).
select ok(
    exists(
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = t.schemaname
        and c.relname = t.tablename
        and c.relrowsecurity
    ),
    format('%I.%I has row-level security enabled', t.schemaname, t.tablename)
  )
from rls_tables t
order by t.schemaname, t.tablename;

-- At least one policy exists, one assertion per table (30). RLS-enabled-but-zero-
-- policies is a fail-closed misconfiguration (nobody, not even the owner, can read
-- a row) — distinct from "not locked down at all", but still worth catching directly.
select ok(
    (select count(*) from pg_policies p
      where p.schemaname = t.schemaname and p.tablename = t.tablename) >= 1,
    format('%I.%I has at least one RLS policy', t.schemaname, t.tablename)
  )
from rls_tables t
order by t.schemaname, t.tablename;

-- ── IPI-647 · PLN-SEC-002 catalog assert — ported 1:1 from
-- scripts/verify-rls.mjs's assertPlannerAssignmentSelectCatalog() (removed there,
-- see PR description). Pure pg_policies/pg_proc/pg_trigger/pg_constraint
-- introspection — no JWT, no fixtures, exactly pgTAP's sweet spot. (19)

create temporary table plan_select_policies as
select tablename, policyname, permissive, qual
from pg_policies
where schemaname = 'planner'
  and tablename in ('instances', 'tasks', 'dependencies')
  and cmd = 'SELECT';

select is(
    (select count(*) from plan_select_policies where tablename = t.tablename),
    1::bigint,
    format('exactly one SELECT policy on planner.%s', t.tablename)
  )
from (values ('instances'), ('tasks'), ('dependencies')) as t(tablename);

select is(
    (select policyname::text from plan_select_policies where tablename = t.tablename),
    t.expected,
    format('planner.%s SELECT policy is named %s', t.tablename, t.expected)
  )
from (values
    ('instances', 'instances_select_org'),
    ('tasks', 'tasks_select_org'),
    ('dependencies', 'dependencies_select_org')
  ) as t(tablename, expected);

select is(
    r.permissive, 'PERMISSIVE',
    format('planner.%s SELECT policy is PERMISSIVE', r.tablename)
  )
from plan_select_policies r
order by r.tablename;

select ok(
    r.qual ilike '%is_at_least%',
    format('planner.%s SELECT qual requires is_at_least (assignment)', r.tablename)
  )
from plan_select_policies r
order by r.tablename;

select ok(
    r.qual ilike '%is_org_member%',
    format('planner.%s SELECT qual requires is_org_member', r.tablename)
  )
from plan_select_policies r
order by r.tablename;

select ok(
  not exists (
    select 1 from plan_select_policies
    where qual ilike '%is_org_member%' and qual not ilike '%is_at_least%'
  ),
  'no permissive org-only SELECT path remains on planner.instances/tasks/dependencies'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'planner'
      and p.proname = 'is_at_least'
      and pg_get_function_identity_arguments(p.oid) = 'p_instance_id uuid, p_min_role text'
      and p.provolatile = 'v'
  ),
  'planner.is_at_least is VOLATILE (INSERT...RETURNING + bootstrap assignment)'
);

select ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'planner'
      and c.relname = 'instances'
      and t.tgname = 'instances_bootstrap_owner'
      and not t.tgisinternal
      -- tgtype: bit1 BEFORE (2) + bit2 INSERT (4) → both required
      and (t.tgtype & 6) = 6
  ),
  'planner.instances_bootstrap_owner is BEFORE INSERT'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'assignments_instance_id_fkey'
      and conrelid = 'planner.assignments'::regclass
      and condeferrable
      and condeferred
  ),
  'planner.assignments_instance_id_fkey is DEFERRABLE INITIALLY DEFERRED'
);

select * from finish();
rollback;
