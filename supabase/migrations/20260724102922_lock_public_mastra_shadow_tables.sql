-- IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables
-- Phase A (lockdown, not drop): fail-closed PostgREST exposure on shadow tables.
--
-- Context: after mastra.* cutover (IPI-792) + platform tables (IPI-796), production
-- writes only to the private mastra schema. Recreated public.mastra_* shadows still
-- carried full grants to anon / authenticated / service_role; many also had RLS off
-- (Dashboard "UNRESTRICTED"). IPI-227's earlier hardening did not stick for tables
-- recreated later by Mastra auto-init.
--
-- This migration:
--   * REVOKE ALL from PUBLIC, anon, authenticated, service_role
--   * ENABLE ROW LEVEL SECURITY
--   * creates NO policies (default-deny for non-bypass roles)
--   * drops any policies that drifted onto shadows (fail-closed)
--   * does NOT DROP tables or mutate rows
--   * Recovery (if intentional policies existed): restore grants + disable RLS
--     + recreate only those policies that were intentional drift (unexpected
--     policies on shadows are not part of the intended fail-closed state)
--   * does NOT touch mastra.* or unrelated public tables
--
-- Catalog fail-closed (no unexpected public.mastra_* beyond the 33-name
-- allowlist) is enforced in postflight below for fresh replays, and on the
-- live project by forward migration 20260724173755 (this file already applied).
--
-- Recurring drift check (Mastra auto-init can recreate grants after this one-shot):
--   * supabase/tests/database/004_public_mastra_shadow_lockdown.sql re-asserts
--     existence + RLS + zero policies + deny-role/PUBLIC ACLs + owner + allow-path
--     count(*) for all 33 tables on every trusted CI run of
--     .github/workflows/supabase-verify-rls.yml (`supabase test db …/database`).
--   * Local: same suite via `supabase test db --db-url "$DATABASE_URL" supabase/tests/database`
--     (also covered when running the verify-rls workflow path).
--   * Phase B (DROP) must not proceed while 004 fails — that is the live-project
--     grant/RLS regression gate until shadows are removed.
--
-- Phase B (DROP + supabase gen types) stays blocked until soak + backup/PITR.

DO $$
DECLARE
  -- Explicit inventory from live project nvdlhrodvevgwdsneplk (2026-07-24) — 33 tables.
  -- Fail if any listed table is missing; do not LIKE-loop (avoids unrelated public tables).
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
  t text;
  pol record;
  deny_roles text[] := ARRAY['anon', 'authenticated', 'service_role'];
  r text;
  priv text;
  -- Postflight vocabulary expanded in forward migration 20260724103700
  -- (MAINTAIN + WITH GRANT OPTION + aclexplode deny-role ACL). Do not amend
  -- this already-applied migration's live effect; keep the original check set.
  check_privs text[] := ARRAY[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
  ];
  bad text;
  public_priv text;
  policy_count bigint;
  rowsecurity boolean;
BEGIN
  IF array_length(expected, 1) IS DISTINCT FROM 33 THEN
    RAISE EXCEPTION
      'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: expected array must list exactly 33 tables (got %)',
      coalesce(array_length(expected, 1), 0);
  END IF;

  FOREACH t IN ARRAY expected LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE EXCEPTION
        'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: missing public.% (refusing partial lock)',
        t;
    END IF;

    -- Preserve rows: metadata/grants only.
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    FOREACH r IN ARRAY deny_roles LOOP
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', t, r);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- No browser-facing policies — drop any that drifted onto shadows.
    FOR pol IN
      SELECT p.policyname AS policyname
      FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = t
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        pol.policyname,
        t
      );
    END LOOP;
  END LOOP;

  -- Fail-closed postflight: RLS on, zero policies, zero effective access for deny roles + PUBLIC.
  FOREACH t IN ARRAY expected LOOP
    SELECT c.relrowsecurity
    INTO rowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = t;

    IF NOT coalesce(rowsecurity, false) THEN
      RAISE EXCEPTION
        'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: RLS not enabled on public.%',
        t;
    END IF;

    SELECT count(*)
    INTO policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t;

    IF policy_count <> 0 THEN
      RAISE EXCEPTION
        'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: public.% still has % policies',
        t, policy_count;
    END IF;

    bad := NULL;
    FOREACH r IN ARRAY deny_roles LOOP
      FOREACH priv IN ARRAY check_privs LOOP
        IF has_table_privilege(r, format('public.%I', t), priv) THEN
          bad := coalesce(bad || ', ', '') || r || ':' || priv;
        END IF;
      END LOOP;
    END LOOP;

    IF bad IS NOT NULL THEN
      RAISE EXCEPTION
        'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: unexpected grants on public.%: %',
        t, bad;
    END IF;

    -- Match IPI-796 privilege assert: only explode stored relacl (NULL = owner-only).
    SELECT string_agg(acl.privilege_type, ', ' ORDER BY acl.privilege_type)
    INTO public_priv
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
    WHERE n.nspname = 'public'
      AND c.relname = t
      AND c.relacl IS NOT NULL
      AND acl.grantee = 0;

    IF public_priv IS NOT NULL THEN
      RAISE EXCEPTION
        'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: PUBLIC privileges on public.%: %',
        t, public_priv;
    END IF;
  END LOOP;

  -- Fail closed if catalog has any public.mastra_% table/view outside allowlist
  -- (Mastra auto-init can recreate new shadows; fixed inventory alone misses them).
  -- Live project already applied this migration: see 20260724173755 for the same gate.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO bad
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    AND c.relname LIKE 'mastra\_%' ESCAPE '\'
    AND NOT (c.relname = ANY (expected));

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'IPI-801 · MASTRA-PG-011 — Retire Recreated public.mastra_* Shadow Tables: unexpected public.mastra_* relation(s) not in allowlist: %',
      bad;
  END IF;
END $$;
