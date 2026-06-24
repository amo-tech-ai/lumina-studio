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
  ('aaaaaaaa-0000-0000-0000-000000000004','claimed','{}', null, null, '22222222-2222-2222-2222-222222222222'), -- user B's
  ('aaaaaaaa-0000-0000-0000-000000000005','ready','{}','tok-null', null, null);  -- no expiry

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
  select test.assert((select count(*) from public.chatbot_messages) = 0, '1c. anon sees zero messages');
  select test.assert((select count(*) from public.chatbot_events) = 0, '1d. anon sees zero events');
rollback;

-- 1e. authenticated deny on unclaimed — owner-read policy hides drafts until claimed.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert((select count(*) from public.lead_intake_drafts) = 0,
    '1e. authenticated sees zero unclaimed drafts');
  select test.assert((select count(*) from public.chatbot_conversations) = 0,
    '1f. authenticated sees zero conversations');
  select test.assert((select count(*) from public.chatbot_messages) = 0,
    '1g. authenticated sees zero messages');
  select test.assert((select count(*) from public.chatbot_events) = 0,
    '1h. authenticated sees zero events');
rollback;

-- 7. unauthenticated claim — no JWT sub → 28000, draft untouched.
begin;
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000003','tok-3');
    exception when sqlstate '28000' then ok := true; end;
    perform test.assert(ok, '7. unauthenticated caller is rejected (28000)');
  end $$;
rollback;

-- 8. service_role write path — bypasses RLS for capture-lead edge fn contract.
begin;
  set local role service_role;
  insert into public.chatbot_messages (conversation_id, role, content)
    values ('cccccccc-0000-0000-0000-000000000001', 'user', 'hi');
  select test.assert((select count(*) from public.chatbot_messages) = 1,
    '8. service_role can insert chatbot messages');
rollback;

-- 9. authenticated write deny — no client INSERT policy on lead drafts.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  insert into public.lead_intake_drafts (status, claim_token) values ('ready', 'evil');
  select test.assert((select count(*) from public.lead_intake_drafts where claim_token = 'evil') = 0,
    '9. authenticated cannot insert lead drafts (RLS silent deny)');
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
  select test.assert(
    (select claim_token from public.lead_intake_drafts where id = 'aaaaaaaa-0000-0000-0000-000000000001') is null,
    '2b. successful claim clears the single-use token');
  select test.assert(
    (select claimed_at from public.lead_intake_drafts where id = 'aaaaaaaa-0000-0000-0000-000000000001') is not null,
    '2c. successful claim sets claimed_at');
  select test.assert(
    (select user_id from public.lead_intake_drafts where id = 'aaaaaaaa-0000-0000-0000-000000000001')
      = '11111111-1111-1111-1111-111111111111'::uuid,
    '2d. successful claim transfers ownership to caller');
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '2e. user A sees exactly one draft (their own)');
  select test.assert(
    (select id from public.lead_intake_drafts) = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    '2f. the visible draft is user A''s, not user B''s');
commit;   -- persist the claim so the double-claim test sees it

-- 10. null expiry — drafts with no claim_token_expires_at remain claimable.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert(
    (public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000005','tok-null')).status = 'claimed',
    '10. draft with null expiry can be claimed');
rollback;

-- 5. double claim — D1 is already claimed (token cleared) → second claim rejected.
begin;
  select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000001','tok-1');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '5. already-claimed draft cannot be re-claimed');
  end $$;
  -- user B sees only their own pre-claimed draft (D4), never user A's (D1)
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '5b. user B sees exactly one draft');
  select test.assert(
    (select id from public.lead_intake_drafts) = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
    '5c. user B''s visible draft is their own (D4), not user A''s (D1)');
rollback;

\echo 'ALL WEB-015 RLS/claim assertions passed.'
