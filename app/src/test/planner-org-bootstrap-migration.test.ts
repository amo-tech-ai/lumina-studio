import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const MIGRATION = root(
  "supabase/migrations/20260710123617_planner_org_default_workflow_bootstrap.sql",
);

describe("IPI-477 PLAN-SEED-002 org bootstrap migration contract", () => {
  it("ships the migration file", () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it("defines idempotent ensure_default_5_week_workflow with advisory lock", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("create or replace function planner.ensure_default_5_week_workflow");
    expect(sql).toContain("security definer");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("5-Week Product Shoot");
    expect(sql).toContain("on conflict (workflow_id, slug) do nothing");
    expect(sql).toContain("is_default = true");
  });

  it("wires AFTER INSERT trigger on organizations", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("trg_organizations_ensure_planner_default");
    expect(sql).toContain("after insert on public.organizations");
    expect(sql).toContain("organizations_ensure_planner_default");
  });

  it("restricts EXECUTE to service_role and uses set-based backfill", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain("grant execute on function planner.ensure_default_5_week_workflow(uuid) to service_role");
    expect(sql).not.toContain("to authenticated, service_role");
    expect(sql).toContain("perform planner.ensure_default_5_week_workflow(o.id)");
    expect(sql).toContain("from public.organizations o");
  });
});
