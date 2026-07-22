-- IPI-628 fix — external review, 2026-07-22.
--
-- 20260722093028_mastra_schema_pinned_1_12_0.sql's guard for
-- mastra.mastra_workflow_snapshot's UNIQUE(workflow_name, run_id) skipped
-- adding the constraint if EITHER a same-named pg_constraint row OR a
-- same-named index already existed. Live-verified: production has the index
-- (mastra_mastra_workflow_snapshot_workflow_name_run_id_key, a real UNIQUE
-- INDEX) but no matching row in pg_constraint — a prior partial apply left
-- the index behind, and the later successful run's guard silently skipped
-- adding the formal constraint on top of it.
--
-- Functionally this has NOT broken anything: a bare UNIQUE INDEX still
-- blocks duplicate (workflow_name, run_id) rows and still works as an
-- INSERT ... ON CONFLICT (workflow_name, run_id) target — verified directly
-- against a disposable Postgres container. But it's fragile and leaves the
-- schema not matching what the (now-fixed) source migration would produce
-- on a fresh apply. Promoting the existing index into a real named
-- constraint is a catalog-only operation — reuses the index as-is, no
-- table rewrite, no row scan, safe on the live 5,735-row table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mastra_mastra_workflow_snapshot_workflow_name_run_id_key'
      AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'mastra')
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'mastra'
      AND indexname = 'mastra_mastra_workflow_snapshot_workflow_name_run_id_key'
  ) THEN
    ALTER TABLE "mastra"."mastra_workflow_snapshot"
      ADD CONSTRAINT mastra_mastra_workflow_snapshot_workflow_name_run_id_key
      UNIQUE USING INDEX mastra_mastra_workflow_snapshot_workflow_name_run_id_key;
  END IF;
END $$;
