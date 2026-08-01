-- IPI-835 · ONB2-INT-001 Slice A — publish brands intake columns to Realtime
--
-- Brand Hub + onboarding progress listen for postgres_changes on public.brands,
-- but supabase_realtime only had brand_crawls / brand_crawl_results. Without this
-- publication, intake_status updates never reach the client.
--
-- Column list (not bare table): keep ai_profile_draft and analysis_lock_token out
-- of every Realtime payload. PK id must be included so UPDATE events keep row identity
-- (PostgreSQL 15+ column lists).
--
-- Rollback:
--   alter publication supabase_realtime drop table public.brands;

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

  if current_cols is null then
    alter publication supabase_realtime
      add table public.brands (id, intake_status, updated_at);
    return;
  end if;

  -- Already present with the exact column set — no-op (idempotent re-apply).
  if current_cols @> wanted and wanted @> current_cols then
    return;
  end if;

  -- Wrong shape (e.g. full-table publish) — replace this table only.
  -- Never use SET TABLE on supabase_realtime (that would drop sibling tables).
  alter publication supabase_realtime drop table public.brands;
  alter publication supabase_realtime
    add table public.brands (id, intake_status, updated_at);
end $$;
