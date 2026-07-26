-- IPI-807 · ONB-AI-001 — brand_intake_drafts.status accepts the HITL draft value
--
-- Guards the constraint widened in 20260726180000. The throws_ok is the assertion that
-- matters: it proves the migration *widened* the CHECK rather than dropping it, which a
-- lives_ok() on 'pending_approval' alone cannot distinguish — a table with no constraint
-- at all would pass that just as happily.
--
-- The five lives_ok() calls pin the whole accepted set behaviourally, so a later edit that
-- silently drops a value (say 'expired') fails here rather than in production.
--
-- pgTAP 1.2.0 is already installed on the remote, so no create extension here.
--
-- Fixtures are created inside the transaction and discarded by the rollback. auth.users
-- needs only `id` (is_sso_user / is_anonymous carry defaults), and brand_id is left null so
-- the unique constraint from 20260715000000 is not engaged — Postgres treats nulls as
-- distinct, so the fixture drafts can coexist.

set search_path to public, extensions;

begin;
select plan(6);

insert into auth.users (id)
values ('00000000-0000-4000-8000-000000000807');

-- 1) The value the workflow actually writes. This is the bug being fixed:
--    brand-intelligence-workflow.ts:250 has always written it, and it has always failed.
select lives_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'pending_approval') $$,
  'status = pending_approval is accepted (unblocks brand-intelligence-workflow.ts:250)'
);

-- 2) The constraint must still reject anything outside the set. Without this, a migration
--    that simply dropped the CHECK would be indistinguishable from one that widened it.
select throws_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'not_a_real_status') $$,
  '23514',
  null,
  'an unknown status still raises 23514 — the CHECK was widened, not dropped'
);

-- 3-6) The four pre-existing values must survive the drop/re-add. 'pending' covers every
--      one of the 27 live rows, so losing it would break the table on the next update.
select lives_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'pending') $$,
  'the original status = pending is still accepted'
);

select lives_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'approved') $$,
  'status = approved is still accepted'
);

select lives_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'rejected') $$,
  'status = rejected is still accepted'
);

select lives_ok(
  $$ insert into public.brand_intake_drafts (user_id, source_url, status)
     values ('00000000-0000-4000-8000-000000000807', 'https://pgtap-807.example.test', 'expired') $$,
  'status = expired is still accepted'
);

select * from finish();
rollback;
