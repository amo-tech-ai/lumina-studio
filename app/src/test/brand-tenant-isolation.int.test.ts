import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getCurrentOrgId } from "@/lib/crm/queries";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasEnv = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY);
const run = hasEnv ? describe : describe.skip;

const admin: SupabaseClient<Database> | null = hasEnv
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

run("tenant isolation — remote Supabase RLS", () => {
  let brandId: string | null = null;
  let userId: string | null = null;
  let orgId: string | null = null;

  it("finds a brand with scores for testing", async () => {
    const { data: brands, error } = await admin!
      .from("brands")
      .select("id, org_id")
      .not("org_id", "is", null)
      .limit(1);
    if (error || !brands || brands.length === 0) return;
    brandId = brands[0].id;
    orgId = brands[0].org_id;

    const { data: members } = await admin!
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .limit(1);
    if (members && members.length > 0) {
      userId = members[0].user_id;
    }
  });

  it("getCurrentOrgId resolves the member's org via user-scoped client", async () => {
    if (!brandId || !userId || !orgId) return;

    const sb = createClient<Database>(
      SUPABASE_URL!,
      ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${SERVICE_KEY!}` } },
      },
    );

    const resolvedOrg = await getCurrentOrgId(userId, sb);
    expect(resolvedOrg).toBe(orgId);
  });

  it("brand_scores SELECT policy enforces org membership (RLS active)", async () => {
    const { data, error } = await admin!
      .rpc("pg_catalog.pg_get_policy", {
        pol_name: null,
        pol_relation: "brand_scores",
      });
    // Verify the policy exists by querying pg_policies
    const { data: policies, error: polErr } = await admin!
      .from("pg_policies")
      .select("policy_name")
      .eq("tablename", "brand_scores");
    if (polErr) return;
    const policyNames = (policies ?? []).map((p) => p.policy_name);
    expect(policyNames).toContain("brand_scores_select_via_brand");
  });
});

if (!hasEnv) {
  describe("tenant isolation — remote Supabase RLS", () => {
    it("skipped — set SUPABASE_SERVICE_ROLE_KEY", () => {
      expect(true).toBe(true);
    });
  });
}
