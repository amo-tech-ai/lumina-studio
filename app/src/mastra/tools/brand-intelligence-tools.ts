// IPI-130 — brand-intelligence agent tools
// READ tools query Supabase direct (service-role, server-only Mastra runtime).
// WRITE tool routes through callEdgeFunction — no direct DB writes.
import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { callEdgeFunction } from "./edge";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const getBrandProfile = createTool({
  id: "getBrandProfile",
  description:
    "Read a brand's current profile, status, and AI analysis from the database. Use when you need fresher data than what is already in your injected context (e.g. after a re-analysis completes).",
  inputSchema: z.object({ brandId: z.string().uuid() }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    brand_url: z.string().nullable(),
    intake_status: z.string().nullable(),
    hasDraft: z.boolean(),
    hasProfile: z.boolean(),
    profileSummary: z.string().nullable(),
  }),
  execute: async ({ brandId }) => {
    const sb = adminClient();
    const { data, error } = await sb
      .from("brands")
      .select("id, name, brand_url, intake_status, ai_profile, ai_profile_draft")
      .eq("id", brandId)
      .single();
    if (error || !data) throw new Error(`Brand not found: ${brandId}`);
    const profile = data.ai_profile as Record<string, unknown> | null;
    const summary = profile?.overview as string | null ?? null;
    return {
      id: data.id,
      name: data.name,
      brand_url: data.brand_url ?? null,
      intake_status: data.intake_status ?? null,
      hasDraft: data.intake_status === "draft_ready",
      hasProfile: !!profile,
      profileSummary: summary,
    };
  },
});

export const getBrandScores = createTool({
  id: "getBrandScores",
  description:
    "Read the current brand intelligence scores (visual, social, content, etc.) for a brand.",
  inputSchema: z.object({ brandId: z.string().uuid() }),
  outputSchema: z.object({
    scores: z.array(z.object({
      score_type: z.string(),
      score: z.number(),
      rationale: z.string().nullable(),
    })),
    overallScore: z.number().nullable(),
  }),
  execute: async ({ brandId }) => {
    const sb = adminClient();
    const { data, error } = await sb
      .from("brand_scores")
      .select("score_type, score, rationale")
      .eq("brand_id", brandId)
      .order("score_type");
    if (error) throw new Error(`Failed to fetch brand scores: ${error.message}`);
    const scores = (data ?? []).map((s) => ({
      score_type: s.score_type,
      score: Number(s.score),
      rationale: (s.rationale as string | null) ?? null,
    }));
    const overall = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : null;
    return { scores, overallScore: overall };
  },
});

export const startBrandAnalysis = createTool({
  id: "startBrandAnalysis",
  description:
    "Trigger a fresh brand intelligence analysis (crawl → profile → HITL draft). Only call this when the operator explicitly requests a re-analysis. Returns the workflow run ID.",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    accessToken: z.string().describe("Operator's Supabase JWT — required to start the workflow"),
  }),
  outputSchema: z.object({ runId: z.string(), message: z.string() }),
  execute: async ({ brandId, accessToken }) => {
    const result = await callEdgeFunction<{ runId: string }>(
      "start-brand-crawl",
      { brandId },
      { accessToken },
    );
    return {
      runId: result.runId,
      message: "Brand analysis started. The crawl typically takes 2–5 minutes. A draft will appear on the brand page when ready for your review.",
    };
  },
});

export const brandIntelligenceTools = {
  getBrandProfile,
  getBrandScores,
  startBrandAnalysis,
} as const;
