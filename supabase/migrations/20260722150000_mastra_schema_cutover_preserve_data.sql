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
-- sql-alterschema.html). Catalog-only: instant regardless of row count, no data
-- copy, and it carries existing rows/indexes/constraints/RLS policies with it
-- automatically since it's the same table object (same OID), just reassigned to
-- a different schema. Verified live: zero FK dependencies among these 24 tables
-- and zero nextval()-backed sequences (all Mastra IDs are TEXT) — no dependency
-- ordering concerns for either the drop or the move.
--
-- *** CRITICAL TIMING CONSTRAINT ***
-- Apply this migration in the SAME deploy window as PR #604 (IPI-630)'s code
-- change — not standalone, not days earlier. Between this migration applying and
-- PR #604's code going live, the running app (still pointed at "public" schema
-- in that gap) would be writing to a schema whose tables just disappeared out
-- from under it. Coordinate the migration apply and the app deploy as one
-- release, not two independent steps.
--
-- Excludes the 9 tables IPI-628 already excluded from the mastra schema
-- (mastra_mcp_clients/_versions, mastra_mcp_servers/_versions, mastra_skills/
-- _blobs/_versions, mastra_workspaces/_versions) — those stay in public,
-- unused by iPix's production agents, per IPI-628's original rationale.

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
      'mastra_channel_config','mastra_channel_installations','mastra_dataset_items',
      'mastra_dataset_versions','mastra_datasets','mastra_experiment_results','mastra_experiments',
      'mastra_favorites','mastra_messages','mastra_observational_memory',
      'mastra_prompt_block_versions','mastra_prompt_blocks','mastra_resources',
      'mastra_schedule_triggers','mastra_schedules','mastra_scorer_definition_versions',
      'mastra_scorer_definitions','mastra_scorers','mastra_threads','mastra_workflow_snapshot'
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
-- Step 2: Drop the empty mastra-schema placeholder tables created by IPI-628.
-- Safe per the pre-flight check above — every one of these has 0 rows.
-- ============================================================================
DROP TABLE IF EXISTS mastra.mastra_agent_versions CASCADE;
DROP TABLE IF EXISTS mastra.mastra_agents CASCADE;
DROP TABLE IF EXISTS mastra.mastra_ai_spans CASCADE;
DROP TABLE IF EXISTS mastra.mastra_background_tasks CASCADE;
DROP TABLE IF EXISTS mastra.mastra_channel_config CASCADE;
DROP TABLE IF EXISTS mastra.mastra_channel_installations CASCADE;
DROP TABLE IF EXISTS mastra.mastra_dataset_items CASCADE;
DROP TABLE IF EXISTS mastra.mastra_dataset_versions CASCADE;
DROP TABLE IF EXISTS mastra.mastra_datasets CASCADE;
DROP TABLE IF EXISTS mastra.mastra_experiment_results CASCADE;
DROP TABLE IF EXISTS mastra.mastra_experiments CASCADE;
DROP TABLE IF EXISTS mastra.mastra_favorites CASCADE;
DROP TABLE IF EXISTS mastra.mastra_messages CASCADE;
DROP TABLE IF EXISTS mastra.mastra_observational_memory CASCADE;
DROP TABLE IF EXISTS mastra.mastra_prompt_block_versions CASCADE;
DROP TABLE IF EXISTS mastra.mastra_prompt_blocks CASCADE;
DROP TABLE IF EXISTS mastra.mastra_resources CASCADE;
DROP TABLE IF EXISTS mastra.mastra_schedule_triggers CASCADE;
DROP TABLE IF EXISTS mastra.mastra_schedules CASCADE;
DROP TABLE IF EXISTS mastra.mastra_scorer_definition_versions CASCADE;
DROP TABLE IF EXISTS mastra.mastra_scorer_definitions CASCADE;
DROP TABLE IF EXISTS mastra.mastra_scorers CASCADE;
DROP TABLE IF EXISTS mastra.mastra_threads CASCADE;
DROP TABLE IF EXISTS mastra.mastra_workflow_snapshot CASCADE;

-- ============================================================================
-- Step 3: Move the real, data-bearing public tables into the mastra schema.
-- Instant catalog update — no data copy. Carries rows, indexes, constraints,
-- and existing RLS policies with it (same table object, same OID).
-- ============================================================================
ALTER TABLE public.mastra_agent_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_agents SET SCHEMA mastra;
ALTER TABLE public.mastra_ai_spans SET SCHEMA mastra;
ALTER TABLE public.mastra_background_tasks SET SCHEMA mastra;
ALTER TABLE public.mastra_channel_config SET SCHEMA mastra;
ALTER TABLE public.mastra_channel_installations SET SCHEMA mastra;
ALTER TABLE public.mastra_dataset_items SET SCHEMA mastra;
ALTER TABLE public.mastra_dataset_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_datasets SET SCHEMA mastra;
ALTER TABLE public.mastra_experiment_results SET SCHEMA mastra;
ALTER TABLE public.mastra_experiments SET SCHEMA mastra;
ALTER TABLE public.mastra_favorites SET SCHEMA mastra;
ALTER TABLE public.mastra_messages SET SCHEMA mastra;
ALTER TABLE public.mastra_observational_memory SET SCHEMA mastra;
ALTER TABLE public.mastra_prompt_block_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_prompt_blocks SET SCHEMA mastra;
ALTER TABLE public.mastra_resources SET SCHEMA mastra;
ALTER TABLE public.mastra_schedule_triggers SET SCHEMA mastra;
ALTER TABLE public.mastra_schedules SET SCHEMA mastra;
ALTER TABLE public.mastra_scorer_definition_versions SET SCHEMA mastra;
ALTER TABLE public.mastra_scorer_definitions SET SCHEMA mastra;
ALTER TABLE public.mastra_scorers SET SCHEMA mastra;
ALTER TABLE public.mastra_threads SET SCHEMA mastra;
ALTER TABLE public.mastra_workflow_snapshot SET SCHEMA mastra;

-- ============================================================================
-- Step 4: Re-apply PR #602 (IPI-629)'s grant/RLS/policy treatment to the moved
-- tables. This loop is copied verbatim from
-- supabase/migrations/20260722094055_mastra_runtime_grants_and_rls.sql — it
-- discovers tables dynamically via pg_tables rather than a hardcoded list, so
-- re-running it here re-applies identically to the tables we just moved in
-- (which now satisfy the same schemaname='mastra' + 'mastra_%' pattern).
--
-- The moved tables already have RLS enabled (it carried over from public.
-- mastra_* per IPI-227's earlier hardening) — ENABLE ROW LEVEL SECURITY is a
-- safe no-op if already on. CREATE POLICY is a clean create: the original
-- public tables never had a hyperdrive_mastra_runtime-scoped policy (that
-- role/policy pairing was introduced by PR #602 only for the mastra-schema
-- copies), so there's no naming collision.
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
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM anon', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM authenticated', r.tablename);

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
