-- IPI-245 · SB-TEST-002 — mastra schema (IPI-628/629): RLS + grant/policy proof for
-- the 24 mastra_* tables and the hyperdrive_mastra_runtime role.
--
-- hyperdrive_mastra_runtime carries no JWT identity (unlike anon/authenticated), so
-- testing it is simpler than the CRM cases: SET LOCAL ROLE, then a bare query — no
-- request.jwt.claim.sub emulation needed.
--
-- What this file does NOT do: open a second physical connection with real
-- password/network auth. SET LOCAL ROLE is privilege escalation inside an
-- already-superuser test session — it never exercises the actual Hyperdrive
-- connection-string/credential/network path. That stays in
-- scripts/verify-rls.mjs's assertMastraRuntimeRoleProbe(), which opens a real
-- pg.Client against HYPERDRIVE_DATABASE_URL. Keep both.

set search_path to public, extensions;

begin;
select plan(103);

create temporary table mastra_tables (tablename text) on commit drop;
insert into mastra_tables (tablename)
select tablename from pg_tables where schemaname = 'mastra' order by tablename;

select is(
  (select count(*) from mastra_tables), 24::bigint,
  'mastra schema has the expected 24 tables (IPI-616 classification) — update this file if that count changes on purpose'
);

-- RLS enabled per mastra table (24).
select ok(
    exists(
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'mastra'
        and c.relname = t.tablename
        and c.relrowsecurity
    ),
    format('mastra.%I has row-level security enabled', t.tablename)
  )
from mastra_tables t
order by t.tablename;

-- Exactly one policy per table (24), named hyperdrive_mastra_runtime_all (24),
-- scoped only to that role (24) — 72 assertions total for this trio.
select is(
    (select count(*) from pg_policies where schemaname = 'mastra' and tablename = t.tablename),
    1::bigint,
    format('mastra.%I has exactly one RLS policy', t.tablename)
  )
from mastra_tables t
order by t.tablename;

select is(
    (select policyname from pg_policies where schemaname = 'mastra' and tablename = t.tablename),
    'hyperdrive_mastra_runtime_all',
    format('mastra.%I policy is named hyperdrive_mastra_runtime_all', t.tablename)
  )
from mastra_tables t
order by t.tablename;

select ok(
    (select roles from pg_policies where schemaname = 'mastra' and tablename = t.tablename)
      = array['hyperdrive_mastra_runtime']::name[],
    format('mastra.%I policy applies only to hyperdrive_mastra_runtime', t.tablename)
  )
from mastra_tables t
order by t.tablename;

-- anon/authenticated have no USAGE on the mastra schema at all — a stronger,
-- Postgres-native complement to the PGRST106 (schema not exposed) proof that
-- scripts/verify-rls.mjs already asserts at the PostgREST layer. This checks the
-- grant itself, independent of PostgREST's config.toml `schemas` allow-list.
select ok(
  not has_schema_privilege('anon', 'mastra', 'USAGE'),
  'anon has no USAGE grant on the mastra schema'
);
select ok(
  not has_schema_privilege('authenticated', 'mastra', 'USAGE'),
  'authenticated has no USAGE grant on the mastra schema'
);

-- hyperdrive_mastra_runtime: bare insert/select/update/delete roundtrip, no JWT
-- emulation needed. Mirrors assertMastraRuntimeRoleProbe()'s CRUD shape as a
-- role-privilege check, not a real network connection (id is text, not uuid —
-- createdAt/updatedAt have no default, unlike the Z-suffixed columns).
set local role hyperdrive_mastra_runtime;

select lives_ok(
  $$ insert into mastra.mastra_threads (id, "resourceId", title, "createdAt", "updatedAt")
     values ('pgtap-probe-thread', 'pgtap-probe-resource', 'pgtap RLS probe', now(), now()) $$,
  'hyperdrive_mastra_runtime can INSERT into mastra.mastra_threads'
);

select results_eq(
  $$ select count(*) from mastra.mastra_threads where id = 'pgtap-probe-thread' $$,
  $$ values (1::bigint) $$,
  'hyperdrive_mastra_runtime can SELECT the row it just inserted'
);

select lives_ok(
  $$ update mastra.mastra_threads set title = 'pgtap RLS probe (updated)'
     where id = 'pgtap-probe-thread' $$,
  'hyperdrive_mastra_runtime can UPDATE its own mastra.mastra_threads row'
);

select lives_ok(
  $$ delete from mastra.mastra_threads where id = 'pgtap-probe-thread' $$,
  'hyperdrive_mastra_runtime can DELETE its own mastra.mastra_threads row (cleanup)'
);

reset role;

select * from finish();
rollback;
