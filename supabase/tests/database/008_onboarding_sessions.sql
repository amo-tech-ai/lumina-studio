-- IPI-832 · ONB2-DB-001 — onboarding_sessions + materialize RPC authorization proof
--
-- Guards migration 20260801051934_onboarding_sessions_and_materialize_rpc.sql.
-- Same pre-merge pattern as 007_org_tenant_isolation.sql: apply the migration DDL
-- inside begin…rollback so CI passes before supabase:push lands the real objects.
--
-- Plan math: 12 asserts (unique + check + RLS + grants + invoker + atomicity)

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
  organization_id uuid references public.organizations(id),
  brand_id        uuid references public.brands(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint onboarding_sessions_user_key unique (user_id, idempotency_key)
);

alter table public.onboarding_sessions enable row level security;

drop policy if exists "onboarding_sessions_own" on public.onboarding_sessions;
create policy "onboarding_sessions_own" on public.onboarding_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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

  update public.onboarding_sessions
     set status = 'materialized',
         organization_id = v_org_id,
         brand_id = v_brand_id,
         updated_at = now()
   where id = v_session.id;

  return jsonb_build_object('organization_id', v_org_id, 'brand_id', v_brand_id);
end $$;

revoke execute on function public.materialize_onboarding_session(text, text, text) from public, anon;
grant  execute on function public.materialize_onboarding_session(text, text, text) to authenticated;

select plan(12);

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

-- ── 4) RLS enabled; exactly one policy scoped to (select auth.uid()) = user_id ─────────────
select ok(
  (select c.relrowsecurity
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'onboarding_sessions')
  and (select count(*)::int
         from pg_policy p
         join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'onboarding_sessions') = 1
  and (select coalesce(pg_get_expr(p.polqual, p.polrelid), '')
         from pg_policy p
         join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'onboarding_sessions'
        limit 1) like '%auth.uid()%user_id%',
  'RLS enabled with one own-row policy using (select auth.uid()) = user_id'
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

-- ── 6) RPC with auth.uid() null raises 42501 ───────────────────────────────────────────────
-- Test 5 left request.jwt.claim.sub = stranger; reset role alone does not clear it, so
-- auth.uid() stayed non-null and the RPC raised P0002 (session not found) instead of 42501.
reset role;
set local request.jwt.claims = '{}';
set local request.jwt.claim.sub = '';
select throws_ok(
  $$ select public.materialize_onboarding_session('ipi832-key-rls', 'Brand', 'https://x.test') $$,
  '42501',
  null,
  'materialize_onboarding_session without auth.uid() raises insufficient_privilege'
);

-- ── 7) RPC is security invoker with search_path = public ───────────────────────────────────
select ok(
  (select not p.prosecdef
        and coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=public%'
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'materialize_onboarding_session'
      and pg_get_function_identity_arguments(p.oid) = 'text, text, text'),
  'materialize_onboarding_session is SECURITY INVOKER with search_path=public'
);

-- ── 8–10) EXECUTE grants: PUBLIC/anon denied, authenticated allowed ────────────────────────
-- PUBLIC is a pseudo-role (not in pg_roles); probe ACL directly (see 010 note).
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

-- ── 11) forced brand-insert failure leaves 0 organizations ─────────────────────────────────
-- Temporary trigger aborts brand insert; whole RPC transaction must roll back the org row.
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

drop trigger if exists _ipi832_fail_brand_insert on public.brands;
drop function if exists public._ipi832_fail_brand_insert();

select * from finish();
rollback;
