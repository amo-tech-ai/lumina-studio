-- IPI-123 DASH-003 AC5: draft column + enum value for HITL re-analyze workflow
-- Stores pending AI profile until operator confirms; NULL = no pending draft

-- Guard for db reset ordering (IPI-452): this migration's timestamp (20260625000001)
-- precedes 20260626000000 which creates brand_intake_status. Without this guard,
-- db reset replays migrations in timestamp order and ALTER TYPE fires before
-- the type exists. On remote (applied in merge order) the type already exists
-- so this is a no-op.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'brand_intake_status') then
    create type public.brand_intake_status as enum (
      'brand_created',
      'crawl_running',
      'crawl_complete',
      'analysis_running',
      'scores_complete',
      'ready',
      'failed'
    );
  end if;
end $$;

alter type public.brand_intake_status add value if not exists 'draft_ready';
alter table public.brands add column if not exists ai_profile_draft jsonb;
