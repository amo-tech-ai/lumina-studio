-- IPI-343 · MG-5 — per-user notification read model + RPC tests.
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-notification-reads-rls.sql

drop table if exists ipi343_ctx;
create temp table ipi343_ctx (
  brand_user uuid not null,
  talent_user uuid not null,
  outsider_user uuid not null,
  org_id uuid not null,
  talent_id uuid not null,
  notification_id uuid not null
);

do $seed$
declare
  v_stamp bigint := extract(epoch from clock_timestamp())::bigint;
  v_brand_user uuid := gen_random_uuid();
  v_talent_user uuid := gen_random_uuid();
  v_outsider uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
  v_notification_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values
    (v_brand_user, 'authenticated', 'authenticated', format('ipi343-brand-%s@test.local', v_stamp)),
    (v_talent_user, 'authenticated', 'authenticated', format('ipi343-talent-%s@test.local', v_stamp)),
    (v_outsider, 'authenticated', 'authenticated', format('ipi343-outsider-%s@test.local', v_stamp));

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI343 Brand %s', v_stamp), format('ipi343-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI343 Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_talent_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into public.notifications (
    kind, payload, brand_org_id, talent_profile_id, agency_org_id
  )
  values (
    'booking_requested',
    jsonb_build_object('booking_id', gen_random_uuid(), 'status', 'requested'),
    v_org_id,
    v_talent_id,
    null
  )
  returning id into v_notification_id;

  insert into ipi343_ctx values (
    v_brand_user, v_talent_user, v_outsider, v_org_id, v_talent_id, v_notification_id
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
-- IPI-684: global default EXECUTE no longer includes PUBLIC; SET ROLE tests need this.
grant execute on function pg_temp.assert_raises(text, text) to public;

do $tests$
declare
  c record;
  v_list jsonb;
  v_mark jsonb;
  v_read boolean;
begin
  select * into c from ipi343_ctx limit 1;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_list := public.list_notifications(25, null, true);
  if jsonb_array_length(v_list->'items') <> 1 then
    raise exception 'FAIL: brand unread list expected 1 item, got %', jsonb_array_length(v_list->'items');
  end if;
  if (v_list->'items'->0->>'read')::boolean then
    raise exception 'FAIL: brand unread item must have read=false';
  end if;

  v_mark := public.mark_notifications_read(array[c.notification_id], false);
  if (v_mark->>'updated_count')::int <> 1 then
    raise exception 'FAIL: brand mark read expected updated_count=1, got %', v_mark->>'updated_count';
  end if;

  perform set_config('request.jwt.claim.sub', c.talent_user::text, true);
  v_list := public.list_notifications(25, null, true);
  if jsonb_array_length(v_list->'items') <> 1 then
    raise exception 'FAIL: talent still unread after brand mark-read, got % items',
      jsonb_array_length(v_list->'items');
  end if;

  v_mark := public.mark_notifications_read(array[c.notification_id], false);
  if (v_mark->>'updated_count')::int <> 1 then
    raise exception 'FAIL: talent mark read expected updated_count=1';
  end if;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_list := public.list_notifications(25, null, true);
  if jsonb_array_length(v_list->'items') <> 0 then
    raise exception 'FAIL: brand unread list expected 0 after both marked read';
  end if;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  execute 'set local role authenticated';
  begin
    update public.notifications set read = true where id = c.notification_id;
    raise exception 'FAIL: direct notifications.read UPDATE should be blocked';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm not like '%direct updates are not allowed%'
         and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;

  select n.read into v_read
  from public.notifications n
  where n.id = c.notification_id;
  if v_read then
    raise exception 'FAIL: notifications.read must remain false (junction-only semantics)';
  end if;

  perform set_config('request.jwt.claim.sub', c.outsider_user::text, true);
  perform pg_temp.assert_raises(
    'not authorized for notification',
    format(
      'select public.mark_notifications_read(array[%L::uuid], false)',
      c.notification_id
    )
  );

  v_list := public.list_notifications(25, null, false);
  if jsonb_array_length(v_list->'items') <> 0 then
    raise exception 'FAIL: outsider list expected 0 items';
  end if;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  perform pg_temp.assert_raises(
    'too many notification ids',
    'select public.mark_notifications_read(array(select gen_random_uuid() from generate_series(1, 101)), false)'
  );
end;
$tests$;

do $rls$
declare
  c record;
begin
  select * into c from ipi343_ctx limit 1;

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  execute 'set local role authenticated';
  begin
    insert into public.notification_reads (user_id, notification_id)
    values (c.talent_user, c.notification_id);
    raise exception 'FAIL: brand cannot insert junction row for talent user';
  exception
    when others then
      if sqlerrm not like '%violates row-level security%' then
        raise;
      end if;
  end;
end;
$rls$;

select 'IPI-343 notification_reads + RPC tests passed' as result;
