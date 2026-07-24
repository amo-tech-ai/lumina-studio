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
-- Fixture note: the connecting role for `supabase test db --db-url` bypasses RLS
-- (superuser/owner), so plain INSERTs below seed real rows without needing SET ROLE
-- first. Everything rolls back at the end — no fixture escapes to the live table.

set search_path to public, extensions;

begin;
select plan(13);

-- Reused fixture owner: seed-organizer@fashionos.com, already present in auth.users
-- on every environment this suite runs against (see CI DATABASE_URL target) — no
-- need to insert a new auth.users row (finicky schema, out of scope here) just to
-- get a real, FK-satisfying user id.
create temporary table fixture_ids (
  owner_id uuid,
  attacker_id uuid,
  org_id uuid,
  brand_id uuid,
  company_id uuid,
  deal_id uuid
) on commit drop;

-- ponytail: fixed UUID depends on auth.users row from supabase/seed.sql (or equiv).
-- Fresh/local DBs must load that seed before profiles INSERT or FK fails.
insert into fixture_ids (owner_id, attacker_id)
values ('00000000-0000-0000-0000-000000000001', gen_random_uuid());

-- Temp tables are owned by the connecting (superuser) role — SET LOCAL ROLE below
-- switches the session to authenticated, which needs an explicit grant to read this
-- fixture table back, same as any other cross-role table access.
grant select on fixture_ids to authenticated, anon;

insert into public.profiles (id, email)
select owner_id, 'pgtap-probe-owner@example.com' from fixture_ids
on conflict (id) do nothing;

with new_org as (
  insert into public.organizations (name, slug, owner_id, type)
  select 'pgTAP RLS Probe Org', 'pgtap-rls-probe-org-' || gen_random_uuid(), owner_id, 'brand'
  from fixture_ids
  returning id
)
update fixture_ids set org_id = new_org.id from new_org;

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
  $$ insert into public.brands (name, user_id) values ('anon brand', '00000000-0000-0000-0000-000000000001') $$,
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
