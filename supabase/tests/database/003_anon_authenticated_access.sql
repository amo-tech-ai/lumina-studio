-- IPI-245 · SB-TEST-002 — anon/authenticated row-level access, pgTAP-native
-- equivalent of scripts/verify-rls.mjs's anon/cross-user probes for a representative
-- slice of the same tables (profiles, brands, crm_deals, reference tables).
--
-- Deliberately NOT ported here: the deeper RPC/business-logic flows (crm_convert_deal
-- side effects, planner_shift_task idempotency/dependency conflicts, notifications
-- mark-read RPC, viewer/editor/manager promotion chains). Those exercise real
-- multi-step application behavior across several tables via signed-in JWT sessions
-- and RPCs with side effects — genuinely a different kind of test than "does this
-- policy admit or deny this role", and the audit that kicked this off scoped pgTAP
-- to "schema, grant, role and policy checks" only. They stay in verify-rls.mjs.
--
-- CI note (honest): supabase-verify-rls runs
--   supabase test db --db-url "$DATABASE_URL" supabase/tests/database
-- against the shared remote project (structural gate), not a fresh local stack from
-- `supabase start` + migrations. Fixtures below are still self-contained so the
-- suite does not depend on ambient seed rows (and so a future local job can reuse it).
--
-- Fixture note: the connecting role for `supabase test db --db-url` bypasses RLS
-- (superuser/owner), so plain INSERTs below seed real rows without needing SET ROLE
-- first. Everything rolls back at the end — no fixture escapes to the live table.

set search_path to public, extensions;

begin;
select plan(16);

-- ── IPI-888 · SB-HYGIENE-004 — grant-level lockdown on processed_firecrawl_webhooks ──
-- Catalog assertions, so they run before any SET ROLE and need no fixtures.
--
-- RLS-with-zero-policies already denies every row, so these are not row-access
-- tests — they assert the *grant* is gone, which is what keeps the table out of
-- PostgREST's schema cache. This grant has drifted back once already after
-- 20260718200000_ipi692 revoked it at creation.
--
-- Two assertions, because there are two distinct ways this can re-drift.
--
-- Deliberately NOT table_privs_are per role. It filters
-- information_schema.table_privileges by exact grantee, and a grant made to
-- PUBLIC lands under grantee 'PUBLIC' — so table_privs_are(...,'anon',{}) still
-- passes while anon reads the table through PUBLIC inheritance. Measured on the
-- live project: after `grant select ... to public`, information_schema shows
-- only `PUBLIC=SELECT`, yet has_table_privilege('anon',...,'SELECT') is true.
-- The per-role form would have reported green on a readable table.
--
-- (1) Direct rows — covers all three grantees and every privilege type, so a
-- future INSERT/UPDATE re-grant fails too, not just SELECT. Same grantee filter
-- as supabase/tests/security/chatbot-grants.sql.
select is_empty(
  $$ select grantee, privilege_type
       from information_schema.table_privileges
      where table_schema = 'public'
        and table_name = 'processed_firecrawl_webhooks'
        and grantee in ('anon', 'authenticated', 'PUBLIC') $$,
  'no anon/authenticated/PUBLIC privileges on processed_firecrawl_webhooks'
);

-- (2) Effective access — follows every inheritance path, so it still holds if
-- the role hierarchy changes in a way the grantee list above does not anticipate.
select ok(
  not has_table_privilege('anon', 'public.processed_firecrawl_webhooks', 'SELECT')
    and not has_table_privilege('authenticated', 'public.processed_firecrawl_webhooks', 'SELECT'),
  'neither deny role has effective SELECT via any grant path'
);
-- Writer role must survive the revoke — guards against an over-broad
-- `revoke ... from public` cascading and breaking the webhook handler.
--
-- Deliberately NOT table_privs_are here. That assertion is exhaustive, and the
-- migration grants only SELECT/INSERT/UPDATE. The other live privileges
-- (DELETE/TRUNCATE/REFERENCES/TRIGGER) come from the creation-time default ACL,
-- not from any migration — so asserting all seven passes against the live
-- project but fails on a database rebuilt from migrations alone.
--
-- Exhaustiveness earns its keep on anon/authenticated, where *any* privilege is
-- a finding. On the writer role the only question is whether it still has what
-- supabase/functions/firecrawl-webhook/handler.ts uses — SELECT, INSERT, UPDATE
-- (lines 37, 66, 79, 88, 107). Extra privileges there are not a security
-- regression. Same has_table_privilege style as
-- supabase/tests/security/chatbot-grants.sql.
select ok(
  has_table_privilege('service_role', 'public.processed_firecrawl_webhooks', 'SELECT')
    and has_table_privilege('service_role', 'public.processed_firecrawl_webhooks', 'INSERT')
    and has_table_privilege('service_role', 'public.processed_firecrawl_webhooks', 'UPDATE'),
  'service_role retains SELECT/INSERT/UPDATE for the firecrawl webhook handler'
);

-- Self-contained owner: insert auth.users inside this transaction (rolled back).
-- Do NOT use seed.sql org id 00000000-0000-0000-0000-000000000001 — that is Acme
-- Corp (organizations.id), not an auth user. Seed users are …0101 / …0102 / …0103.
create temporary table fixture_ids (
  owner_id uuid,
  attacker_id uuid,
  org_id uuid,
  brand_id uuid,
  company_id uuid,
  deal_id uuid
) on commit drop;

insert into fixture_ids (owner_id, attacker_id)
values (gen_random_uuid(), gen_random_uuid());

-- Mirror supabase/seed.sql auth.users columns (pgcrypto crypt available via extensions).
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
)
select
  owner_id,
  'pgtap-probe-owner-' || replace(owner_id::text, '-', '') || '@example.com',
  crypt('pgtap-probe-not-a-login', gen_salt('bf')),
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  'authenticated'
from fixture_ids;

-- Temp tables are owned by the connecting (superuser) role — SET LOCAL ROLE below
-- switches the session to authenticated, which needs an explicit grant to read this
-- fixture table back, same as any other cross-role table access.
grant select on fixture_ids to authenticated, anon;

-- handle_new_user() trigger already inserts public.profiles on auth.users INSERT.
-- Touch email only if the row exists; never hard-fail on the trigger race.
insert into public.profiles (id, email)
select owner_id, 'pgtap-probe-owner@example.com' from fixture_ids
on conflict (id) do update set email = excluded.email;

with new_org as (
  insert into public.organizations (name, slug, owner_id, type)
  select 'pgTAP RLS Probe Org', 'pgtap-rls-probe-org-' || gen_random_uuid(), owner_id, 'brand'
  from fixture_ids
  returning id
)
update fixture_ids set org_id = new_org.id from new_org;

-- organizations insert trigger adds org_members for owner_id (IPI-16 org layer).

with new_brand as (
  insert into public.brands (name, user_id, org_id)
  select 'pgTAP RLS Probe Brand', owner_id, org_id from fixture_ids
  returning id
)
update fixture_ids set brand_id = new_brand.id from new_brand;

with new_company as (
  insert into public.crm_companies (org_id, name)
  select org_id, 'pgTAP RLS Probe Co' from fixture_ids
  returning id
)
update fixture_ids set company_id = new_company.id from new_company;

with new_deal as (
  insert into public.crm_deals (org_id, company_id, stage)
  select org_id, company_id, 'lead' from fixture_ids
  returning id
)
update fixture_ids set deal_id = new_deal.id from new_deal;

-- ── anon: no JWT identity at all ──
set local role anon;

select results_eq(
  $$ select count(*) from public.profiles $$,
  $$ values (0::bigint) $$,
  'anon cannot read any profiles rows'
);

select results_eq(
  $$ select count(*) from public.brands $$,
  $$ values (0::bigint) $$,
  'anon cannot read any brands rows'
);

select throws_ok(
  format(
    $$ insert into public.brands (name, user_id) values ('anon brand', %L::uuid) $$,
    (select owner_id from fixture_ids)
  ),
  '42501',
  null,
  'anon cannot insert into brands'
);

select results_eq(
  $$ select count(*) from public.platforms $$,
  $$ values (0::bigint) $$,
  'anon cannot read seeded platforms rows'
);
select results_eq(
  $$ select count(*) from public.image_type_defs $$,
  $$ values (0::bigint) $$,
  'anon cannot read seeded image_type_defs rows'
);
select results_eq(
  $$ select count(*) from public.image_specs $$,
  $$ values (0::bigint) $$,
  'anon cannot read seeded image_specs rows'
);
select results_eq(
  $$ select count(*) from public.recommendation_rules $$,
  $$ values (0::bigint) $$,
  'anon cannot read seeded recommendation_rules rows'
);

reset role;

-- ── authenticated: owner's own JWT sees their rows ──
set local role authenticated;
select set_config('request.jwt.claim.sub', (select owner_id::text from fixture_ids), true);

select results_eq(
  format($fmt$ select count(*) from public.profiles where id = '%s' $fmt$, (select owner_id from fixture_ids)),
  $$ values (1::bigint) $$,
  'authenticated owner reads own profile'
);
select results_eq(
  format($fmt$ select count(*) from public.brands where id = '%s' $fmt$, (select brand_id from fixture_ids)),
  $$ values (1::bigint) $$,
  'authenticated owner (org member) reads own org brand'
);
select results_eq(
  format($fmt$ select count(*) from public.crm_deals where id = '%s' $fmt$, (select deal_id from fixture_ids)),
  $$ values (1::bigint) $$,
  'authenticated owner (org member) reads own org crm_deal'
);

reset role;

-- ── authenticated: an unrelated user's JWT must not see the same rows ──
-- attacker_id need not exist in auth.users — RLS compares auth.uid() from JWT only.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select attacker_id::text from fixture_ids), true);

select results_eq(
  format($fmt$ select count(*) from public.profiles where id = '%s' $fmt$, (select owner_id from fixture_ids)),
  $$ values (0::bigint) $$,
  'authenticated non-owner cannot read the probe profile'
);
select results_eq(
  format($fmt$ select count(*) from public.brands where id = '%s' $fmt$, (select brand_id from fixture_ids)),
  $$ values (0::bigint) $$,
  'authenticated non-org-member cannot read the probe brand'
);
select results_eq(
  format($fmt$ select count(*) from public.crm_deals where id = '%s' $fmt$, (select deal_id from fixture_ids)),
  $$ values (0::bigint) $$,
  'authenticated non-org-member cannot read the probe crm_deal'
);

reset role;

select * from finish();
rollback;
