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
--
-- Ordering dependency: this migration assumes the "mastra" schema and the
-- hyperdrive_mastra_runtime role already exist. The schema comes from
-- IPI-628 (supabase/migrations/20260722093028_mastra_schema_pinned_1_12_0.sql)
-- — that migration must apply first. The role is NOT created by any
-- migration in this repo; it was provisioned directly against the database
-- by IPI-617 (predates this chain) and is already live. Applying this file
-- alone against a database that has never run IPI-628's migration will fail
-- at the GRANT USAGE line below with "schema mastra does not exist".
--
-- DRIFT WARNING for future maintainers: the CREATE POLICY below intentionally
-- grants hyperdrive_mastra_runtime unrestricted USING(true)/WITH CHECK(true)
-- access, because no table in this schema has a tenant/organization column
-- to scope by (see IPI-616 ADR, Decision 4). If a future migration ever adds
-- an organization_id (or similar tenant) column to any mastra.* table, this
-- blanket policy will silently continue applying to it unless explicitly
-- revisited — re-check this policy loop before adding tenant columns here.

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
