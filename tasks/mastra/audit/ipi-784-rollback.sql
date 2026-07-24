-- IPI-784 rollback — reverses supabase/migrations/20260722150000_mastra_schema_cutover_preserve_data.sql
--
-- Run this ONLY if the cutover deploy (this migration + PR #604) needs to be
-- reverted. Safe because ALTER TABLE ... SET SCHEMA is the same table object
-- moving back — no data loss, including any rows written to mastra.* after
-- the original cutover ran.
--
-- =============================================================================
-- REQUIRED RUNBOOK (do not skip steps)
-- =============================================================================
--   1. Preconditions
--      - DB backup / PITR restore point confirmed
--      - Exact COUNT(*) captured for all 18 tables (mastra.* before rollback)
--      - No long-running transactions on those tables (check pg_stat_activity)
--   2. Pause Mastra-writing traffic
--      (schedulers, background tasks, Next.js / Mastra Studio / Worker pools)
--   3. Switch application config BACK to public BEFORE this SQL commits
--      - Set MASTRA_SCHEMA=public (or unset) and redeploy / restart writers
--      - Do NOT leave the app on schemaName=mastra while this transaction
--        commits — tables disappear from mastra.* under live writers
--   4. Run the transaction below (SET SCHEMA + minimum ACL restore)
--   5. Verify locations, grants, RLS, and runtime CRUD (see bottom)
--   6. Compare COUNT(*) to the pre-rollback capture
--   7. Resume traffic only after step 5–6 pass
--
-- Abort conditions: lock_timeout / statement_timeout fires; any verify query
-- fails; row counts diverge; runtime CRUD fails for the documented role.
--
-- =============================================================================
-- ACCESS MODEL AFTER ROLLBACK (documented minimum — deliberate)
-- =============================================================================
-- Runtime role that must work on restored public.mastra_* tables:
--   hyperdrive_mastra_runtime
--     - USAGE on schema public (explicit GRANT below)
--     - SELECT, INSERT, UPDATE, DELETE on each of the 18 moved tables
--     - RLS enabled + policy hyperdrive_mastra_runtime_all (FOR ALL)
--
-- Intentionally NOT restored (security decision — do not widen at 2am):
--   - service_role ALL on these 18 tables (stripped by forward Step 4)
--   - anon / authenticated / PUBLIC table grants
-- Rationale: post-cutover ACL is the designed Hyperdrive-only model. Rolling
-- the schema back must keep that narrow model on public.*, not re-open the
-- legacy service_role surface. If a PostgREST/service_role path is required
-- after rollback, grant it in a separate, reviewed change — not here.
--
-- App connections that use the table owner / postgres pooler role continue to
-- work (owner bypasses RLS). Hyperdrive path uses hyperdrive_mastra_runtime.
-- =============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- Step A: Move the 18 cutover tables back to public
-- ---------------------------------------------------------------------------
ALTER TABLE mastra.mastra_agent_versions SET SCHEMA public;
ALTER TABLE mastra.mastra_agents SET SCHEMA public;
ALTER TABLE mastra.mastra_ai_spans SET SCHEMA public;
ALTER TABLE mastra.mastra_background_tasks SET SCHEMA public;
ALTER TABLE mastra.mastra_channel_config SET SCHEMA public;
ALTER TABLE mastra.mastra_channel_installations SET SCHEMA public;
ALTER TABLE mastra.mastra_dataset_versions SET SCHEMA public;
ALTER TABLE mastra.mastra_favorites SET SCHEMA public;
ALTER TABLE mastra.mastra_messages SET SCHEMA public;
ALTER TABLE mastra.mastra_observational_memory SET SCHEMA public;
ALTER TABLE mastra.mastra_prompt_block_versions SET SCHEMA public;
ALTER TABLE mastra.mastra_prompt_blocks SET SCHEMA public;
ALTER TABLE mastra.mastra_resources SET SCHEMA public;
ALTER TABLE mastra.mastra_schedule_triggers SET SCHEMA public;
ALTER TABLE mastra.mastra_schedules SET SCHEMA public;
ALTER TABLE mastra.mastra_scorer_definition_versions SET SCHEMA public;
ALTER TABLE mastra.mastra_threads SET SCHEMA public;
ALTER TABLE mastra.mastra_workflow_snapshot SET SCHEMA public;

-- ---------------------------------------------------------------------------
-- Step B: Restore usable public-schema access for hyperdrive_mastra_runtime
-- (table-level grants/policies ride along with SET SCHEMA, but re-assert so
-- a partial/manual reverse cannot leave the runtime role locked out.)
-- Keep service_role / anon / authenticated / PUBLIC revoked.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO hyperdrive_mastra_runtime;

DO $$
DECLARE
  r record;
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
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = r.tablename
    ) THEN
      RAISE EXCEPTION 'ipi-784 rollback: expected public.% missing after SET SCHEMA', r.tablename;
    END IF;

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM service_role', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', r.tablename);

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO hyperdrive_mastra_runtime',
      r.tablename
    );

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = r.tablename
        AND policyname = 'hyperdrive_mastra_runtime_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY hyperdrive_mastra_runtime_all ON public.%I
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

-- =============================================================================
-- Step C: Verify AFTER commit (run as a privileged role, then as runtime)
-- =============================================================================
-- C1. Locations — expect the 18 tables in public; 6 excluded tables untouched
--     (mastra_datasets, mastra_dataset_items, mastra_experiments,
--      mastra_experiment_results, mastra_scorer_definitions, mastra_scorers)
--
--   SELECT table_schema, table_name
--   FROM information_schema.tables
--   WHERE table_name LIKE 'mastra_%'
--   ORDER BY 1, 2;
--
-- C2. Grants — hyperdrive_mastra_runtime must have DML; service_role must not
--
--   SELECT table_name,
--          has_table_privilege('hyperdrive_mastra_runtime', format('public.%I', table_name), 'SELECT') AS hd_select,
--          has_table_privilege('hyperdrive_mastra_runtime', format('public.%I', table_name), 'INSERT') AS hd_insert,
--          has_table_privilege('hyperdrive_mastra_runtime', format('public.%I', table_name), 'UPDATE') AS hd_update,
--          has_table_privilege('hyperdrive_mastra_runtime', format('public.%I', table_name), 'DELETE') AS hd_delete,
--          has_table_privilege('service_role', format('public.%I', table_name), 'SELECT') AS sr_select
--   FROM (VALUES
--     ('mastra_threads'), ('mastra_messages'), ('mastra_workflow_snapshot')
--   ) AS t(table_name);
--   -- Expect: hd_* = true, sr_select = false
--
-- C3. Runtime CRUD smoke (SET ROLE hyperdrive_mastra_runtime; then RESET ROLE)
--
--   BEGIN;
--   SET LOCAL ROLE hyperdrive_mastra_runtime;
--   INSERT INTO public.mastra_threads (id, "resourceId", title, metadata, "createdAt", "updatedAt")
--   VALUES ('ipi-784-rollback-probe', 'rollback', 'probe', '{}'::jsonb, now(), now());
--   UPDATE public.mastra_threads SET title = 'probe-updated' WHERE id = 'ipi-784-rollback-probe';
--   SELECT id FROM public.mastra_threads WHERE id = 'ipi-784-rollback-probe';
--   DELETE FROM public.mastra_threads WHERE id = 'ipi-784-rollback-probe';
--   RESET ROLE;
--   COMMIT;
--
-- C4. Row counts — compare to pre-rollback capture for all 18 tables
--
--   SELECT relname, n_live_tup
--   FROM pg_stat_user_tables
--   WHERE schemaname = 'public' AND relname LIKE 'mastra_%'
--   ORDER BY 1;
