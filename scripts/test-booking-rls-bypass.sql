-- IPI-341 · MG-4 — RLS bypass lockdown tests for talent.bookings.
-- Run: psql "$DATABASE_URL" -f scripts/test-booking-rls-bypass.sql
--
-- Proves authenticated party cannot UPDATE bookings directly; transition_booking still works.
\set ON_ERROR_STOP on

drop table if exists ipi341_ctx;
create temp table ipi341_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null,
  booking_id uuid not null
);

-- seed context

do $seed$
declare
  v_stamp bigint := extract(epoch from clock_timestamp())::bigint;
  v_brand_user uuid := gen_random_uuid();
  v_talent_user uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
  v_booking_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (v_brand_user, 'authenticated', 'authenticated', format('ipi341r-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi341r-talent-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI341R Brand %s', v_stamp), format('ipi341r-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI341R Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    v_org_id, v_talent_id, 'requested', current_date + 5, current_date + 6, v_brand_user, 1
  )
  returning id into v_booking_id;

  insert into ipi341_ctx values (
    v_brand_user, v_talent_user, v_org_id, v_talent_id, v_booking_id
  );
end;
$seed$;

do $tests$
declare
  c record;
  v_rows int;
  v_status text;
  v_version int;
  v_result jsonb;
begin
  select * into c from ipi341_ctx limit 1;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  execute 'set local role authenticated';

  update talent.bookings
  set status = 'quoted', rate_quoted = 999.00
  where id = c.booking_id;

  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'FAIL: direct status UPDATE should affect 0 rows, got %', v_rows;
  end if;

  select status, version into v_status, v_version
  from talent.bookings
  where id = c.booking_id;

  if v_status <> 'requested' or v_version <> 1 then
    raise exception 'FAIL: booking mutated via direct UPDATE (% / %)', v_status, v_version;
  end if;
  raise notice 'ok: authenticated direct status UPDATE blocked by RLS';

  -- Non-status UPDATE also blocked (MVP: all mutations via RPC)
  update talent.bookings
  set message = 'bypass attempt'
  where id = c.booking_id;

  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'FAIL: direct non-status UPDATE should affect 0 rows, got %', v_rows;
  end if;
  raise notice 'ok: authenticated direct non-status UPDATE blocked by RLS';

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);

  v_result := public.transition_booking(c.booking_id, 1, 'quoted', 400.00, null, null, null);

  if v_result->>'status' <> 'quoted' or (v_result->>'version')::int <> 2 then
    raise exception 'FAIL: transition_booking should bypass RLS: %', v_result;
  end if;
  raise notice 'ok: transition_booking succeeds while direct UPDATE is blocked';
end;
$tests$;

do $cleanup$
declare
  c record;
begin
  select * into c from ipi341_ctx limit 1;
  delete from talent.bookings where id = c.booking_id;
  delete from talent.talent_profiles where id = c.talent_id;
  delete from public.brands where org_id = c.org_id;
  delete from public.org_members where org_id = c.org_id;
  delete from public.organizations where id = c.org_id;
  delete from auth.users where id in (c.brand_user, c.talent_user);
end;
$cleanup$;

select 'IPI-341 RLS bypass tests passed' as result;
