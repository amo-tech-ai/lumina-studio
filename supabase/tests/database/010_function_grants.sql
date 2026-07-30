-- IPI-809 · SEC-ONB-001 PR 2 — org helper / trigger EXECUTE grants
--
-- Guards migration 20260730220000_ipi809_revoke_org_function_execute.sql.
--
-- Pre-merge CI strategy (same as 007_org_tenant_isolation.sql):
--   BEGIN → apply the same REVOKE/GRANT DDL → assert → ROLLBACK.
--   Linked remote is unchanged after the test. Idempotent after real push.
--
-- Plan math:
--   3 helpers × (public F, anon F, auth T, service_role T) = 12
--   5 triggers × (public F, anon F, auth F, service_role T) = 20
--   PR 1 regression (orgs SELECT USING true = 0) = 1
--   IPI-684 default ACL probe = 1
--   Total = 34

set search_path to public, extensions;

begin;
select plan(34);

-- Mirror 20260730220000 (must run as DB owner before privilege asserts).
revoke all on function public.is_org_member(uuid) from public, anon, authenticated;
revoke all on function public.is_org_owner(uuid) from public, anon, authenticated;
revoke all on function public.is_org_editor_or_above(uuid) from public, anon, authenticated;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.is_org_owner(uuid) to authenticated, service_role;
grant execute on function public.is_org_editor_or_above(uuid) to authenticated, service_role;

revoke all on function public.auto_add_org_owner() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.block_brand_org_change() from public, anon, authenticated;
revoke all on function public.check_campaign_org_consistency() from public, anon, authenticated;
revoke all on function public.create_default_event_phases() from public, anon, authenticated;
grant execute on function public.auto_add_org_owner() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.block_brand_org_change() to service_role;
grant execute on function public.check_campaign_org_consistency() to service_role;
grant execute on function public.create_default_event_phases() to service_role;

-- ── Helpers: PUBLIC / anon denied; authenticated + service_role allowed ─────────────────────
select is(has_function_privilege('public', 'is_org_member(uuid)', 'EXECUTE'), false,
  'public must not EXECUTE is_org_member(uuid)');
select is(has_function_privilege('anon', 'is_org_member(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_member(uuid)');
select is(has_function_privilege('authenticated', 'is_org_member(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_member(uuid)');
select is(has_function_privilege('service_role', 'is_org_member(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_member(uuid)');

select is(has_function_privilege('public', 'is_org_owner(uuid)', 'EXECUTE'), false,
  'public must not EXECUTE is_org_owner(uuid)');
select is(has_function_privilege('anon', 'is_org_owner(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_owner(uuid)');
select is(has_function_privilege('authenticated', 'is_org_owner(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_owner(uuid)');
select is(has_function_privilege('service_role', 'is_org_owner(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_owner(uuid)');

select is(has_function_privilege('public', 'is_org_editor_or_above(uuid)', 'EXECUTE'), false,
  'public must not EXECUTE is_org_editor_or_above(uuid)');
select is(has_function_privilege('anon', 'is_org_editor_or_above(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_editor_or_above(uuid)');
select is(has_function_privilege('authenticated', 'is_org_editor_or_above(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_editor_or_above(uuid)');
select is(has_function_privilege('service_role', 'is_org_editor_or_above(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_editor_or_above(uuid)');

-- ── Trigger-only: no client EXECUTE; service_role kept ──────────────────────────────────────
select is(has_function_privilege('public', 'auto_add_org_owner()', 'EXECUTE'), false,
  'public must not EXECUTE auto_add_org_owner()');
select is(has_function_privilege('anon', 'auto_add_org_owner()', 'EXECUTE'), false,
  'anon must not EXECUTE auto_add_org_owner()');
select is(has_function_privilege('authenticated', 'auto_add_org_owner()', 'EXECUTE'), false,
  'authenticated must not EXECUTE auto_add_org_owner()');
select is(has_function_privilege('service_role', 'auto_add_org_owner()', 'EXECUTE'), true,
  'service_role must EXECUTE auto_add_org_owner()');

select is(has_function_privilege('public', 'handle_new_user()', 'EXECUTE'), false,
  'public must not EXECUTE handle_new_user()');
select is(has_function_privilege('anon', 'handle_new_user()', 'EXECUTE'), false,
  'anon must not EXECUTE handle_new_user()');
select is(has_function_privilege('authenticated', 'handle_new_user()', 'EXECUTE'), false,
  'authenticated must not EXECUTE handle_new_user()');
select is(has_function_privilege('service_role', 'handle_new_user()', 'EXECUTE'), true,
  'service_role must EXECUTE handle_new_user()');

select is(has_function_privilege('public', 'block_brand_org_change()', 'EXECUTE'), false,
  'public must not EXECUTE block_brand_org_change()');
select is(has_function_privilege('anon', 'block_brand_org_change()', 'EXECUTE'), false,
  'anon must not EXECUTE block_brand_org_change()');
select is(has_function_privilege('authenticated', 'block_brand_org_change()', 'EXECUTE'), false,
  'authenticated must not EXECUTE block_brand_org_change()');
select is(has_function_privilege('service_role', 'block_brand_org_change()', 'EXECUTE'), true,
  'service_role must EXECUTE block_brand_org_change()');

select is(has_function_privilege('public', 'check_campaign_org_consistency()', 'EXECUTE'), false,
  'public must not EXECUTE check_campaign_org_consistency()');
select is(has_function_privilege('anon', 'check_campaign_org_consistency()', 'EXECUTE'), false,
  'anon must not EXECUTE check_campaign_org_consistency()');
select is(has_function_privilege('authenticated', 'check_campaign_org_consistency()', 'EXECUTE'), false,
  'authenticated must not EXECUTE check_campaign_org_consistency()');
select is(has_function_privilege('service_role', 'check_campaign_org_consistency()', 'EXECUTE'), true,
  'service_role must EXECUTE check_campaign_org_consistency()');

select is(has_function_privilege('public', 'create_default_event_phases()', 'EXECUTE'), false,
  'public must not EXECUTE create_default_event_phases()');
select is(has_function_privilege('anon', 'create_default_event_phases()', 'EXECUTE'), false,
  'anon must not EXECUTE create_default_event_phases()');
select is(has_function_privilege('authenticated', 'create_default_event_phases()', 'EXECUTE'), false,
  'authenticated must not EXECUTE create_default_event_phases()');
select is(has_function_privilege('service_role', 'create_default_event_phases()', 'EXECUTE'), true,
  'service_role must EXECUTE create_default_event_phases()');

-- ── PR 1 regression: organizations SELECT must not be USING (true) ──────────────────────────
select is(
  (
    select count(*)::int
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'organizations'
      and p.polcmd = 'r'
      and coalesce(pg_get_expr(p.polqual, p.polrelid), '') = 'true'
  ),
  0,
  'PR1: no organizations SELECT policy with USING (true)'
);

-- ── IPI-684: new public functions must not inherit anon/authenticated EXECUTE ───────────────
create or replace function public._ipi809_default_execute_probe()
returns integer
language sql
stable
as $$ select 1 $$;

select ok(
  not has_function_privilege('anon', 'public._ipi809_default_execute_probe()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public._ipi809_default_execute_probe()', 'EXECUTE')
  and has_function_privilege('service_role', 'public._ipi809_default_execute_probe()', 'EXECUTE'),
  'IPI-684 defaults: new function not executable by anon/authenticated; service_role retained'
);

drop function public._ipi809_default_execute_probe();

select * from finish();
rollback;
