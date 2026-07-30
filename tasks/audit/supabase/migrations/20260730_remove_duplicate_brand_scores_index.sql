-- Migration: Remove duplicate index on brand_scores
-- IPI-858 (SB-CLEAN-001) — Remove Orphaned Indexes and Constraints
--
-- The database advisor found a duplicate index on public.brand_scores:
-- - brand_scores_brand_id_score_type_key (duplicate, to be dropped)
-- - brand_scores_brand_id_score_type_uidx (keep)
--
-- Both indexes are identical - dropping one has zero risk and immediate benefit.
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

-- Drop the duplicate index concurrently to avoid blocking
DROP INDEX CONCURRENTLY IF EXISTS public.brand_scores_brand_id_score_type_key;
