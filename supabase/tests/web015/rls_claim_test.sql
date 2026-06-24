-- IPI2-160 · WEB-015.1 — RLS + claim_lead_draft proofs. Run after bootstrap.sql
-- + the migration on an ephemeral Postgres (see run.sh). Any failure aborts.
\set ON_ERROR_STOP on

-- Mimic Supabase's broad table grants so RLS (not a missing GRANT) is what we test.
grant select on all tables in schema public to anon, authenticated;

-- Seed (as superuser → bypasses RLS).
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),   -- user A
  ('22222222-2222-2222-2222-222222222222');    -- user B

insert into public.lead_intake_drafts
  (id, status, answers, claim_token, claim_token_expires_at, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001','ready','{"brand_name":"Dulcinea"}','tok-1', now() + interval '1 hour', null),
  ('aaaaaaaa-0000-0000-0000-000000000002','ready','{}','tok-2', now() - interval '1 hour', null),  -- expired
  ('aaaaaaaa-0000-0000-0000-000000000003','ready','{}','tok-3', now() + interval '1 hour', null),
  ('aaaaaaaa-0000-0000-0000-000000000004','claimed','{}', null, null, '22222222-2222-2222-2222-222222222222'); -- user B's

insert into public.chatbot_conversations (id, anon_id) values
  ('cccccccc-0000-0000-0000-000000000001','anon-xyz');

-- 6. SECURITY DEFINER + empty (hardened) search_path — catalog proof.
select test.assert(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'claim_lead_draft'
            and p.prosecdef
            and p.proconfig @> array['search_path=""']),
  '6. claim_lead_draft is SECURITY DEFINER with empty search_path');

-- 1. anon deny — anon has SELECT grant yet RLS returns zero rows.
begin;
  set local role anon;
  select test.assert((select count(*) from public.lead_intake_drafts) = 0, '1. anon sees zero lead drafts');
  select test.assert((select count(*) from public.chatbot_conversations) = 0, '1b. anon sees zero conversations');
rollback;

-- 3. wrong token — rejected (P0001), draft untouched.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000003','WRONG');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '3. wrong claim token is rejected');
  end $$;
rollback;

-- 4. expired draft — correct token but past expiry → rejected.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000002','tok-2');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '4. expired draft claim is rejected');
  end $$;
rollback;

-- 2. user ownership — user A claims D1, then sees ONLY their own claimed draft.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert(
    (public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000001','tok-1')).status = 'claimed',
    '2a. user A can claim a valid draft with the right token');
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '2b. user A sees exactly one draft (their own)');
  select test.assert(
    (select id from public.lead_intake_drafts) = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    '2c. the visible draft is user A''s, not user B''s');
commit;   -- persist the claim so the double-claim test sees it

-- 5. double claim — D1 is already claimed (token cleared) → second claim rejected.
begin;
  select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000001','tok-1');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '5. already-claimed draft cannot be re-claimed');
  end $$;
  -- and user B still cannot see user A's draft
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '5b. user B sees only their own draft, never user A''s');
rollback;

\echo 'ALL WEB-015 RLS/claim assertions passed.'
