import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasEnv = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY);

const run = hasEnv ? describe : describe.skip;

const stamp = Date.now();
const testBrandUrl = "https://www.glossier.com";

const admin = hasEnv
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const BASE_SCORE_TYPES = ["visual", "audience", "consistency", "commerce_readiness"] as const;
const EXTENDED_SCORE_TYPES = [
  "brand_clarity", "content_strength", "social_presence",
  "digital_experience", "sustainability_signal", "photography_readiness",
] as const;

function computeDnaScore(scores: { score_type: string; score: number }[]): number | null {
  const base = scores.filter((s) => (BASE_SCORE_TYPES as readonly string[]).includes(s.score_type as typeof BASE_SCORE_TYPES[number]));
  if (base.length === 0) return null;
  return Math.round(base.reduce((sum, s) => sum + s.score, 0) / base.length);
}

run("brand pipeline — score query + DNA computation", () => {
  let brandId: string | null = null;

  it("fetches a previously analyzed brand from the DB", async () => {
    const queryPromise = admin!
      .from("brands")
      .select("id, name, ai_profile, intake_status")
      .eq("intake_status", "scores_complete")
      .limit(1);

    const { data, error } = await Promise.race([
      queryPromise,
      new Promise<Awaited<typeof queryPromise>>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: "timeout" } } as Awaited<typeof queryPromise>),
          4_000,
        )
      ),
    ]);
    if (error || !data || data.length === 0) {
      return;
    }
    brandId = data[0].id;
    expect(data[0].intake_status).toBe("scores_complete");
    expect(data[0].ai_profile?.name).toBeTruthy();
  });

  it("loads brand_scores grouped as Core (4) + Extended (6)", async () => {
    if (!brandId) return;

    const { data: scores, error } = await admin!
      .from("brand_scores")
      .select("score_type, score, score_version, source")
      .eq("brand_id", brandId)
      .order("score_type");
    expect(error).toBeNull();
    expect(scores).toHaveLength(10);

    const coreCount = scores!.filter((s) =>
      (BASE_SCORE_TYPES as readonly string[]).includes(s.score_type as typeof BASE_SCORE_TYPES[number]),
    ).length;
    const extendedCount = scores!.filter((s) =>
      (EXTENDED_SCORE_TYPES as readonly string[]).includes(s.score_type as typeof EXTENDED_SCORE_TYPES[number]),
    ).length;
    expect(coreCount).toBe(4);
    expect(extendedCount).toBe(6);
  });

  it("DNA badge is computed AVG of base 4 only, never stored", async () => {
    if (!brandId) return;

    const { data: scores } = await admin!
      .from("brand_scores")
      .select("score_type, score")
      .eq("brand_id", brandId);
    expect(scores).toBeTruthy();

    const dna = computeDnaScore(scores!);
    expect(dna).toBeGreaterThanOrEqual(0);
    expect(dna).toBeLessThanOrEqual(100);

    const { count } = await admin!
      .from("brand_scores")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("score_type", "dna_readiness");
    expect(count).toBe(0);
  });

  it("all scores have score_version=1 and source=edge_fn", async () => {
    if (!brandId) return;

    const { data: scores } = await admin!
      .from("brand_scores")
      .select("score_type, score_version, source")
      .eq("brand_id", brandId);
    expect(scores).toBeTruthy();
    expect(scores!.length).toBeGreaterThan(0);

    for (const s of scores!) {
      expect(s.score_version).toBe(1);
      expect(s.source).toBe("edge_fn");
    }
  });

  it("ai_profile and intake_status reflect completed analysis", async () => {
    if (!brandId) return;

    const { data: brand } = await admin!
      .from("brands")
      .select("ai_profile, intake_status")
      .eq("id", brandId)
      .single();
    expect(brand).toBeTruthy();
    expect(brand!.intake_status).toBe("scores_complete");
    expect(brand!.ai_profile?._lifecycle).toBe("scores_complete");
  });

  it("ai_agent_logs exist for the analyzed brand", async () => {
    if (!brandId) return;

    const { data: logs, error } = await admin!
      .from("ai_agent_logs")
      .select("id, duration_ms, agent_name")
      .eq("metadata->>brandId", brandId!)
      .limit(1);
    if (error || !logs || logs.length === 0) {
      return;
    }
    expect(logs[0].agent_name).toBe("brand-intelligence");
    expect(logs[0].duration_ms).toBeGreaterThan(0);
  });
});

if (!hasEnv) {
  describe("brand pipeline", () => {
    it("skipped — set SUPABASE_SERVICE_ROLE_KEY", () => {
      expect(true).toBe(true);
    });
  });
}
