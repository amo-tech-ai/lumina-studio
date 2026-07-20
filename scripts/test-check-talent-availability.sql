-- IPI-348 · MG-10 — check_talent_availability RPC smoke test.
-- IPI-733 · MODEL-TEST-001 — UUID fixture stamp (parallel-CI email uniqueness).
-- Run: psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f scripts/test-check-talent-availability.sql

select pg_catalog.pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'check_talent_availability';

drop table if exists ipi348_ctx;
create temp table ipi348_ctx (
  brand_user uuid not null,
  talent_id uuid not null
);

do $seed$
declare
  v_stamp text := replace(gen_random_uuid()::text, '-', '');
  v_brand_user uuid := gen_random_uuid();
  v_org_id uuid;
  v_talent_id uuid;
begin
  insert into auth.users (id, aud, role, email)
  values (
    v_brand_user,
    'authenticated',
    'authenticated',
    format('ipi348-brand-%s@test.local', v_stamp)
  );

  insert into public.organizations (name, slug, owner_id, type)
  values (format('IPI348 Brand %s', v_stamp), format('ipi348-brand-%s', v_stamp), v_brand_user, 'brand')
  returning id into v_org_id;

  insert into public.brands (name, user_id, org_id)
  values (format('IPI348 Brand %s', v_stamp), v_brand_user, v_org_id);

  insert into talent.talent_profiles (profile_id, display_name)
  values (v_brand_user, format('Talent %s', v_stamp))
  returning id into v_talent_id;

  insert into ipi348_ctx values (v_brand_user, v_talent_id);
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
  v_row jsonb;
begin
  select * into c from ipi348_ctx limit 1;

  perform pg_temp.assert_raises(
    'authentication required',
    format(
      'select public.check_talent_availability(%L::uuid, %L::date, %L::date)',
      c.talent_id,
      current_date + 10,
      current_date + 11
    )
  );

  perform set_config('request.jwt.claim.sub', c.brand_user::text, true);
  v_row := public.check_talent_availability(
    c.talent_id,
    current_date + 10,
    current_date + 11
  );

  if v_row->>'id' <> c.talent_id::text then
    raise exception 'FAIL: check_talent_availability returned wrong id';
  end if;
  if coalesce((v_row->>'is_available')::boolean, false) is not true then
    raise exception 'FAIL: expected is_available true for open calendar';
  end if;

  perform pg_temp.assert_raises(
    'invalid date range: start date must be on or before end date',
    format(
      'select public.check_talent_availability(%L::uuid, %L::date, %L::date)',
      c.talent_id,
      current_date + 20,
      current_date + 10
    )
  );
end;
$tests$;

select 'IPI-348 check_talent_availability tests passed' as result;
