import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const MIGRATION = root("supabase/migrations/20260818215030_ipi585_create_talent_profile_rpc.sql");

describe("IPI-585 create_talent_profile_with_sources migration contract", () => {
  it("ships the migration file", () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it("defines an authenticated SECURITY DEFINER write RPC into talent.*", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("create or replace function public.create_talent_profile_with_sources");
    expect(sql).toContain("create or replace function public.get_own_talent_profile");
    expect(sql).toContain("security definer");
    expect(sql).toContain("authentication required");
    expect(sql).toContain("insert into talent.talent_profiles");
    expect(sql).toContain("insert into talent.talent_profile_sources");
    expect(sql).toContain("jsonb_build_object('half_day', p_half_day)");
    expect(sql).toContain("'handle'");
    expect(sql).toContain("'niche'");
    expect(sql).toContain("'location'");
    expect(sql).toContain("talent or agency role required");
    expect(sql).toContain("failed to insert all provenance rows");
    expect(sql).toContain("talent profile already exists");
    expect(sql).toContain("insert into talent.talent_profiles");
    expect(sql).toContain("grant execute on function public.create_talent_profile_with_sources");
    expect(sql).toContain("to authenticated");
  });
});
