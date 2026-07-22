-- IPI-784 rollback — reverses supabase/migrations/20260722150000_mastra_schema_cutover_preserve_data.sql
--
-- Run this ONLY if the cutover deploy (this migration + PR #604) needs to be
-- reverted. Safe because ALTER TABLE ... SET SCHEMA is the same table object
-- moving back — no data loss, including any rows written to mastra.* after
-- the original cutover ran.
--
-- Sequencing (same lockstep requirement as the forward migration):
--   1. Pause Mastra-writing traffic (schedulers, background tasks, Next.js/
--      Mastra Studio dev pools) — same set the forward migration paused.
--   2. Run this rollback transaction.
--   3. Deploy the app with schemaName back to "public" (or unset) — do NOT
--      run this while the app is still configured for "mastra" and actively
--      writing; that produces a "relation does not exist" window the moment
--      this transaction commits and the tables disappear out from under it.
--   4. Resume traffic, then smoke-test.
--
-- NOT auto-restored: the legacy service_role/anon grants stripped by the
-- forward migration's Step 4. Re-adding overly broad legacy grants on a
-- rollback is deliberately not automated as part of the transaction above —
-- don't silently widen access back via a script no one is reading closely at
-- 2am. But if the app's normal access path after rollback IS service_role
-- (its grants on these 18 tables were revoked by the forward migration and
-- are NOT restored by moving schema back), it will get permission-denied
-- errors on `public.mastra_*` until you deliberately run this, matching what
-- these tables granted before the cutover (live-verified pre-migration):
--
--   DO $$
--   DECLARE t text;
--   BEGIN
--     FOREACH t IN ARRAY ARRAY[
--       'mastra_agent_versions','mastra_agents','mastra_ai_spans','mastra_background_tasks',
--       'mastra_channel_config','mastra_channel_installations','mastra_dataset_versions',
--       'mastra_favorites','mastra_messages','mastra_observational_memory',
--       'mastra_prompt_block_versions','mastra_prompt_blocks','mastra_resources',
--       'mastra_schedule_triggers','mastra_schedules','mastra_scorer_definition_versions',
--       'mastra_threads','mastra_workflow_snapshot'
--     ] LOOP
--       EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
--     END LOOP;
--   END $$;

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

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

COMMIT;

-- Verify after running:
--   select table_schema, table_name from information_schema.tables
--   where table_name like 'mastra_%' order by 1,2;
-- Expect: the 18 tables above back in "public", the 6 excluded tables
-- (mastra_datasets, mastra_dataset_items, mastra_experiments,
-- mastra_experiment_results, mastra_scorer_definitions, mastra_scorers)
-- untouched in their original schemas throughout — they were never moved.
