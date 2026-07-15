-- IPI-615 — add composite index for pending brand intake draft queries
-- This index was added to 20260626000005 after it had already been pushed,
-- so it was never applied to the remote. This migration applies it cleanly.

CREATE INDEX IF NOT EXISTS brand_intake_drafts_pending_user_updated_idx
ON public.brand_intake_drafts (
  user_id,
  status,
  updated_at DESC
)
WHERE status IN ('pending', 'pending_approval');
