-- IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables
-- Phase B — DROP the 33 verified public.mastra_* shadow tables (forward-only).
--
-- ⛔ GATES — do NOT push this migration to the remote until ALL are green:
--   1. IPI-1011 soak: public.mastra_threads=16 / public.mastra_messages=35 /
--      public.mastra_workflow_snapshot=8 still flat on Day 1 (2026-08-17) and
--      Day 3 (2026-08-19) — zero new writes into public.* since the fail-closed
--      change shipped (PR #949). If any count moved, stop and investigate.
--   2. Backup/PITR: Supabase PITR enabled on nvdlhrodvevgwdsneplk, or written
--      team sign-off accepting daily-WAL-G-only rollback risk (currently
--      pitr_enabled=false, walg_enabled=true).
--
-- Behavior: fail-closed. Refuses to run unless the public.mastra_% catalog
-- matches the verified 33-name allowlist exactly (same list as
-- 20260724173755), every allowlisted name is a plain base table, and the
-- private mastra.* schema (threads/messages/workflow_snapshot) exists.
-- Drops ONLY the 33 allowlisted names — no LIKE loop, no CASCADE (a dependent
-- object aborts the migration instead of silently cascading). The private
-- mastra.* schema and all Mastra packages are untouched.
--
-- Rollback: if anything breaks, restore from Supabase backup/PITR (the gate
-- above) — the 16/35/8 shadow rows are the only data destroyed.
--
-- Post-apply steps (separate, human-run, AFTER this migration is pushed):
--   1. npm run supabase:types   (regenerate app/src/types/supabase.ts)
--   2. npm run supabase:verify-rls (pgTAP 004 is inverted to anti-recreation)

DO $$
DECLARE
  expected text[] := ARRAY[
    'mastra_agent_versions',
    'mastra_agents',
    'mastra_ai_spans',
    'mastra_background_tasks',
    'mastra_channel_config',
    'mastra_channel_installations',
    'mastra_dataset_items',
    'mastra_dataset_versions',
    'mastra_datasets',
    'mastra_experiment_results',
    'mastra_experiments',
    'mastra_favorites',
    'mastra_mcp_client_versions',
    'mastra_mcp_clients',
    'mastra_mcp_server_versions',
    'mastra_mcp_servers',
    'mastra_messages',
    'mastra_observational_memory',
    'mastra_prompt_block_versions',
    'mastra_prompt_blocks',
    'mastra_resources',
    'mastra_schedule_triggers',
    'mastra_schedules',
    'mastra_scorer_definition_versions',
    'mastra_scorer_definitions',
    'mastra_scorers',
    'mastra_skill_blobs',
    'mastra_skill_versions',
    'mastra_skills',
    'mastra_threads',
    'mastra_workflow_snapshot',
    'mastra_workspace_versions',
    'mastra_workspaces'
  ];
  extras text;
  non_plain text;
  catalog_count bigint;
BEGIN
  IF array_length(expected, 1) IS DISTINCT FROM 33 THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B: expected array must list exactly 33 tables (got %)',
      coalesce(array_length(expected, 1), 0);
  END IF;

  -- Sanity: the private mastra.* schema must exist before we drop public twins.
  IF to_regclass('mastra.mastra_threads') IS NULL
     OR to_regclass('mastra.mastra_messages') IS NULL
     OR to_regclass('mastra.mastra_workflow_snapshot') IS NULL THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B: private mastra.mastra_threads/messages/workflow_snapshot missing — aborting';
  END IF;

  SELECT count(*)
  INTO catalog_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    AND c.relname LIKE 'mastra\_%' ESCAPE '\';

  IF catalog_count IS DISTINCT FROM 33 THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B: expected exactly 33 public.mastra_* relations (got %) — refuse partial drop',
      catalog_count;
  END IF;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO extras
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    AND c.relname LIKE 'mastra\_%' ESCAPE '\'
    AND NOT (c.relname = ANY (expected));

  IF extras IS NOT NULL THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B: unexpected public.mastra_* relation(s) not in allowlist: %',
      extras;
  END IF;

  -- Every allowlisted name must be a plain base table; a view/partition/foreign
  -- table would be schema drift and DROP TABLE cannot touch views anyway.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO non_plain
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (expected)
    AND c.relkind IS DISTINCT FROM 'r';

  IF non_plain IS NOT NULL THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B: allowlisted names are not plain base tables: %',
      non_plain;
  END IF;
END $$;

-- Exact, allowlisted DROP — no LIKE loop, no CASCADE. Fail-closed preflight above.
DROP TABLE IF EXISTS public.mastra_agent_versions;
DROP TABLE IF EXISTS public.mastra_agents;
DROP TABLE IF EXISTS public.mastra_ai_spans;
DROP TABLE IF EXISTS public.mastra_background_tasks;
DROP TABLE IF EXISTS public.mastra_channel_config;
DROP TABLE IF EXISTS public.mastra_channel_installations;
DROP TABLE IF EXISTS public.mastra_dataset_items;
DROP TABLE IF EXISTS public.mastra_dataset_versions;
DROP TABLE IF EXISTS public.mastra_datasets;
DROP TABLE IF EXISTS public.mastra_experiment_results;
DROP TABLE IF EXISTS public.mastra_experiments;
DROP TABLE IF EXISTS public.mastra_favorites;
DROP TABLE IF EXISTS public.mastra_mcp_client_versions;
DROP TABLE IF EXISTS public.mastra_mcp_clients;
DROP TABLE IF EXISTS public.mastra_mcp_server_versions;
DROP TABLE IF EXISTS public.mastra_mcp_servers;
DROP TABLE IF EXISTS public.mastra_messages;
DROP TABLE IF EXISTS public.mastra_observational_memory;
DROP TABLE IF EXISTS public.mastra_prompt_block_versions;
DROP TABLE IF EXISTS public.mastra_prompt_blocks;
DROP TABLE IF EXISTS public.mastra_resources;
DROP TABLE IF EXISTS public.mastra_schedule_triggers;
DROP TABLE IF EXISTS public.mastra_schedules;
DROP TABLE IF EXISTS public.mastra_scorer_definition_versions;
DROP TABLE IF EXISTS public.mastra_scorer_definitions;
DROP TABLE IF EXISTS public.mastra_scorers;
DROP TABLE IF EXISTS public.mastra_skill_blobs;
DROP TABLE IF EXISTS public.mastra_skill_versions;
DROP TABLE IF EXISTS public.mastra_skills;
DROP TABLE IF EXISTS public.mastra_threads;
DROP TABLE IF EXISTS public.mastra_workflow_snapshot;
DROP TABLE IF EXISTS public.mastra_workspace_versions;
DROP TABLE IF EXISTS public.mastra_workspaces;

-- Postflight: zero public.mastra_% relations remain; private mastra.* intact.
DO $$
DECLARE
  remaining bigint;
BEGIN
  SELECT count(*)
  INTO remaining
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    AND c.relname LIKE 'mastra\_%' ESCAPE '\';

  IF remaining <> 0 THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B postflight: % public.mastra_* relations remain',
      remaining;
  END IF;

  IF to_regclass('mastra.mastra_threads') IS NULL
     OR to_regclass('mastra.mastra_messages') IS NULL
     OR to_regclass('mastra.mastra_workflow_snapshot') IS NULL THEN
    RAISE EXCEPTION
      'IPI-801 · Phase B postflight: private mastra.* tables missing after drop';
  END IF;
END $$;
