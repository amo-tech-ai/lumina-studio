-- IPI-809 · SEC-ONB-001 — organization tenant isolation
--
-- Guards migration 20260727020000. Four properties, and the third is the one that matters
-- most: dropping the permissive policy WITHOUT orgs_select_owner breaks onboarding, because
-- INSERT ... RETURNING is projected against the SELECT policy before the AFTER INSERT
-- membership trigger fires. A test that only proves isolation would let that regression ship.
--
-- Pre-merge CI strategy (approach B — transactional apply + assert + rollback):
--   supabase-verify-rls runs `supabase test db --db-url $DATABASE_URL` against the linked
--   remote. That DB does not have unmerged migrations applied (remote-only; no supabase
--   start / ephemeral clone in this job). So this file applies the same DDL as
--   20260727020000_org_tenant_isolation.sql at the top of its BEGIN…ROLLBACK session.
--   Postgres transactional DDL rolls the policy DROP/CREATE back with the fixtures — the
--   linked project is unchanged after the test. Idempotent drop of orgs_select_owner first
--   so the file still passes after supabase:push lands the real migration.
--
-- pgTAP 1.2.0 is already installed on the remote, so no create extension here.
--
-- Fixtures live inside the transaction and are discarded by the rollback. auth.users needs
-- `email` as well as `id`: the on_auth_user_created trigger runs handle_new_user, which inserts
-- into public.profiles where email is NOT NULL. That function traps its own failure and
-- downgrades it to a WARNING, so omitting email still passes while printing noise.
--
-- Plan math: 1 negative + 1 positive (member) + 1 positive (owner RETURNING) + 1 leak guard = 4

set search_path to public, extensions;

begin;
select plan(4);

-- Mirror 20260727020000 (must run as the DB owner role, before SET ROLE authenticated).
drop policy if exists "authenticated can view organizations" on public.organizations;
drop policy if exists "orgs_select_owner" on public.organizations;
create policy "orgs_select_owner"
  on public.organizations for select to authenticated
  using ((select auth.uid()) = owner_id);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000a01', 'ipi809-owner@test.local'),
  ('00000000-0000-4000-8000-000000000a02', 'ipi809-stranger@test.local');

-- An organization owned by user A, created as the table owner so the fixture itself is not
-- subject to the policies under test.
insert into public.organizations (id, name, slug, owner_id, type)
values ('00000000-0000-4000-8000-000000000b01', 'IPI809 Owner Org', 'ipi809-owner-org',
        '00000000-0000-4000-8000-000000000a01', 'brand');

-- ── 1) Negative: a stranger sees nothing ────────────────────────────────────────────────────
-- auth.uid() reads request.jwt.claim.sub (singular); claims JSON alone leaves uid null.
-- Match 003_anon_authenticated_access.sql / web015 bootstrap.
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000a02","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a02';
set local role authenticated;

select is(
  (select count(*)::int from public.organizations
     where id = '00000000-0000-4000-8000-000000000b01'),
  0,
  'a non-member reads zero rows for another user''s organization'
);

-- ── 2) Positive: the owner still reads their own organization ───────────────────────────────
reset role;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000a01';
set local role authenticated;

select is(
  (select count(*)::int from public.organizations
     where id = '00000000-0000-4000-8000-000000000b01'),
  1,
  'the owner still reads their own organization'
);

-- ── 3) Regression guard: INSERT ... RETURNING must still return its row ─────────────────────
-- This is the exact call insertOrganization makes (app/src/lib/onboarding.ts:40). Without
-- orgs_select_owner it fails with 42501, because the AFTER INSERT membership trigger has not
-- run when RETURNING is projected. Proven experimentally before this migration was written.
select lives_ok(
  $$ insert into public.organizations (name, slug, owner_id, type)
     values ('IPI809 Returning', 'ipi809-returning',
             '00000000-0000-4000-8000-000000000a01', 'brand')
     returning id $$,
  'INSERT ... RETURNING succeeds for the owner — onboarding is not broken by the policy drop'
);

-- ── 4) The permissive policy must never come back ───────────────────────────────────────────
reset role;
select is(
  (select count(*)::int
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'organizations'
      and p.polcmd = 'r'
      and coalesce(pg_get_expr(p.polqual, p.polrelid), '') = 'true'),
  0,
  'no SELECT policy on organizations uses USING (true) — the tenant leak cannot be reintroduced'
);

select * from finish();
rollback;
