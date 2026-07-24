-- IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests
--
-- Contract under test (ADR Decision 4 / IPI-616):
--   Verified server identity → organization_id as resourceId → parameterized
--   SQL scopes every read/write → RLS role gate is defense in depth →
--   missing / forged resourceId or threadId fails closed at the app layer.
--
-- Honest about live policies: mastra.* today is USING(true)/WITH CHECK(true)
-- for hyperdrive_mastra_runtime — a **role gate**, not multi-tenant org RLS.
-- One assertion below proves an unscoped list still sees both tenants under
-- that role (so callers must always bind resourceId). This file does NOT ship
-- WITH CHECK org scoping or Mastra memory wiring.
--
-- ponytail: USING(true) role gate is not multi-tenant isolation — ceiling is
-- app-layer resourceId/threadId binds. Upgrade path:
-- **IPI-146 · MASTRA-GOV-002 — Multi-tenant memory isolation** and
-- **IPI-775 · Add WITH CHECK org-scoping to the 7 organizationId-bearing
-- mastra.* tables**.
--
-- Plan math: 4 catalog + 8 scoped CRUD/list + 1 role-gate documentation = 13

set search_path to public, extensions;

begin;
select plan(13);

-- 1) Runtime role must not bypass RLS (defense in depth).
select is(
  (
    select rolbypassrls
    from pg_roles
    where rolname = 'hyperdrive_mastra_runtime'
  ),
  false,
  'hyperdrive_mastra_runtime has rolbypassrls=false'
);

-- 2) Runtime role must not own mastra tables (owner would bypass RLS).
select is(
  (
    select count(*)::bigint
    from pg_tables
    where schemaname = 'mastra'
      and tableowner = 'hyperdrive_mastra_runtime'
  ),
  0::bigint,
  'hyperdrive_mastra_runtime owns zero mastra.* tables'
);

-- 3) Document role-gate policy shape on the threads table (not org RLS).
select is(
  (
    select qual
    from pg_policies
    where schemaname = 'mastra'
      and tablename = 'mastra_threads'
      and policyname = 'hyperdrive_mastra_runtime_all'
  ),
  'true',
  'mastra_threads policy USING is true (role gate — app resourceId is the tenant contract)'
);

-- 4) RLS must be enabled on mastra_threads (role gate only works when RLS is on).
select ok(
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'mastra'
      and c.relname = 'mastra_threads'
  ),
  'mastra.mastra_threads has relrowsecurity enabled'
);

-- Seed two tenants as the connecting (bypass) session; rolled back at end.
insert into mastra.mastra_threads (id, "resourceId", title, "createdAt", "updatedAt")
values
  ('pgtap-621-thread-a', 'pgtap-621-tenant-a', 'tenant A thread', now(), now()),
  ('pgtap-621-thread-b', 'pgtap-621-tenant-b', 'tenant B thread', now(), now());

insert into mastra.mastra_messages (
  id, thread_id, content, role, type, "createdAt", "resourceId"
)
values
  (
    'pgtap-621-msg-a',
    'pgtap-621-thread-a',
    'hello from A',
    'user',
    'text',
    now(),
    'pgtap-621-tenant-a'
  ),
  (
    'pgtap-621-msg-b',
    'pgtap-621-thread-b',
    'hello from B',
    'user',
    'text',
    now(),
    'pgtap-621-tenant-b'
  );

set local role hyperdrive_mastra_runtime;

-- 5) Same-tenant scoped SELECT succeeds.
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_threads
     where "resourceId" = 'pgtap-621-tenant-a'
       and id like 'pgtap-621-%' $$,
  $$ values (1::bigint) $$,
  'same-tenant resourceId SELECT returns own thread'
);

-- 6) Forged / other-tenant resourceId → 0 rows (fail closed when app filters).
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_threads
     where "resourceId" = 'pgtap-621-forged-tenant'
       and id like 'pgtap-621-%' $$,
  $$ values (0::bigint) $$,
  'forged resourceId SELECT returns 0 rows'
);

-- 7) Forged thread id under correct resourceId → 0 rows.
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_threads
     where id = 'pgtap-621-forged-thread'
       and "resourceId" = 'pgtap-621-tenant-a' $$,
  $$ values (0::bigint) $$,
  'forged threadId SELECT returns 0 rows'
);

-- 8) Cross-tenant thread id + wrong resourceId → 0 (no leak via id alone).
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_threads
     where id = 'pgtap-621-thread-b'
       and "resourceId" = 'pgtap-621-tenant-a' $$,
  $$ values (0::bigint) $$,
  'other-tenant threadId with own resourceId returns 0 rows'
);

-- 9) Messages: forged thread_id under own resourceId → 0.
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_messages
     where thread_id = 'pgtap-621-forged-thread'
       and "resourceId" = 'pgtap-621-tenant-a' $$,
  $$ values (0::bigint) $$,
  'forged message thread_id SELECT returns 0 rows'
);

-- 10) Scoped UPDATE by resourceId succeeds.
select results_eq(
  $$ update mastra.mastra_threads
     set title = 'tenant A thread (updated)', "updatedAt" = now()
     where id = 'pgtap-621-thread-a'
       and "resourceId" = 'pgtap-621-tenant-a'
     returning 1::bigint $$,
  $$ values (1::bigint) $$,
  'same-tenant resourceId UPDATE returns 1 row'
);

-- 11) UPDATE with forged resourceId affects 0 rows (fail closed when filtered).
select results_eq(
  $$ with u as (
       update mastra.mastra_threads
       set title = 'should not stick', "updatedAt" = now()
       where id = 'pgtap-621-thread-a'
         and "resourceId" = 'pgtap-621-forged-tenant'
       returning 1
     )
     select count(*)::bigint from u $$,
  $$ values (0::bigint) $$,
  'forged resourceId UPDATE affects 0 rows'
);

-- 12) Scoped DELETE by resourceId succeeds (cleanup inside txn).
select results_eq(
  $$ with d as (
       delete from mastra.mastra_messages
       where id = 'pgtap-621-msg-a'
         and "resourceId" = 'pgtap-621-tenant-a'
       returning 1
     )
     select count(*)::bigint from d $$,
  $$ values (1::bigint) $$,
  'same-tenant resourceId DELETE returns 1 row'
);

-- 13) TEMPORARY tenant-isolation gap (not desired end-state): unscoped list
--     still sees both fixture rows while mastra.* policies use USING(true).
--     Expectation `2::bigint` is valid only until
--     **IPI-775 · Add WITH CHECK org-scoping to the 7 organizationId-bearing
--     mastra.* tables** lands real tenant RLS. Until then the app must always
--     bind resourceId (**IPI-146 · MASTRA-GOV-002 — Multi-tenant memory isolation**).
select results_eq(
  $$ select count(*)::bigint from mastra.mastra_threads
     where id like 'pgtap-621-%' $$,
  $$ values (2::bigint) $$,
  'TEMPORARY gap: unscoped list under USING(true) still sees both tenants — app resourceId filter required until IPI-775'
);

reset role;

select * from finish();
rollback;
