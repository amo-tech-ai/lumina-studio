-- IPI-835 · ONB2-INT-001 Slice A — brands Realtime publication column list
--
-- Guards migration 20260801080000_brands_realtime_publication.sql.
-- Mirrors the publication DDL inside begin…rollback so CI can pass before
-- supabase:push (same pattern as 008_onboarding_sessions.sql).
--
-- Plan math: 5 asserts
--   published(1) + exact columns(1) + no draft leak(1) + no lock leak(1)
--   + sibling brand_crawls still published(1)
--
-- Mirror must use IF NOT FOUND for absence: attnames is NULL for full-table
-- publish as well as for a missing row, so `IF current_cols IS NULL` is wrong.

set search_path to public, extensions;

begin;
select plan(5);

-- Mirror 20260801080000 (transactional; rolled back with fixtures).
do $$
declare
  current_cols name[];
  wanted       name[] := array['id', 'intake_status', 'updated_at']::name[];
begin
  select attnames
    into current_cols
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'brands';

  if not found then
    alter publication supabase_realtime
      add table public.brands (id, intake_status, updated_at);
    return;
  end if;

  if current_cols is not null
     and current_cols @> wanted
     and wanted @> current_cols then
    return;
  end if;

  -- Wrong shape: full-table (attnames NULL) or mismatched column list.
  alter publication supabase_realtime drop table public.brands;
  alter publication supabase_realtime
    add table public.brands (id, intake_status, updated_at);
end $$;

select ok(
  exists(
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'brands'
  ),
  'brands is in supabase_realtime'
);

select is(
  (
    select array_agg(col order by col)
    from pg_publication_tables p
    cross join lateral unnest(p.attnames) as col
    where p.pubname = 'supabase_realtime'
      and p.schemaname = 'public'
      and p.tablename = 'brands'
  ),
  array['id', 'intake_status', 'updated_at']::name[],
  'brands publication attnames are exactly {id, intake_status, updated_at}'
);

select ok(
  not exists(
    select 1
    from pg_publication_tables p
    cross join lateral unnest(p.attnames) as col
    where p.pubname = 'supabase_realtime'
      and p.schemaname = 'public'
      and p.tablename = 'brands'
      and col = 'ai_profile_draft'
  ),
  'brands publication does not leak ai_profile_draft'
);

select ok(
  not exists(
    select 1
    from pg_publication_tables p
    cross join lateral unnest(p.attnames) as col
    where p.pubname = 'supabase_realtime'
      and p.schemaname = 'public'
      and p.tablename = 'brands'
      and col = 'analysis_lock_token'
  ),
  'brands publication does not leak analysis_lock_token'
);

-- Guard against accidental SET TABLE that would wipe crawl progress Realtime.
select ok(
  exists(
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'brand_crawls'
  ),
  'brand_crawls remains in supabase_realtime (sibling not dropped)'
);

select * from finish();
rollback;
