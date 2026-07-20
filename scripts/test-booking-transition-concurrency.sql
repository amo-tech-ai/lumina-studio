-- IPI-341 · MG-4 — optimistic-lock / stale_booking tests for transition_booking.
-- IPI-733 · MODEL-TEST-001 — UUID fixture stamp (parallel-CI email uniqueness).
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-booking-transition-concurrency.sql
--
-- Proves version gate: first transition wins; retry with stale expected_version fails.

drop table if exists ipi341_ctx;
create temp table ipi341_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null
);

-- seed context

do $seed$
declare
  v_stamp text := replace(gen_random_uuid()::text, '-', '');
  v_brand_user uuid := gen_random_uuid();
  v_talent_user uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (v_brand_user, 'authenticated', 'authenticated', format('ipi341c-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi341c-talent-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI341C Brand %s', v_stamp), format('ipi341c-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI341C Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into ipi341_ctx values (
    v_brand_user, v_talent_user, v_org_id, v_talent_id
  );
end;
$seed$;

do $tests$
declare
  c record;
  v_booking_id uuid;
  v_first jsonb;
  v_version int;
  v_ok boolean;
begin
  select * into c from ipi341_ctx limit 1;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 10, current_date + 11, c.brand_user, 1
  )
  returning id into v_booking_id;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);

  v_first := public.transition_booking(v_booking_id, 1, 'quoted', 250.00, null, null, null);
  v_version := (v_first->>'version')::int;

  if v_version <> 2 or v_first->>'status' <> 'quoted' then
    raise exception 'FAIL: first transition expected quoted v2, got %', v_first;
  end if;
  raise notice 'ok: first transition succeeded (version 1 → 2)';

  v_ok := false;
  begin
    perform public.transition_booking(v_booking_id, 1, 'quoted', 300.00, null, null, null);
  exception
    when others then
      if sqlerrm = 'stale_booking' then
        v_ok := true;
      else
        raise;
      end if;
  end;

  if not v_ok then
    raise exception 'FAIL: stale expected_version=1 should raise stale_booking';
  end if;
  raise notice 'ok: stale expected_version raises stale_booking';

  if (select version from talent.bookings where id = v_booking_id) <> 2 then
    raise exception 'FAIL: booking version mutated after stale attempt';
  end if;
  raise notice 'ok: row unchanged after stale attempt';

  -- Date-only path also requires matching version
  v_ok := false;
  begin
    perform public.transition_booking(
      v_booking_id, 1, null, null, current_date + 20, current_date + 21, null
    );
  exception
    when others then
      if sqlerrm = 'stale_booking' then
        v_ok := true;
      else
        raise;
      end if;
  end;

  if not v_ok then
    raise exception 'FAIL: date-only reschedule with stale version should raise stale_booking';
  end if;
  raise notice 'ok: date-only path respects expected_version';
end;
$tests$;

do $cleanup$
declare
  c record;
begin
  select * into c from ipi341_ctx limit 1;
  delete from talent.bookings where brand_org_id = c.org_id;
  delete from talent.talent_profiles where id = c.talent_id;
  delete from public.brands where org_id = c.org_id;
  delete from public.org_members where org_id = c.org_id;
  delete from public.organizations where id = c.org_id;
  delete from auth.users where id in (c.brand_user, c.talent_user);
end;
$cleanup$;

select 'IPI-341 concurrency tests passed' as result;
