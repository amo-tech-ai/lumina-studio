-- IPI-809 · SEC-ONB-001 PR 2 — org helper / trigger EXECUTE grants
--
-- Persistent regression guard for migration
-- 20260730220000_ipi809_revoke_org_function_execute.sql.
--
-- Asserts LIVE privileges only. Does NOT REVOKE/GRANT first — rewriting
-- grants would make CI pass against a drifted remote and roll the bad
-- state back, so the suite would never catch a missing/incorrect migration.
--
-- Requires the migration applied on the linked remote (merge #681 +
-- supabase:push) before this file is green in CI.
--
-- PUBLIC EXECUTE is not checked via has_function_privilege('public', …):
-- PUBLIC is a pseudo-role, not a pg_roles entry. anon denial already fails
-- if PUBLIC EXECUTE remains (anon inherits PUBLIC).
--
-- Out of scope here (owned elsewhere):
--   · PR 1 orgs SELECT → 007_org_tenant_isolation.sql
--   · IPI-684 default EXECUTE → tests/security/default-execute-privileges.sql
--
-- Plan math:
--   3 helpers × (anon F, auth T, service_role T) = 9
--   5 triggers × (anon F, auth F, service_role T) = 15
--   Total = 24

set search_path to public, extensions;

begin;
select plan(24);

-- ── Helpers: anon denied; authenticated + service_role allowed ──────────────────────────────
select is(has_function_privilege('anon', 'is_org_member(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_member(uuid)');
select is(has_function_privilege('authenticated', 'is_org_member(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_member(uuid)');
select is(has_function_privilege('service_role', 'is_org_member(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_member(uuid)');

select is(has_function_privilege('anon', 'is_org_owner(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_owner(uuid)');
select is(has_function_privilege('authenticated', 'is_org_owner(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_owner(uuid)');
select is(has_function_privilege('service_role', 'is_org_owner(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_owner(uuid)');

select is(has_function_privilege('anon', 'is_org_editor_or_above(uuid)', 'EXECUTE'), false,
  'anon must not EXECUTE is_org_editor_or_above(uuid)');
select is(has_function_privilege('authenticated', 'is_org_editor_or_above(uuid)', 'EXECUTE'), true,
  'authenticated must EXECUTE is_org_editor_or_above(uuid)');
select is(has_function_privilege('service_role', 'is_org_editor_or_above(uuid)', 'EXECUTE'), true,
  'service_role must EXECUTE is_org_editor_or_above(uuid)');

-- ── Trigger-only: no client EXECUTE; service_role kept ──────────────────────────────────────
select is(has_function_privilege('anon', 'auto_add_org_owner()', 'EXECUTE'), false,
  'anon must not EXECUTE auto_add_org_owner()');
select is(has_function_privilege('authenticated', 'auto_add_org_owner()', 'EXECUTE'), false,
  'authenticated must not EXECUTE auto_add_org_owner()');
select is(has_function_privilege('service_role', 'auto_add_org_owner()', 'EXECUTE'), true,
  'service_role must EXECUTE auto_add_org_owner()');

select is(has_function_privilege('anon', 'handle_new_user()', 'EXECUTE'), false,
  'anon must not EXECUTE handle_new_user()');
select is(has_function_privilege('authenticated', 'handle_new_user()', 'EXECUTE'), false,
  'authenticated must not EXECUTE handle_new_user()');
select is(has_function_privilege('service_role', 'handle_new_user()', 'EXECUTE'), true,
  'service_role must EXECUTE handle_new_user()');

select is(has_function_privilege('anon', 'block_brand_org_change()', 'EXECUTE'), false,
  'anon must not EXECUTE block_brand_org_change()');
select is(has_function_privilege('authenticated', 'block_brand_org_change()', 'EXECUTE'), false,
  'authenticated must not EXECUTE block_brand_org_change()');
select is(has_function_privilege('service_role', 'block_brand_org_change()', 'EXECUTE'), true,
  'service_role must EXECUTE block_brand_org_change()');

select is(has_function_privilege('anon', 'check_campaign_org_consistency()', 'EXECUTE'), false,
  'anon must not EXECUTE check_campaign_org_consistency()');
select is(has_function_privilege('authenticated', 'check_campaign_org_consistency()', 'EXECUTE'), false,
  'authenticated must not EXECUTE check_campaign_org_consistency()');
select is(has_function_privilege('service_role', 'check_campaign_org_consistency()', 'EXECUTE'), true,
  'service_role must EXECUTE check_campaign_org_consistency()');

select is(has_function_privilege('anon', 'create_default_event_phases()', 'EXECUTE'), false,
  'anon must not EXECUTE create_default_event_phases()');
select is(has_function_privilege('authenticated', 'create_default_event_phases()', 'EXECUTE'), false,
  'authenticated must not EXECUTE create_default_event_phases()');
select is(has_function_privilege('service_role', 'create_default_event_phases()', 'EXECUTE'), true,
  'service_role must EXECUTE create_default_event_phases()');

select * from finish();
rollback;
