-- IPI-784 rollback — reverses supabase/migrations/20260722150000_mastra_schema_cutover_preserve_data.sql
--
-- Run this ONLY if the cutover deploy (this migration + PR #604) needs to be
-- reverted. Safe because ALTER TABLE ... SET SCHEMA is the same table object
-- moving back — no data loss, including any rows written to mastra.* after
-- the original cutover ran.
--
-- Sequencing: revert the app's schemaName back to "public" (or unset it) in
-- the SAME window as running this, for the same reason the forward migration
-- required lockstep timing — do not run this while the app is still pointed
-- at "mastra".
--
-- NOT included: restoring the legacy service_role/anon grants stripped by the
-- forward migration's Step 4. Re-adding overly broad legacy grants on a
-- rollback is deliberately not automated — if a rollback is needed for a
-- reason unrelated to security posture, re-grant explicitly and deliberately,
-- don't silently widen access back via a rollback script no one is reading
-- closely at 2am.

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
