-- IPI-123 DASH-003 AC5: draft column + enum value for HITL re-analyze workflow
-- Stores pending AI profile until operator confirms; NULL = no pending draft
ALTER TYPE public.brand_intake_status ADD VALUE IF NOT EXISTS 'draft_ready';
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS ai_profile_draft JSONB;
