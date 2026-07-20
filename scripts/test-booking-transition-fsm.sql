-- IPI-341 · MG-4 — FSM integration tests for transition_booking.
-- IPI-733 · MODEL-TEST-001 — UUID fixture stamp (parallel-CI email uniqueness).
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-booking-transition-fsm.sql

drop table if exists ipi341_ctx;
create temp table ipi341_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null
);

-- seed context (truncated by drop above)

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
    (v_brand_user, 'authenticated', 'authenticated', format('ipi341-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi341-talent-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI341 Brand %s', v_stamp), format('ipi341-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI341 Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into ipi341_ctx values (
    v_brand_user, v_talent_user, v_org_id, v_talent_id
  );
end;
$seed$;

-- Helper: assert transition_booking raises expected message.
create or replace function pg_temp.assert_raises(p_msg text, p_sql text)
returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
    raise exception 'FAIL: expected % but statement succeeded', p_msg;
  exception
    when others then
      if sqlerrm <> p_msg then
        raise exception 'FAIL: expected %, got %', p_msg, sqlerrm;
      end if;
  end;
end;
$$;
-- IPI-684: global default EXECUTE no longer includes PUBLIC; SET ROLE tests need this.
grant execute on function pg_temp.assert_raises(text, text) to public;

do $tests$
declare
  c record;
  v_booking_id uuid;
  v_result jsonb;
begin
  select * into c from ipi341_ctx limit 1;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 14, current_date + 15, c.brand_user, 1
  )
  returning id into v_booking_id;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);
  v_result := public.transition_booking(v_booking_id, 1, 'quoted', 500.00, null, null, null);
  if v_result->>'status' <> 'quoted' or (v_result->>'version')::int <> 2 then
    raise exception 'FAIL: talent quote: %', v_result;
  end if;
  raise notice 'ok: talent requested → quoted';

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_result := public.transition_booking(v_booking_id, 2, 'approved', null, null, null, null);
  if v_result->>'status' <> 'approved' or v_result->>'approved_by' is null then
    raise exception 'FAIL: brand approve: %', v_result;
  end if;
  raise notice 'ok: brand quoted → approved';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 20, current_date + 21, c.brand_user, 1
  )
  returning id into v_booking_id;

  perform pg_temp.assert_raises(
    'invalid_transition',
    format(
      'select public.transition_booking(%L::uuid, 1, ''quoted'', 100.00, null, null, null)',
      v_booking_id
    )
  );
  raise notice 'ok: brand cannot requested → quoted';

  v_result := public.transition_booking(v_booking_id, 1, 'approved', null, null, null, null);
  if v_result->>'status' <> 'approved' then
    raise exception 'FAIL: brand fast-path approve: %', v_result;
  end if;
  raise notice 'ok: brand requested → approved';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 30, current_date + 31, c.brand_user, 1
  )
  returning id into v_booking_id;

  v_result := public.transition_booking(v_booking_id, 1, 'declined', null, null, null, null);
  if v_result->>'status' <> 'declined' then
    raise exception 'FAIL: brand decline: %', v_result;
  end if;
  raise notice 'ok: brand requested → declined';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 40, current_date + 41, c.brand_user, 1
  )
  returning id into v_booking_id;

  perform pg_temp.assert_raises(
    'cancellation_reason_required',
    format(
      'select public.transition_booking(%L::uuid, 1, ''cancelled'', null, null, null, null)',
      v_booking_id
    )
  );

  v_result := public.transition_booking(
    v_booking_id, 1, 'cancelled', null, null, null, 'schedule conflict'
  );
  if v_result->>'status' <> 'cancelled' then
    raise exception 'FAIL: cancel with reason: %', v_result;
  end if;
  raise notice 'ok: cancellation_reason required and accepted';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'approved', current_date + 50, current_date + 51, c.brand_user, 1
  )
  returning id into v_booking_id;

  perform pg_temp.assert_raises(
    'invalid_transition',
    format(
      'select public.transition_booking(%L::uuid, 1, ''confirmed'', null, null, null, null)',
      v_booking_id
    )
  );
  raise notice 'ok: confirmed forbidden via transition_booking';

  perform pg_temp.assert_raises(
    'invalid_transition',
    format(
      'select public.transition_booking(%L::uuid, 1, ''expired'', null, null, null, null)',
      v_booking_id
    )
  );
  raise notice 'ok: expired forbidden via transition_booking';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 60, current_date + 61, c.brand_user, 1
  )
  returning id into v_booking_id;

  v_result := public.transition_booking(
    v_booking_id, 1, null, null, current_date + 70, current_date + 71, null
  );
  if v_result->>'status' <> 'requested'
     or (v_result->>'date_start')::date <> current_date + 70 then
    raise exception 'FAIL: date-only reschedule: %', v_result;
  end if;
  raise notice 'ok: date-only reschedule while requested';

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version, rate_quoted
  )
  values (
    c.org_id, c.talent_id, 'quoted', current_date + 80, current_date + 81, c.brand_user, 1, 750.00
  )
  returning id into v_booking_id;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);
  v_result := public.transition_booking(v_booking_id, 1, 'requested', null, null, null, null);
  if v_result->>'status' <> 'requested' then
    raise exception 'FAIL: quoted → requested: %', v_result;
  end if;
  raise notice 'ok: talent quoted → requested';
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

select 'IPI-341 FSM tests passed' as result;
