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
  ('aaaaaaaa-0000-0000-0000-000000000005','ready','{}','tok-null', null, null),  -- no expiry
  ('aaaaaaaa-0000-0000-0000-000000000006','ready','{}', null, now() + interval '1 hour', null);  -- null token

insert into public.chatbot_conversations (id, anon_id) values
  ('cccccccc-0000-0000-0000-000000000001','anon-xyz');

-- 11-12. schema validation — CHECK constraints reject bad enum values (superuser path).
do $$ declare ok boolean := false; begin
  begin insert into public.chatbot_messages (conversation_id, role, content)
    values ('cccccccc-0000-0000-0000-000000000001','bot','x');
  exception when check_violation then ok := true; end;
  perform test.assert(ok, '11. invalid chatbot message role rejected by CHECK');
end $$;

do $$ declare ok boolean := false; begin
  begin insert into public.lead_intake_drafts (status, claim_token) values ('stolen','x');
  exception when check_violation then ok := true; end;
  perform test.assert(ok, '12. invalid lead draft status rejected by CHECK');
end $$;

-- 13. anon cannot execute claim_lead_draft (REVOKE, not just RLS).
begin;
  set local role anon;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000003','tok-3');
    exception when insufficient_privilege then ok := true; end;
    perform test.assert(ok, '13. anon cannot execute claim_lead_draft');
  end $$;
rollback;

-- 14. non-existent draft id → same generic rejection as wrong token.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('ffffffff-ffff-ffff-ffff-ffffffffffff','tok');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '14. non-existent draft claim is rejected');
  end $$;
rollback;

-- 15. draft with null claim_token cannot be claimed.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000006','guess');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '15. null claim_token draft cannot be claimed');
  end $$;
rollback;

-- 16. conversation delete cascades dependent messages (orphan cleanup).
begin;
  insert into public.chatbot_messages (conversation_id, role, content)
    values ('cccccccc-0000-0000-0000-000000000001','assistant','bye');
  select test.assert((select count(*) from public.chatbot_messages
    where conversation_id = 'cccccccc-0000-0000-0000-000000000001') = 1,
    '16a. message exists before cascade');
  delete from public.chatbot_conversations where id = 'cccccccc-0000-0000-0000-000000000001';
  select test.assert((select count(*) from public.chatbot_messages) = 0,
    '16b. conversation delete cascades messages');
rollback;

-- 17. authenticated cannot insert into chatbot tables (no grant/policy).
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin insert into public.chatbot_conversations (anon_id) values ('evil');
    exception when insufficient_privilege then ok := true; end;
    perform test.assert(ok, '17. authenticated cannot insert conversations');
  end $$;
rollback;

-- 6. SECURITY DEFINER + empty (hardened) search_path — catalog proof.
select test.assert(
  exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'claim_lead_draft'
            and p.prosecdef
            and p.proconfig @> array['search_path=""']),
  '6. claim_lead_draft is SECURITY DEFINER with empty search_path');

-- 1. anon deny — anon has SELECT grant yet RLS returns zero rows on all 4 tables.
begin;
  set local role anon;
  select test.assert((select count(*) from public.lead_intake_drafts) = 0,    '1a. anon sees zero lead drafts');
  select test.assert((select count(*) from public.chatbot_conversations) = 0, '1b. anon sees zero conversations');
  select test.assert((select count(*) from public.chatbot_messages) = 0,      '1c. anon sees zero messages');
  select test.assert((select count(*) from public.chatbot_events) = 0,        '1d. anon sees zero events');
rollback;

-- 1e-1h. authenticated deny — before any claim, user A sees zero on all 4 tables.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert((select count(*) from public.lead_intake_drafts) = 0,    '1e. authenticated sees zero unclaimed drafts');
  select test.assert((select count(*) from public.chatbot_conversations) = 0, '1f. authenticated sees zero conversations');
  select test.assert((select count(*) from public.chatbot_messages) = 0,      '1g. authenticated sees zero messages');
  select test.assert((select count(*) from public.chatbot_events) = 0,        '1h. authenticated sees zero events');
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

-- 7. unauthenticated caller — authenticated role but no JWT sub → auth.uid() null → 28000.
begin;
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000003','tok-3');
    exception when sqlstate '28000' then ok := true; end;
    perform test.assert(ok, '7. unauthenticated claim is rejected (28000)');
  end $$;
rollback;

-- 8. service_role write path — bypasses RLS (the capture-lead edge-fn contract).
begin;
  set local role service_role;
  insert into public.chatbot_messages (conversation_id, role, content)
    values ('cccccccc-0000-0000-0000-000000000001','user','hi');
  select test.assert((select count(*) from public.chatbot_messages) = 1,
    '8. service_role can insert chatbot messages');
rollback;

-- 9. authenticated write deny — no INSERT grant/policy → insufficient_privilege (42501).
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin insert into public.lead_intake_drafts (status, claim_token) values ('ready','evil');
    exception when insufficient_privilege then ok := true; end;
    perform test.assert(ok, '9. authenticated cannot insert lead drafts');
  end $$;
rollback;

-- 2. user ownership — user A claims D1; verify side-effects + that they see only their own.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert((public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000001','tok-1')).status = 'claimed',
    '2a. user A can claim a valid draft with the right token');
  select test.assert((select claim_token is null from public.lead_intake_drafts
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'), '2b. claim clears the single-use token');
  select test.assert((select claimed_at is not null from public.lead_intake_drafts
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'), '2c. claim sets claimed_at');
  select test.assert((select user_id from public.lead_intake_drafts
    where id = 'aaaaaaaa-0000-0000-0000-000000000001') = '11111111-1111-1111-1111-111111111111'::uuid,
    '2d. claim transfers ownership to the caller');
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '2e. user A sees exactly one draft (their own)');
  select test.assert((select id from public.lead_intake_drafts) = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    '2f. the visible draft is user A''s, not user B''s');
commit;   -- persist so the double-claim test sees it

-- 10. null-expiry — a draft with no claim_token_expires_at is still claimable.
begin;
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select test.assert((public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000005','tok-null')).status = 'claimed',
    '10. a draft with null expiry is claimable');
rollback;

-- 5. double claim — D1 already claimed (token cleared) → rejected; user B sees only their own.
begin;
  select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', true);
  set local role authenticated;
  do $$ declare ok boolean := false; begin
    begin perform public.claim_lead_draft('aaaaaaaa-0000-0000-0000-000000000001','tok-1');
    exception when sqlstate 'P0001' then ok := true; end;
    perform test.assert(ok, '5. already-claimed draft cannot be re-claimed');
  end $$;
  select test.assert((select count(*) from public.lead_intake_drafts) = 1,
    '5b. user B sees exactly one draft (their own D4)');
  select test.assert((select id from public.lead_intake_drafts) = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
    '5c. user B sees their own draft, never user A''s');
rollback;

\echo 'ALL WEB-015 RLS/claim assertions passed.'
