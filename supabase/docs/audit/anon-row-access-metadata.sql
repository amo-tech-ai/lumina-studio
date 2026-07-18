-- IPI-681 · SB-SEC-003 — Privileged metadata inventory for anon row-access proof
-- Run via Supabase MCP execute_sql (project nvdlhrodvevgwdsneplk) or:
--   infisical run --env=dev -- psql "$DATABASE_URL" -f supabase/docs/audit/anon-row-access-metadata.sql
--
-- Never returns row contents — only grants, RLS flags, policy names, and EXISTS boolean.

WITH targets (schema_name, table_name) AS (
  VALUES
    ('public', 'brands'),
    ('public', 'brand_scores'),
    ('public', 'brand_intake_drafts'),
    ('public', 'assets'),
    ('public', 'org_members'),
    ('public', 'organizations'),
    ('public', 'shoots'),
    ('public', 'profiles'),
    ('public', 'commerce_product_links'),
    ('public', 'ai_agent_logs'),
    ('public', 'crm_deals'),
    ('public', 'crm_contacts'),
    ('planner', 'instances'),
    ('public', 'chatbot_conversations'),
    ('public', 'lead_intake_drafts')
),
base AS (
  SELECT
    t.schema_name,
    t.table_name,
    (to_regclass(format('%I.%I', t.schema_name, t.table_name)) IS NOT NULL) AS table_exists,
    c.oid AS relid,
    COALESCE(c.relrowsecurity, false) AS rls_enabled,
    COALESCE(c.relforcerowsecurity, false) AS rls_forced
  FROM targets t
  LEFT JOIN pg_class c
    ON c.oid = to_regclass(format('%I.%I', t.schema_name, t.table_name))
),
anon_policies AS (
  SELECT
    schemaname AS schema_name,
    tablename AS table_name,
    COALESCE(
      array_agg(policyname ORDER BY policyname)
        FILTER (WHERE roles && ARRAY['anon', 'public']::name[]),
      ARRAY[]::name[]
    ) AS anon_policy_names,
    COALESCE(
      bool_or(roles && ARRAY['anon', 'public']::name[] AND cmd IN ('SELECT', 'ALL')),
      false
    ) AS has_anon_select_policy
  FROM pg_policies
  GROUP BY schemaname, tablename
),
row_flags AS (
  SELECT 'public'::text AS schema_name, 'brands'::text AS table_name,
    EXISTS (SELECT 1 FROM public.brands) AS table_contains_rows
  UNION ALL SELECT 'public', 'brand_scores',
    EXISTS (SELECT 1 FROM public.brand_scores)
  UNION ALL SELECT 'public', 'brand_intake_drafts',
    EXISTS (SELECT 1 FROM public.brand_intake_drafts)
  UNION ALL SELECT 'public', 'assets',
    EXISTS (SELECT 1 FROM public.assets)
  UNION ALL SELECT 'public', 'org_members',
    EXISTS (SELECT 1 FROM public.org_members)
  UNION ALL SELECT 'public', 'organizations',
    EXISTS (SELECT 1 FROM public.organizations)
  UNION ALL SELECT 'public', 'shoots',
    EXISTS (SELECT 1 FROM public.shoots)
  UNION ALL SELECT 'public', 'profiles',
    EXISTS (SELECT 1 FROM public.profiles)
  UNION ALL SELECT 'public', 'commerce_product_links',
    EXISTS (SELECT 1 FROM public.commerce_product_links)
  UNION ALL SELECT 'public', 'ai_agent_logs',
    EXISTS (SELECT 1 FROM public.ai_agent_logs)
  UNION ALL SELECT 'public', 'crm_deals',
    EXISTS (SELECT 1 FROM public.crm_deals)
  UNION ALL SELECT 'public', 'crm_contacts',
    EXISTS (SELECT 1 FROM public.crm_contacts)
  UNION ALL SELECT 'planner', 'instances',
    EXISTS (SELECT 1 FROM planner.instances)
  UNION ALL SELECT 'public', 'chatbot_conversations',
    EXISTS (SELECT 1 FROM public.chatbot_conversations)
  UNION ALL SELECT 'public', 'lead_intake_drafts',
    EXISTS (SELECT 1 FROM public.lead_intake_drafts)
)
SELECT
  b.schema_name,
  b.table_name,
  b.table_exists,
  CASE
    WHEN NOT b.table_exists THEN NULL
    ELSE has_table_privilege('anon', format('%I.%I', b.schema_name, b.table_name), 'SELECT')
  END AS anon_has_select_grant,
  b.rls_enabled,
  b.rls_forced,
  COALESCE(p.has_anon_select_policy, false) AS has_anon_select_policy,
  COALESCE(p.anon_policy_names, ARRAY[]::name[]) AS anon_policy_names,
  rf.table_contains_rows
FROM base b
LEFT JOIN anon_policies p
  ON p.schema_name = b.schema_name AND p.table_name = b.table_name
LEFT JOIN row_flags rf
  ON rf.schema_name = b.schema_name AND rf.table_name = b.table_name
ORDER BY b.schema_name, b.table_name;
