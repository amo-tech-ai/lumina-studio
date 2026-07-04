import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const MIGRATION = root("supabase/migrations/20260703194500_ipi340_create_booking_request_rpc.sql");

describe("IPI-340 create_booking_request migration contract", () => {
  it("ships the migration file", () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it("defines SECURITY DEFINER RPC with auth and org guards", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("create or replace function public.create_booking_request");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = public, talent, shoot");
    expect(sql).toContain("authentication required");
    expect(sql).toContain("p_brand_org_id is null");
    expect(sql).toContain("not a member of this organization");
    expect(sql).toContain("invalid date range: start date must be on or before end date");
    expect(sql).toContain("start date cannot be in the past");
    expect(sql).toContain("rate_quoted must be non-negative");
    expect(sql).toContain("talent profile not found");
    expect(sql).toContain("shoot not found");
  });

  it("forces requested status and returns booking_id, status, version, expires_at", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("'requested'");
    expect(sql).toContain("requested_by");
    expect(sql).toContain("auth.uid()");
    expect(sql).toContain("'booking_id', v_booking_id");
    expect(sql).toContain("'version', v_version");
    expect(sql).toContain("'expires_at', v_expires_at");
  });

  it("grants execute to authenticated only", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toContain("revoke all on function public.create_booking_request");
    expect(sql).toContain("from public, anon");
    expect(sql).toContain("grant execute on function public.create_booking_request");
    expect(sql).toContain("to authenticated");
  });

  it("does not ship MG-4 transition_booking or RLS lockdown", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).not.toContain("transition_booking");
    expect(sql).not.toMatch(/drop policy.*bookings_update_party/i);
  });
});
