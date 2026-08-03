-- IPI-832 · ONB2-DB-001 — onboarding_sessions + materialize RPC authorization proof
--
-- Guards migration 20260801051934_onboarding_sessions_and_materialize_rpc.sql.
-- Same pre-merge pattern as 007_org_tenant_isolation.sql: apply the migration DDL
-- inside begin…rollback so CI passes before supabase:push lands the real objects.
--
-- Plan math: 22 asserts
--   unique(2) + check(1) + RLS shape(1) + stranger deny(1) + owner allow(1)
--   + null-auth(1) + invoker(1) + grants(3) + success/replay/status/screen/org/brand(6)
--   + atomic fail(3) + heal stuck screen on replay(1) + heal tenant deny(2)

set search_path to public, extensions;

begin;

-- Mirror 20260801051934 (transactional DDL; rolled back with fixtures).
create table if not exists public.onboarding_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'materialized')),
  current_screen  smallint not null default 1
                    check (current_screen between 1 and 13),
  draft_answers   jsonb not null default '{}'::jsonb,
  organization_id uuid references public.organizations(id) on delete set null,
  brand_id        uuid references public.brands(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint onboarding_sessions_user_key unique (user_id, idempotency_key)
);

drop trigger if exists onboarding_sessions_set_updated_at on public.onboarding_sessions;
create trigger onboarding_sessions_set_updated_at
  before update on public.onboarding_sessions
  for each row execute function public.set_updated_at();

alter table public.onboarding_sessions enable row level security;

drop policy if exists "onboarding_sessions_own" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_select_own" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_insert_own" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_update_own" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_delete_own" on public.onboarding_sessions;

create policy "onboarding_sessions_select_own" on public.onboarding_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "onboarding_sessions_insert_own" on public.onboarding_sessions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'draft'
    and organization_id is null
    and brand_id is null
  );

create policy "onboarding_sessions_update_own" on public.onboarding_sessions
  for update to authenticated
  using (
    (select auth.uid()) = user_id
    and (
      status = 'draft'
      or current_setting('app.onboarding_materializing', true) = 'on'
    )
  )
  with check (
    (select auth.uid()) = user_id
    and (
      (status = 'draft' and organization_id is null and brand_id is null)
      or current_setting('app.onboarding_materializing', true) = 'on'
    )
  );

create policy "onboarding_sessions_delete_own" on public.onboarding_sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.materialize_onboarding_session(
  p_idempotency_key text,
  p_brand_name      text,
  p_brand_url       text
) returns jsonb
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_session  public.onboarding_sessions%rowtype;
  v_org_id   uuid;
  v_brand_id uuid;
  v_slug     text;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select * into v_session
    from public.onboarding_sessions
   where user_id = v_uid and idempotency_key = p_idempotency_key
   for update;

  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  if v_session.status = 'materialized' then
    if v_session.current_screen < 12 then
      perform set_config('app.onboarding_materializing', 'on', true);
      update public.onboarding_sessions
         set current_screen = 12
       where id = v_session.id;
    end if;
    return jsonb_build_object('organization_id', v_session.organization_id,
                              'brand_id',        v_session.brand_id);
  end if;

  v_org_id   := gen_random_uuid();
  v_brand_id := gen_random_uuid();
  v_slug     := left(regexp_replace(lower(p_brand_name), '[^a-z0-9]+', '-', 'g'), 40)
                || '-' || left(v_org_id::text, 8);

  insert into public.organizations (id, name, slug, owner_id, type)
  values (v_org_id, p_brand_name, v_slug, v_uid, 'brand');

  insert into public.brands (id, name, org_id, user_id, brand_url)
  values (v_brand_id, p_brand_name, v_org_id, v_uid, p_brand_url);

  perform set_config('app.onboarding_materializing', 'on', true);

  update public.onboarding_sessions
     set status = 'materialized',
         organization_id = v_org_id,
         brand_id = v_brand_id,
         current_screen = 12
   where id = v_session.id;

  return jsonb_build_object('organization_id', v_org_id, 'brand_id', v_brand_id);
end $$;

revoke execute on function public.materialize_onboarding_session(text, text, text) from public, anon;
grant  execute on function public.materialize_onboarding_session(text, text, text) to authenticated;

select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000c01', 'ipi832-owner@test.local'),
  ('00000000-0000-4000-8000-000000000c02', 'ipi832-stranger@test.local');

-- ── 1) unique constraint onboarding_sessions_user_key exists ───────────────────────────────
select ok(
  (select exists (
     select 1
       from pg_constraint c
       join pg_class t on t.oid = c.conrelid
       join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'onboarding_sessions'
        and c.conname = 'onboarding_sessions_user_key'
        and c.contype = 'u'
  )),
  'onboarding_sessions_user_key exists and is UNIQUE'
);

-- ── 2) second insert with same (user_id, idempotency_key) raises 23505 ─────────────────────
insert into public.onboarding_sessions (user_id, idempotency_key)
values ('00000000-0000-4000-8000-000000000c01', 'ipi832-key-dup');

select throws_ok(
  $$ insert into public.onboarding_sessions (user_id, idempotency_key)
     values ('00000000-0000-4000-8000-000000000c01', 'ipi832-key-dup') $$,
  '23505',
  null,
  'duplicate (user_id, idempotency_key) raises unique_violation'
);

-- ── 3) current_screen outside 1-13 raises 23514 ────────────────────────────────────────────
select throws_ok(
  $$ insert into public.onboarding_sessions (user_id, idempotency_key, current_screen)
     values ('00000000-0000-4000-8000-000000000c01', 'ipi832-key-screen', 99) $$,
  '23514',
  null,
  'current_screen outside 1-13 raises check_violation'
);

-- ── 4) RLS enabled; four own-row policies (select/insert/update/delete) ─────────────────────
select ok(
  (select c.relrowsecurity
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'onboarding_sessions')
  and (select count(*)::int
         from pg_policy p
         join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'onboarding_sessions') = 4
  and (select bool_and(coalesce(pg_get_expr(p.polqual, p.polrelid), pg_get_expr(p.polwithcheck, p.polrelid), '')
                         like '%auth.uid()%user_id%')
         from pg_policy p
         join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'onboarding_sessions'),
  'RLS enabled with four own-row policies using (select auth.uid()) = user_id'
);

-- ── 5) user A selecting user B's session → 0 rows ──────────────────────────────────────────
insert into public.onboarding_sessions (id, user_id, idempotency_key)
values (
  '00000000-0000-4000-8000-000000000d01',
  '00000000-0000-4000-8000-000000000c01',
  'ipi832-key-rls'
);

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c02","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c02';
set local role authenticated;

select is(
  (select count(*)::int from public.onboarding_sessions
     where id = '00000000-0000-4000-8000-000000000d01'),
  0,
  'a stranger reads zero rows for another user''s onboarding session'
);

-- ── 6) owner reads own row (allow path) ────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c01","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c01';

select is(
  (select count(*)::int from public.onboarding_sessions
     where id = '00000000-0000-4000-8000-000000000d01'),
  1,
  'the owner reads their own onboarding session'
);

-- ── 7) RPC with auth.uid() null raises 42501 ───────────────────────────────────────────────
-- Test 5/6 left request.jwt.claim.sub set; reset role alone does not clear it.
reset role;
set local request.jwt.claims = '{}';
set local request.jwt.claim.sub = '';
select throws_ok(
  $$ select public.materialize_onboarding_session('ipi832-key-rls', 'Brand', 'https://x.test') $$,
  '42501',
  null,
  'materialize_onboarding_session without auth.uid() raises insufficient_privilege'
);

-- ── 8) RPC is security invoker with search_path = public ───────────────────────────────────
select ok(
  (select not p.prosecdef
        and coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=public%'
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'materialize_onboarding_session'
      and pg_get_function_identity_arguments(p.oid)
          = 'p_idempotency_key text, p_brand_name text, p_brand_url text'),
  'materialize_onboarding_session is SECURITY INVOKER with search_path=public'
);

-- ── 9–11) EXECUTE grants: PUBLIC/anon denied, authenticated allowed ────────────────────────
select is(
  coalesce((
    select bool_or(a.privilege_type = 'EXECUTE')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as a
     where n.nspname = 'public'
       and p.proname = 'materialize_onboarding_session'
       and pg_get_function_identity_arguments(p.oid) = 'text, text, text'
       and a.grantee = 0
  ), false),
  false,
  'PUBLIC must not EXECUTE materialize_onboarding_session'
);

select is(
  has_function_privilege('anon', 'materialize_onboarding_session(text, text, text)', 'EXECUTE'),
  false,
  'anon must not EXECUTE materialize_onboarding_session'
);

select is(
  has_function_privilege('authenticated', 'materialize_onboarding_session(text, text, text)', 'EXECUTE'),
  true,
  'authenticated must EXECUTE materialize_onboarding_session'
);

-- ── 12–16) success path, status, org/brand counts, replay idempotency ──────────────────────
insert into public.onboarding_sessions (user_id, idempotency_key)
values ('00000000-0000-4000-8000-000000000c01', 'ipi832-key-ok');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c01","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c01';
set local role authenticated;

create temporary table _ipi832_result on commit drop as
select public.materialize_onboarding_session(
  'ipi832-key-ok', 'IPI832 Happy Brand', 'https://happy.test'
) as first_call;

select is(
  (select public.materialize_onboarding_session(
     'ipi832-key-ok', 'IPI832 Happy Brand', 'https://happy.test')),
  (select first_call from _ipi832_result),
  'replay returns the identical organization_id and brand_id'
);

select is(
  (select status from public.onboarding_sessions
     where user_id = '00000000-0000-4000-8000-000000000c01'
       and idempotency_key = 'ipi832-key-ok'),
  'materialized',
  'successful materialize sets status = materialized'
);

select is(
  (select current_screen from public.onboarding_sessions
     where user_id = '00000000-0000-4000-8000-000000000c01'
       and idempotency_key = 'ipi832-key-ok'),
  12::smallint,
  'successful materialize persists analysis screen (12)'
);

reset role;

select is(
  (select count(*)::int from public.organizations where name = 'IPI832 Happy Brand'),
  1,
  'materialization creates exactly one organization'
);

select is(
  (select count(*)::int from public.brands where name = 'IPI832 Happy Brand'),
  1,
  'materialization creates exactly one brand'
);

-- ── 16–17) forced brand-insert failure leaves 0 organizations ──────────────────────────────
create or replace function public._ipi832_fail_brand_insert()
returns trigger
language plpgsql
as $$
begin
  if new.name = 'IPI832 Atomic Fail' then
    raise exception 'forced brand insert failure' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists _ipi832_fail_brand_insert on public.brands;
create trigger _ipi832_fail_brand_insert
  before insert on public.brands
  for each row execute function public._ipi832_fail_brand_insert();

insert into public.onboarding_sessions (user_id, idempotency_key)
values ('00000000-0000-4000-8000-000000000c01', 'ipi832-key-atomic');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c01","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c01';
set local role authenticated;

select throws_ok(
  $$ select public.materialize_onboarding_session(
       'ipi832-key-atomic', 'IPI832 Atomic Fail', 'https://atomic.fail'
     ) $$,
  'P0001',
  null,
  'forced brand insert failure aborts the RPC'
);

reset role;

select is(
  (select count(*)::int from public.organizations where name = 'IPI832 Atomic Fail'),
  0,
  'forced brand-insert failure leaves 0 organizations (RPC is atomic)'
);

select is(
  (select current_screen from public.onboarding_sessions
     where user_id = '00000000-0000-4000-8000-000000000c01'
       and idempotency_key = 'ipi832-key-atomic'),
  1::smallint,
  'failed materialize leaves session before analysis screen (current_screen = 1)'
);

drop trigger if exists _ipi832_fail_brand_insert on public.brands;
drop function if exists public._ipi832_fail_brand_insert();

-- ── 20–22) heal stuck screen on replay + stranger cannot enter heal branch ──────────────────
insert into public.onboarding_sessions (
  user_id, idempotency_key, status, current_screen, organization_id, brand_id
)
select
  '00000000-0000-4000-8000-000000000c01',
  'ipi832-key-heal',
  'materialized',
  11,
  o.id,
  b.id
from public.organizations o
join public.brands b on b.org_id = o.id
where o.name = 'IPI832 Happy Brand'
limit 1;

-- Tenant isolation on the heal/replay path (lookup is owner-scoped by auth.uid()).
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c02","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c02';
set local role authenticated;

select throws_ok(
  $$ select public.materialize_onboarding_session(
       'ipi832-key-heal', 'IPI832 Happy Brand', 'https://happy.test'
     ) $$,
  'P0002',
  null,
  'stranger cannot heal another user materialized session'
);

reset role;

select is(
  (select current_screen from public.onboarding_sessions
     where user_id = '00000000-0000-4000-8000-000000000c01'
       and idempotency_key = 'ipi832-key-heal'),
  11::smallint,
  'stranger materialize attempt leaves owner stuck screen unchanged'
);

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000c01","role":"authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000c01';
set local role authenticated;

-- Replay path (no new org/brand); heals current_screen in the same call.
select public.materialize_onboarding_session(
  'ipi832-key-heal', 'IPI832 Happy Brand', 'https://happy.test'
);

reset role;

select is(
  (select current_screen from public.onboarding_sessions
     where user_id = '00000000-0000-4000-8000-000000000c01'
       and idempotency_key = 'ipi832-key-heal'),
  12::smallint,
  'replay heals materialized session stuck at screen 11 to analysis screen 12'
);

select * from finish();
rollback;
