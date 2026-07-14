-- IPI-123 DASH-003 AC5: draft column + enum value for HITL re-analyze workflow
-- Stores pending AI profile until operator confirms; NULL = no pending draft

alter type public.brand_intake_status add value if not exists 'draft_ready';
alter table public.brands add column if not exists ai_profile_draft jsonb;
