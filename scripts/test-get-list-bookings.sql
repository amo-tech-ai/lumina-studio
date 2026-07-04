-- IPI-342 · MG-5 — get_booking + list_bookings integration tests.
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-get-list-bookings.sql

drop table if exists ipi342_ctx;
create temp table ipi342_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  outsider_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null
);

do $seed$
declare
  v_stamp bigint := extract(epoch from clock_timestamp())::bigint;
  v_brand_user uuid := gen_random_uuid();
  v_talent_user uuid := gen_random_uuid();
  v_outsider uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (v_brand_user, 'authenticated', 'authenticated', format('ipi342-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi342-talent-%s@test.local', v_stamp)),
    (v_outsider, 'authenticated', 'authenticated', format('ipi342-outsider-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI342 Brand %s', v_stamp), format('ipi342-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI342 Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into ipi342_ctx values (
    v_brand_user, v_talent_user, v_outsider, v_org_id, v_talent_id
  );
end;
$seed$;

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

do $tests$
declare
  c record;
  v_booking_a uuid;
  v_booking_b uuid;
  v_detail jsonb;
  v_list jsonb;
  v_page2 jsonb;
  v_cursor text;
begin
  select * into c from ipi342_ctx limit 1;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'requested', current_date + 10, current_date + 11, c.brand_user, 1
  )
  returning id into v_booking_a;

  insert into talent.bookings (
    brand_org_id, talent_profile_id, status, date_start, date_end, requested_by, version
  )
  values (
    c.org_id, c.talent_id, 'quoted', current_date + 20, current_date + 21, c.brand_user, 1
  )
  returning id into v_booking_b;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_detail := public.get_booking(v_booking_a);
  if v_detail->'booking'->>'id' <> v_booking_a::text then
    raise exception 'FAIL: get_booking returned wrong id';
  end if;
  if v_detail->>'viewer_role' <> 'brand' then
    raise exception 'FAIL: expected viewer_role brand, got %', v_detail->>'viewer_role';
  end if;
  if jsonb_typeof(v_detail->'history') <> 'array' then
    raise exception 'FAIL: history must be array';
  end if;
  if v_detail->'talent'->>'id' <> c.talent_id::text then
    raise exception 'FAIL: talent summary missing';
  end if;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);
  v_detail := public.get_booking(v_booking_b);
  if v_detail->>'viewer_role' <> 'talent' then
    raise exception 'FAIL: expected viewer_role talent, got %', v_detail->>'viewer_role';
  end if;

  perform set_config('request.jwt.claim.sub', c.outsider_user::text, true);
  perform pg_temp.assert_raises(
    'not authorized for this booking',
    format('select public.get_booking(%L::uuid)', v_booking_a)
  );

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_list := public.list_bookings('brand', c.org_id, null, null, null, 1);
  if jsonb_array_length(v_list->'items') <> 1 then
    raise exception 'FAIL: brand list limit 1 expected 1 item, got %', jsonb_array_length(v_list->'items');
  end if;
  v_cursor := v_list->>'next_cursor';
  if v_cursor is null then
    raise exception 'FAIL: expected next_cursor for 2 bookings with limit 1';
  end if;

  v_page2 := public.list_bookings('brand', c.org_id, null, null, v_cursor, 1);
  if jsonb_array_length(v_page2->'items') <> 1 then
    raise exception 'FAIL: page 2 expected 1 item';
  end if;
  if v_page2->'items'->0->>'id' = v_list->'items'->0->>'id' then
    raise exception 'FAIL: cursor pagination returned duplicate booking';
  end if;

  v_list := public.list_bookings('brand', c.org_id, null, array['quoted'], null, 25);
  if jsonb_array_length(v_list->'items') <> 1 then
    raise exception 'FAIL: status filter expected 1 quoted booking';
  end if;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);
  v_list := public.list_bookings('talent', null, c.talent_id, null, null, 25);
  if jsonb_array_length(v_list->'items') <> 2 then
    raise exception 'FAIL: talent list expected 2 bookings, got %', jsonb_array_length(v_list->'items');
  end if;

  perform set_config('request.jwt.claim.sub', c.outsider_user::text, true);
  perform pg_temp.assert_raises(
    'not a member of this organization',
    format('select public.list_bookings(''brand'', %L::uuid, null, null, null, 25)', c.org_id)
  );
end;
$tests$;

select 'IPI-342 get/list booking tests passed' as result;
