import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_BRAND_URL = process.env.BRAND_INTEL_TEST_URL ?? "https://www.glossier.com";

const hasEnv = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY);

const run = hasEnv ? describe : describe.skip;

const stamp = Date.now();
const email = `int-${stamp}@ipix-test.example`;
const password = "IntelTest123!";

const admin = hasEnv
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const userClient = hasEnv
  ? createClient(SUPABASE_URL!, ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

let userId: string | null = null;
let orgId: string | null = null;
let brandId: string | null = null;
let logId: string | null = null;

run("brand-intelligence integration", () => {
  it("creates test user", async () => {
    const { error } = await admin!.auth.admin.createUser({ email, password, email_confirm: true });
    expect(error).toBeNull();
  });

  it("signs in as test user", async () => {
    const { data, error } = await userClient!.auth.signInWithPassword({ email, password });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeTruthy();
    userId = data.user!.id;
  });

  it("creates test org", async () => {
    const { data, error } = await userClient!
      .from("organizations")
      .insert({ name: `Intel Org ${stamp}`, slug: `intel-org-${stamp}`, owner_id: userId!, type: "brand" })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    orgId = data!.id;
  });

  it("creates brand shell with _lifecycle=brand_created", async () => {
    const { data, error } = await userClient!
      .from("brands")
      .insert({
        name: "Intel Test Brand",
        brand_url: TEST_BRAND_URL,
        user_id: userId!,
        org_id: orgId!,
        ai_profile: { industry: "fashion", goal: "ecommerce", _lifecycle: "brand_created" },
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    brandId = data!.id;
  });

  it("edge function rejects anonymous call (no JWT)", async () => {
    const res = await fetch(
      `${SUPABASE_URL!}/functions/v1/brand-intelligence`,
      {
        method: "POST",
        headers: { apikey: ANON_KEY!, "Content-Type": "application/json" },
        body: JSON.stringify({ url: TEST_BRAND_URL }),
      },
    );
    expect(res.status).toBe(401);
  });

  it("edge function analyzes brand and returns 10 score types", async () => {
    const { data: session } = await userClient!.auth.signInWithPassword({ email, password });
    const token = session!.session!.access_token;

    const res = await fetch(
      `${SUPABASE_URL!}/functions/v1/brand-intelligence`,
      {
        method: "POST",
        headers: {
          apikey: ANON_KEY!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: TEST_BRAND_URL, brandId, brand_name: "Intel Test Brand" }),
      },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data?.brandId).toBe(brandId);
    expect(body.data?.logId).toBeTruthy();
    expect(body.data?.scores).toBeTruthy();

    brandId = body.data.brandId;
    logId = body.data.logId;
  }, 120_000);

  it("10 score rows persisted with correct metadata", async () => {
    expect(brandId).toBeTruthy();

    const { data: scores, error } = await admin!
      .from("brand_scores")
      .select("score_type, score, score_version, source, details")
      .eq("brand_id", brandId!);
    expect(error).toBeNull();
    expect(scores).toHaveLength(10);

    for (const row of scores!) {
      expect(row.score_version).toBe(1);
      expect(row.source).toBe("edge_fn");
      expect(row.details).toBeTruthy();

      if (row.details && typeof row.details === "object") {
        const d = row.details as Record<string, unknown>;
        if (typeof d.confidence === "number") {
          expect(d.confidence).toBeGreaterThanOrEqual(0);
          expect(d.confidence).toBeLessThanOrEqual(100);
        }
        if (Array.isArray(d.evidence)) {
          for (const e of d.evidence) {
            expect(typeof e).toBe("string");
          }
        }
      }
    }

    const types = scores!.map((s) => s.score_type).sort();
    expect(types).toEqual([
      "audience",
      "brand_clarity",
      "commerce_readiness",
      "consistency",
      "content_strength",
      "digital_experience",
      "photography_readiness",
      "social_presence",
      "sustainability_signal",
      "visual",
    ]);
  });

  it("brands.ai_profile merge preserved shell fields", async () => {
    const { data, error } = await admin!
      .from("brands")
      .select("ai_profile")
      .eq("id", brandId!)
      .single();
    expect(error).toBeNull();
    expect(data!.ai_profile?.name).toBeTruthy();
    expect(data!.ai_profile?.industry).toBe("fashion");
  });

  it("lifecycle transitions to scores_complete", async () => {
    const { data, error } = await admin!
      .from("brands")
      .select("ai_profile, intake_status")
      .eq("id", brandId!)
      .single();
    expect(error).toBeNull();
    expect(data!.ai_profile?._lifecycle).toBe("scores_complete");
    expect(data!.intake_status).toBe("scores_complete");
  });

  it("ai_agent_logs row created with duration_ms", async () => {
    expect(logId).toBeTruthy();

    const { data, error } = await admin!
      .from("ai_agent_logs")
      .select("id, duration_ms, agent_name")
      .eq("id", logId!)
      .single();
    expect(error).toBeNull();
    expect(data!.agent_name).toBe("brand-intelligence");
    expect(typeof data!.duration_ms).toBe("number");
    expect(data!.duration_ms).toBeGreaterThan(0);
  });

  it("dna_readiness is never stored", async () => {
    const { count, error } = await admin!
      .from("brand_scores")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId!)
      .eq("score_type", "dna_readiness");
    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  it("cleans up test data", async () => {
    await admin!.auth.admin.deleteUser(userId!);
    userId = null;
    brandId = null;
    orgId = null;
    logId = null;
  });
});

if (!hasEnv) {
  describe("brand-intelligence integration", () => {
    it("skipped — set VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY", () => {
      expect(true).toBe(true);
    });
  });
}
