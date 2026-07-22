-- IPI-629 · MASTRA-SUPABASE-003 — Mastra runtime grants and RLS security.
--
-- Grants minimal DML + enables RLS with a role-scoped policy for
-- hyperdrive_mastra_runtime on the 24 tables IPI-628 created in the private
-- "mastra" schema. Denies anon/authenticated entirely.
--
-- Per IPI-616's ADR (tasks/mastra/ipi-616-storage-schema-adr.md, Decision 4):
-- hyperdrive_mastra_runtime carries no Supabase JWT, so auth.uid() is
-- unavailable to it. The policy below scopes by ROLE membership only — it
-- answers "can this role touch the table at all" (yes, because it's the one
-- and only Mastra runtime role), not "which iPix organization owns this row"
-- (Mastra's own schema has no such column; that boundary is enforced at the
-- application layer via resourceId/threadId, verified separately by IPI-621).
-- This is NOT the same mistake as a blanket USING(true) on a
-- multi-tenant table with real tenant columns — there are no tenant columns
-- here to scope by.
--
-- Follows the same table-discovery pattern as the prior public.mastra_*
-- hardening (supabase/migrations/20260628173206_mastra_rls_hardening.sql,
-- IPI-227) — loop over live tables rather than a hardcoded list, so this
-- migration doesn't silently skip a table if the schema drifts.
--
-- Does not touch the existing public.mastra_* tables or their pre-existing
-- partial grants (found live during the IPI-616 audit) — that's a separate
-- cutover concern once the app is fully wired to the new schema (IPI-630).

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
    -- Deny PostgREST roles outright — belt-and-suspenders alongside the
    -- schema not being in config.toml's exposed `schemas` list.
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM anon', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE mastra.%I FROM authenticated', r.tablename);

    -- Minimal DML for the Mastra runtime role — no DDL, no ownership.
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mastra.%I TO hyperdrive_mastra_runtime',
      r.tablename
    );

    EXECUTE format('ALTER TABLE mastra.%I ENABLE ROW LEVEL SECURITY', r.tablename);

    EXECUTE format(
      'CREATE POLICY hyperdrive_mastra_runtime_all ON mastra.%I
         FOR ALL
         TO hyperdrive_mastra_runtime
         USING (true)
         WITH CHECK (true)',
      r.tablename
    );
  END LOOP;
END $$;
