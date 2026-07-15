-- IPI-615 — add composite index for pending brand intake draft queries
-- This index was added to 20260626000005 after it had already been pushed,
-- so it was never applied to the remote. This migration applies it cleanly.

-- Sort key (updated_at DESC) comes before status because the target query:
--   WHERE user_id = ? AND status IN ('pending', 'pending_approval')
--   ORDER BY updated_at DESC
-- With both status values requested, a btree on (user_id, status, updated_at DESC)
-- cannot return a single globally-sorted stream — Postgres would sort after the
-- bitmap/index scan. Putting updated_at DESC before status lets the index serve
-- the ORDER BY directly for both status values.

CREATE INDEX IF NOT EXISTS brand_intake_drafts_pending_user_updated_idx
ON public.brand_intake_drafts (
  user_id,
  updated_at DESC,
  status
)
WHERE status IN ('pending', 'pending_approval');
