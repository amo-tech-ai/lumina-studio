import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const MIGRATION = root("supabase/migrations/20260818221926_ipi585_talent_source_review_status.sql");

describe("IPI-585 talent source review_status migration contract", () => {
  it("ships the migration file", () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it("persists approved vs edited on provenance rows", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("add column if not exists review_status");
    expect(sql).toContain("check (review_status in ('approved', 'edited'))");
    expect(sql).toContain("v_review_status");
    expect(sql).toContain("source review_status must be approved or edited");
    expect(sql).toContain("review_status");
  });
});
