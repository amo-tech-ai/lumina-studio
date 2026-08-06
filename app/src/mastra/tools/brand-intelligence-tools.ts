// IPI-130 · IPI-260 — brand-intelligence agent tools
// READ tools query Supabase direct (service-role, server-only Mastra runtime).
// WRITE tools: startBrandAnalysis → edge fn; approveDraft → HITL approve route.
import { createTool } from "@mastra/core/tools";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseScoreDetails } from "@/lib/brand-hub";
import { processBrandIntelligenceDraftApproval, PENDING_DRAFT_STATUS } from "@/app/api/_lib/process-draft-approval";
import { scoreLabel } from "@/lib/brand-utils";
import { requestToken } from "@/lib/request-token";
import { callEdgeFunction } from "./edge";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveOperatorId(accessToken: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase client env vars not set");
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data: { user }, error } = await sb.auth.getUser(accessToken);
  if (error || !user) throw new Error("Access token not available in request context");
  return user.id;
}

const PILLAR_ALIASES: Record<string, string> = {
  visual: "visual",
  "visual identity": "visual",
  visual_identity: "visual",
  audience: "audience",
  consistency: "consistency",
  commerce: "commerce_readiness",
  commerce_readiness: "commerce_readiness",
  "commerce readiness": "commerce_readiness",
  social: "social_presence",
  social_presence: "social_presence",
  "social presence": "social_presence",
  content: "content_strength",
  content_strength: "content_strength",
  "content strength": "content_strength",
  brand_clarity: "brand_clarity",
  "brand clarity": "brand_clarity",
  digital_experience: "digital_experience",
  "digital experience": "digital_experience",
  photography_readiness: "photography_readiness",
  "photography readiness": "photography_readiness",
};

export function normalizePillar(input: string): string {
  const key = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (PILLAR_ALIASES[key]) return PILLAR_ALIASES[key];
  const underscored = key.replace(/\s+/g, "_");
  return PILLAR_ALIASES[underscored] ?? underscored;
}

function toConfidencePercent(raw: number | undefined, score: number): number {
  const confidence =
    raw === undefined ? Math.min(95, Math.max(45, score)) : raw <= 1 ? raw * 100 : raw;
  return Math.min(100, Math.max(0, Math.round(confidence)));
}

function estimatePotential(score: number): number {
  return Math.min(100, Math.round(score + (100 - score) * 0.35));
}

function defaultSuggestions(
  score: number,
  pillarLabel: string,
): { text: string; gain: number }[] {
  if (score >= 85) {
    return [{ text: `Maintain ${pillarLabel} standards in new content`, gain: 2 }];
  }
  if (score >= 70) {
    return [
      { text: `Audit top-performing assets against ${pillarLabel} criteria`, gain: 5 },
      { text: `Align upcoming shoot brief to ${pillarLabel} guidelines`, gain: 4 },
    ];
  }
  return [
    { text: `Run a focused ${pillarLabel} content audit`, gain: 8 },
    { text: `Update brand guidelines for ${pillarLabel}`, gain: 6 },
    { text: `Schedule a reshoot for off-brand hero assets`, gain: 5 },
  ];
}

const evidenceBlockSchema = z.object({
  title: z.string(),
  score: z.number(),
  potential: z.number(),
  confidence: z.number(),
  why: z.string(),
  reasoning: z.string().optional(),
  evidence: z.array(z.object({ text: z.string() })).optional(),
  suggestions: z.array(z.object({ text: z.string(), gain: z.number() })).optional(),
});

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

export const explainPillarTool = createTool({
  id: "explainPillar",
  description:
    "Return a structured EvidenceBlock-compatible explanation for one brand intelligence pillar (e.g. visual, audience, consistency, commerce_readiness). Use when the operator asks why a score is what it is.",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    pillar: z.string().min(1),
  }),
  outputSchema: evidenceBlockSchema,
  execute: async ({ brandId, pillar }) => {
    const scoreType = normalizePillar(pillar);
    const sb = adminClient();
    const { data, error } = await sb
      .from("brand_scores")
      .select("score_type, score, details, source")
      .eq("brand_id", brandId)
      .eq("score_type", scoreType)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch pillar score: ${error.message}`);
    if (!data) {
      throw new Error(`No score found for pillar "${pillar}" (${scoreType}) on this brand`);
    }

    const score = Number(data.score);
    const parsed = parseScoreDetails(data.details);
    const title = scoreLabel(scoreType);
    const why =
      parsed?.evidence?.[0] ??
      `${title} scored ${score}/100 based on brand intelligence analysis${data.source ? ` (${data.source})` : ""}.`;
    const reasoning =
      parsed?.evidence && parsed.evidence.length > 1
        ? `Weighted ${parsed.evidence.length} signals from crawl and profile analysis for ${title.toLowerCase()}.`
        : undefined;
    const evidence = parsed?.evidence?.map((text) => ({ text }));
    const confidence = toConfidencePercent(parsed?.confidence, score);
    const potential = estimatePotential(score);

    return {
      title,
      score,
      potential,
      confidence,
      why,
      reasoning,
      evidence: evidence?.length ? evidence : undefined,
      suggestions: defaultSuggestions(score, title),
    };
  },
});

export const approveDraftTool = createTool({
  id: "approveDraft",
  description:
    "Approve or reject the pending brand intelligence draft after explicit operator confirmation (HITL). Only call when the operator clearly says to approve or reject the draft on the brand page.",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    approved: z.boolean(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    approved: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ brandId, approved }) => {
    const accessToken = requestToken.getStore();
    if (!accessToken) throw new Error("Access token not available in request context");

    const operatorId = await resolveOperatorId(accessToken);

    const sb = adminClient();
    const { data: draft, error: lookupErr } = await sb
      .from("brand_intake_drafts")
      .select("draft_profile")
      .eq("brand_id", brandId)
      .eq("user_id", operatorId)
      .eq("status", PENDING_DRAFT_STATUS)
      .maybeSingle();
    if (lookupErr) throw new Error(`Failed to look up pending draft: ${lookupErr.message}`);

    const runId = (draft?.draft_profile as Record<string, unknown> | null)?._workflow_run_id;
    if (typeof runId !== "string" || !runId) {
      throw new Error("No pending draft awaiting approval for this brand");
    }

    const result = await processBrandIntelligenceDraftApproval({
      runId,
      approved,
      operatorId,
      expectedBrandId: brandId,
    });
    if (!result.ok) throw new Error(result.error);

    return {
      ok: true,
      approved,
      message: approved
        ? "Draft approved. Brand profile will update shortly."
        : "Draft rejected. You can trigger a new analysis when ready.",
    };
  },
});

export const startBrandAnalysis = createTool({
  id: "startBrandAnalysis",
  description:
    "Trigger a fresh brand intelligence analysis (crawl → profile → HITL draft). Only call this when the operator explicitly requests a re-analysis. Returns the workflow run ID.",
  inputSchema: z.object({
    brandId: z.string().uuid(),
  }),
  outputSchema: z.object({ runId: z.string(), message: z.string() }),
  execute: async ({ brandId }) => {
    const accessToken = requestToken.getStore();
    if (!accessToken) throw new Error("Access token not available in request context");
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
  explainPillar: explainPillarTool,
  approveDraft: approveDraftTool,
  startBrandAnalysis,
} as const;
