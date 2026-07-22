-- IPI-784 · MASTRA-PG-008 — Preserve existing Mastra data during public → mastra
-- schema cutover.
--
-- PR #601 (IPI-628) created 24 empty tables in the private "mastra" schema via
-- CREATE TABLE IF NOT EXISTS — a structural copy, not a data move. Live-verified
-- 2026-07-22: all 24 mastra.* tables have 0 rows, while their public.mastra_*
-- counterparts hold real accumulated data (workflow runs, chat threads/messages,
-- schedules). PR #604 (IPI-630) flips the app to schemaName:"mastra" but its own
-- description says it does NOT delete/move public.mastra_* — nothing else in the
-- chain does either. This migration is that missing step.
--
-- Mechanism: ALTER TABLE ... SET SCHEMA — the standard, official Postgres way to
-- move a table between schemas since Postgres 8.1 (postgresql.org/docs/current/
-- sql-alterschema.html). Catalog-only: no data copy regardless of row count, and
-- it carries existing rows/indexes/constraints/RLS policies with it automatically
-- since it's the same table object (same OID), just reassigned to a different
-- schema. NOT zero-downtime, though: per Postgres's own docs, an ACCESS EXCLUSIVE
-- lock is taken unless a subcommand explicitly documents a weaker one, and SET
-- SCHEMA has no such exception. lock_timeout below turns "blocks briefly" into
-- "fails loudly and safely" if anything is unexpectedly holding a lock.
--
-- *** CRITICAL: only 18 of the 24 original mastra-schema tables are moved here ***
-- Live column-diff (information_schema.columns, both schemas) found 6 tables
-- where the mastra-schema copy already has organizationId/projectId/candidateId/
-- candidateKey/toolMocks/toolMockReport/batchId/datasetId/datasetItemId/externalId
-- columns that public.mastra_* does NOT have at all: mastra_datasets,
-- mastra_dataset_items, mastra_experiments, mastra_experiment_results,
-- mastra_scorer_definitions, mastra_scorers. Moving public's simpler version over
-- these would silently DROP those columns. All 6 are confirmed 0 rows in public
-- (live-verified) — there is no data to lose by leaving them alone, so this
-- migration does not touch them at all; PR #601's richer, already-correct empty
-- copies stay exactly as they are. (mastra_ai_spans has the same organizationId
-- column on BOTH sides already — no divergence there, it IS moved below.)
--
-- *** CRITICAL TIMING CONSTRAINT ***
-- Apply this migration in the SAME deploy window as PR #604 (IPI-630)'s code
-- change — not standalone, not days earlier. Between this migration applying and
-- PR #604's code going live, the running app (still pointed at "public" schema
-- in that gap) would be writing to a schema whose tables just disappeared out
-- from under it. Coordinate the migration apply and the app deploy as one
-- release: pause Mastra-writing traffic (schedulers, background tasks, Next.js/
-- Mastra Studio dev pools) for the duration, run this migration, flip the app's
-- schemaName, resume traffic, then smoke-test.
--
-- Rollback: ALTER TABLE mastra.<x> SET SCHEMA public for the 18 tables moved
-- below reverses this cleanly (same table object, no data loss) — see
-- tasks/mastra/audit/ipi-784-rollback.sql for the ready-to-run reverse script.
--
-- Excludes the 9 tables IPI-628 already excluded from the mastra schema
-- (mastra_mcp_clients/_versions, mastra_mcp_servers/_versions, mastra_skills/
-- _blobs/_versions, mastra_workspaces/_versions) — those stay in public,
-- unused by iPix's production agents, per IPI-628's original rationale.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ============================================================================
-- Step 1: Pre-flight assertion — abort if any mastra.* table unexpectedly has
-- rows. If something started writing to the empty mastra-schema tables between
-- PR #601 applying and this migration running, that data must NOT be silently
-- dropped by step 2 below.
-- ============================================================================
DO $$
DECLARE
  r record;
  unexpected_count bigint;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY[
      'mastra_agent_versions','mastra_agents','mastra_ai_spans','mastra_background_tasks',
      'mastra_channel_config','mastra_channel_installations','mastra_dataset_versions',
      'mastra_favorites','mastra_messages','mastra_observational_memory',
      'mastra_prompt_block_versions','mastra_prompt_blocks','mastra_resources',
      'mastra_schedule_triggers','mastra_schedules','mastra_scorer_definition_versions',
      'mastra_threads','mastra_workflow_snapshot'
    ]) AS tablename
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'mastra' AND tablename = r.tablename
    ) THEN
      EXECUTE format('SELECT count(*) FROM mastra.%I', r.tablename) INTO unexpected_count;
      IF unexpected_count > 0 THEN
        RAISE EXCEPTION
          'IPI-784 pre-flight failed: mastra.% has % row(s), expected 0. '
          'Aborting — refusing to DROP a table that already has data. '
          'Investigate before re-running this migration.',
          r.tablename, unexpected_count;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 2: Drop the empty mastra-schema placeholder tables created by IPI-628,
-- for the 18 tables whose structure matches public exactly. RESTRICT (not
-- CASCADE) — fail loudly if anything unexpected depends on these tables rather
-- than silently deleting it too. Nothing legitimately should depend on them yet.
-- ============================================================================
DROP TABLE IF EXISTS mastra.mastra_agent_versions RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_agents RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_ai_spans RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_background_tasks RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_channel_config RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_channel_installations RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_dataset_versions RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_favorites RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_messages RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_observational_memory RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_prompt_block_versions RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_prompt_blocks RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_resources RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_schedule_triggers RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_schedules RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_scorer_definition_versions RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_threads RESTRICT;
DROP TABLE IF EXISTS mastra.mastra_workflow_snapshot RESTRICT;

-- NOT dropped/moved (structural mismatch — see header): mastra_datasets,
-- mastra_dataset_items, mastra_experiments, mastra_experiment_results,
-- mastra_scorer_definitions, mastra_scorers. PR #601's empty copies for these
-- 6 stay exactly as they are.

-- ============================================================================
-- Step 3: Move the real, data-bearing public tables into the mastra schema.
-- Catalog-only update — no data copy. Carries rows, indexes, constraints, and
-- existing RLS policies with it (same table object, same OID). Legacy grants
-- (including service_role, confirmed live to have full DML on these tables in
-- public today) also carry over — Step 4 strips those explicitly.
-- ============================================================================
ALTER TABLE public.mastra_agent_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_agents SET SCHEMA mastra;
ALTER TABLE public.mastra_ai_spans SET SCHEMA mastra;
ALTER TABLE public.mastra_background_tasks SET SCHEMA mastra;
ALTER TABLE public.mastra_channel_config SET SCHEMA mastra;
ALTER TABLE public.mastra_channel_installations SET SCHEMA mastra;
ALTER TABLE public.mastra_dataset_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_favorites SET SCHEMA mastra;
ALTER TABLE public.mastra_messages SET SCHEMA mastra;
ALTER TABLE public.mastra_observational_memory SET SCHEMA mastra;
ALTER TABLE public.mastra_prompt_block_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_prompt_blocks SET SCHEMA mastra;
ALTER TABLE public.mastra_resources SET SCHEMA mastra;
ALTER TABLE public.mastra_schedule_triggers SET SCHEMA mastra;
ALTER TABLE public.mastra_schedules SET SCHEMA mastra;
ALTER TABLE public.mastra_scorer_definition_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_threads SET SCHEMA mastra;
ALTER TABLE public.mastra_workflow_snapshot SET SCHEMA mastra;

-- ============================================================================
-- Step 4: Re-apply PR #602 (IPI-629)'s grant/RLS/policy treatment to the moved
-- tables, PLUS explicitly strip the legacy public-schema grants (service_role,
-- PUBLIC) that rode along with the move. This loop's anon/authenticated/grant/
-- RLS/policy logic is copied verbatim from supabase/migrations/20260722094055_
-- mastra_runtime_grants_and_rls.sql — schema-driven via pg_tables, so it
-- re-applies identically to the tables just moved in.
--
-- The moved tables already have RLS enabled (carried over from public.mastra_*
-- per IPI-227's earlier hardening) — ENABLE ROW LEVEL SECURITY is a safe no-op.
-- CREATE POLICY is a clean create: the original public tables never had a
-- hyperdrive_mastra_runtime-scoped policy, so there's no naming collision.
-- ============================================================================
GRANT USAGE ON SCHEMA mastra TO hyperdrive_mastra_runtime;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'mastra'
      AND tablename LIKE 'mastra\_%'
    ORDER BY tablename
  LOOP
    -- Strip every non-owner grant this table may carry (legacy public grants,
    -- including service_role — confirmed live on the moved tables today — and
    -- PUBLIC), then re-grant only what the mastra schema's design intends.
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM anon', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM authenticated', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM service_role', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM PUBLIC', r.tablename);

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mastra.%I TO hyperdrive_mastra_runtime',
      r.tablename
    );

    EXECUTE format('ALTER TABLE mastra.%I ENABLE ROW LEVEL SECURITY', r.tablename);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'mastra' AND tablename = r.tablename
        AND policyname = 'hyperdrive_mastra_runtime_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY hyperdrive_mastra_runtime_all ON mastra.%I
           FOR ALL
           TO hyperdrive_mastra_runtime
           USING (true)
           WITH CHECK (true)',
        r.tablename
      );
    END IF;
  END LOOP;
END $$;

COMMIT;
