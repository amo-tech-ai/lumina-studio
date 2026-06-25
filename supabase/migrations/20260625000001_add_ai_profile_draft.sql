-- IPI-123 DASH-003 AC5: draft column for HITL re-analyze workflow
-- Stores pending AI profile until operator confirms; NULL = no pending draft
ALTER TABLE brands ADD COLUMN IF NOT EXISTS ai_profile_draft JSONB;
