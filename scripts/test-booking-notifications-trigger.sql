-- IPI-343 · MG-5 — booking trigger still inserts notifications after read-model migration.
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-booking-notifications-trigger.sql

drop table if exists ipi343_trig_ctx;
create temp table ipi343_trig_ctx (
  brand_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null,
  booking_id uuid
);

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
    (v_brand_user, 'authenticated', 'authenticated', format('ipi343-trig-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi343-trig-talent-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI343 Trig %s', v_stamp), format('ipi343-trig-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI343 Trig %s', v_stamp), v_brand_user, v_org_id);

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

  insert into ipi343_trig_ctx values (v_brand_user, v_org_id, v_talent_id, v_booking_id);
end;
$seed$;

do $assert$
declare
  c record;
  v_count integer;
begin
  select * into c from ipi343_trig_ctx limit 1;

  select count(*) into v_count
  from public.notifications n
  where n.kind = 'booking_requested'
    and n.payload->>'booking_id' = c.booking_id::text;

  if v_count < 1 then
    raise exception 'FAIL: booking insert did not create booking_requested notification';
  end if;
end;
$assert$;

select 'IPI-343 booking notification trigger test passed' as result;
