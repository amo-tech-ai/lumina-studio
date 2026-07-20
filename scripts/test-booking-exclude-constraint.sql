-- IPI-347 · MG-9 — EXCLUDE constraint blocks overlapping confirmed bookings.
-- IPI-733 · MODEL-TEST-001 — UUID fixture stamp (parallel-CI email uniqueness).
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-booking-exclude-constraint.sql
--
-- Proves bookings_no_overlap_when_confirmed rejects a second confirm for the same
-- talent with overlapping dates (SQLSTATE 23P01 via confirm_booking).

drop table if exists ipi347_ctx;
create temp table ipi347_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null,
  booking_a uuid,
  booking_b uuid
);

do $seed$
declare
  v_stamp text := replace(gen_random_uuid()::text, '-', '');
  v_brand_user uuid := gen_random_uuid();
  v_talent_user uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
  v_booking_a uuid;
  v_booking_b uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (v_brand_user, 'authenticated', 'authenticated', format('ipi347-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi347-talent-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI347 Brand %s', v_stamp), format('ipi347-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI347 Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    v_org_id, v_talent_id, 'approved', current_date + 30, current_date + 32, v_brand_user, 1
  )
  returning id into v_booking_a;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    v_org_id, v_talent_id, 'approved', current_date + 31, current_date + 33, v_brand_user, 1
  )
  returning id into v_booking_b;

  insert into ipi347_ctx values (
    v_brand_user, v_talent_user, v_org_id, v_talent_id, v_booking_a, v_booking_b
  );
end;
$seed$;

do $tests$
declare
  c record;
  v_ok boolean := false;
begin
  select * into c from ipi347_ctx limit 1;

  perform public.confirm_booking(c.booking_a);
  raise notice 'ok: first confirm_booking succeeded';

  begin
    perform public.confirm_booking(c.booking_b);
  exception
    when exclusion_violation then
      v_ok := true;
    when others then
      if sqlstate = '23P01' then
        v_ok := true;
      elsif sqlerrm like 'Booking conflict:%' then
        v_ok := true;
      else
        raise;
      end if;
  end;

  if not v_ok then
    raise exception 'FAIL: second overlapping confirm_booking should raise exclusion_violation';
  end if;
  raise notice 'ok: overlapping confirm_booking blocked by EXCLUDE constraint';

  if (select count(*) from talent.bookings where talent_profile_id = c.talent_id and status = 'confirmed') <> 1 then
    raise exception 'FAIL: expected exactly one confirmed booking after conflict';
  end if;
  raise notice 'ok: only one confirmed booking remains';
end;
$tests$;
