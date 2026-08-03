// IPI-156 · CAMP-001 — draftCampaignBrief Mastra tool
// Proposal-only campaign creative brief for creative-director on /app/campaigns.
// Reads brand DNA via RLS-scoped Supabase — NEVER inserts/updates campaigns or briefs.
import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import { z } from "zod";
import { scoreLabel } from "@/lib/brand-utils";
import type { AiProfile } from "@/lib/brand-hub";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { requestToken } from "@/lib/request-token";
import { resolveModel, resolveProviderOptions } from "@/mastra/models";

const MODEL = resolveModel("structured");

export const CampaignBriefDraftContentSchema = z.object({
  mood: z.string(),
  visualDirection: z.string(),
  channelStrategy: z.string(),
  contentPillars: z.array(z.string()).min(1).max(6),
  heroMessage: z.string(),
  moodboardNotes: z.string(),
});

export type CampaignBriefDraftContent = z.infer<typeof CampaignBriefDraftContentSchema>;

type BrandRow = {
  id: string;
  name: string;
  brand_url: string | null;
  ai_profile: unknown;
};

type ScoreRow = {
  score_type: string;
  score: number | string | null;
};

/** Format brand profile + DNA scores for LLM grounding (exported for unit tests). */
export function formatBrandDnaContext(
  brand: Pick<BrandRow, "name" | "brand_url">,
  profile: AiProfile | null,
  scores: ScoreRow[],
): string {
  const lines = [`Brand: ${brand.name}`];
  if (brand.brand_url) lines.push(`URL: ${brand.brand_url}`);
  if (profile?.overview) lines.push(`Overview: ${profile.overview}`);
  if (profile?.tagline) lines.push(`Tagline: ${profile.tagline}`);
  if (profile?.category) lines.push(`Category: ${profile.category}`);
  if (profile?.targetAudience) lines.push(`Target audience: ${profile.targetAudience}`);
  if (profile?.brandVoice) lines.push(`Brand voice: ${profile.brandVoice}`);
  if (profile?.contentPillars?.length) {
    lines.push(`Existing content pillars: ${profile.contentPillars.join(", ")}`);
  }
  if (profile?.visualIdentity?.mood) {
    lines.push(`Visual mood: ${profile.visualIdentity.mood}`);
  }
  if (profile?.visualIdentity?.colors?.length) {
    lines.push(`Brand colors: ${profile.visualIdentity.colors.join(", ")}`);
  }
  if (scores.length) {
    const scoreLines = scores
      .filter((s) => s.score != null && s.score !== "")
      .map((s) => `${scoreLabel(s.score_type)}: ${s.score}`);
    if (scoreLines.length) lines.push(`DNA scores:\n${scoreLines.join("\n")}`);
  }
  return lines.join("\n");
}

async function loadBrandDnaContext(brandId: string): Promise<
  | { ok: true; brandName: string; context: string }
  | { ok: false; error: string }
> {
  const accessToken = requestToken.getStore();
  if (!accessToken) {
    return { ok: false, error: "Access token not available in request context" };
  }

  const supabase = createUserScopedClient(accessToken);
  const [{ data: brand, error: brandErr }, { data: scoreRows, error: scoresErr }] =
    await Promise.all([
      supabase
        .from("brands")
        .select("id, name, brand_url, ai_profile")
        .eq("id", brandId)
        .maybeSingle(),
      supabase.from("brand_scores").select("score_type, score").eq("brand_id", brandId),
    ]);

  if (brandErr) {
    return { ok: false, error: `Brand lookup failed: ${brandErr.message}` };
  }
  if (!brand) {
    return { ok: false, error: "Brand not found or not accessible to this operator" };
  }
  if (scoresErr) {
    return { ok: false, error: `Brand scores lookup failed: ${scoresErr.message}` };
  }

  const profile = (brand.ai_profile ?? null) as AiProfile | null;
  const context = formatBrandDnaContext(brand as BrandRow, profile, (scoreRows ?? []) as ScoreRow[]);

  return { ok: true, brandName: brand.name, context };
}

export const draftCampaignBrief = createTool({
  id: "draftCampaignBrief",
  description:
    "Draft a campaign creative brief grounded in brand DNA. Returns a structured proposal only — " +
    "does NOT save a campaign or brief to the database. The operator must review and approve before " +
    "anything is persisted (HITL). Use on /app/campaigns when the operator wants mood, channels, " +
    "or creative direction for a new campaign.",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    campaignName: z.string().min(1).max(200),
    channels: z.array(z.string()).max(12).optional().default([]),
    goal: z.string().max(2000).optional(),
    briefSeed: z.string().max(4000).optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().nullable(),
    brandId: z.string().uuid().optional(),
    brandName: z.string().optional(),
    campaignName: z.string().optional(),
    channels: z.array(z.string()).optional(),
    draft: z
      .object({
        status: z.literal("draft"),
        requiresHumanApproval: z.literal(true),
        persisted: z.literal(false),
        mood: z.string(),
        visualDirection: z.string(),
        channelStrategy: z.string(),
        contentPillars: z.array(z.string()),
        heroMessage: z.string(),
        moodboardNotes: z.string(),
        summary: z.string(),
      })
      .nullable(),
  }),
  execute: async ({ brandId, campaignName, channels: inputChannels, goal, briefSeed }) => {
    const channels = inputChannels ?? [];
    const loaded = await loadBrandDnaContext(brandId);
    if (!loaded.ok) {
      return { ok: false, error: loaded.error, draft: null };
    }

    const channelList = channels.length ? channels.join(", ") : "to be confirmed with operator";
    const goalLine = goal?.trim()
      ? `Campaign goal (operator intent): ${goal.trim()}`
      : "Campaign goal: general brand awareness and content planning.";
    const seedLine = briefSeed?.trim()
      ? `Operator seed ideas (use as inspiration, not verbatim copy):\n"${briefSeed.trim()}"`
      : "";

    const { object } = await generateObject({
      model: MODEL,
      schema: CampaignBriefDraftContentSchema,
      prompt: `You are an iPix creative director drafting a campaign brief for a fashion/DTC operator.

${loaded.context}

Campaign name: ${campaignName}
Target channels: ${channelList}
${goalLine}
${seedLine}

Rules:
- Ground creative direction in the brand DNA above — do not invent a conflicting brand identity.
- contentPillars: 3–5 short phrases the campaign should own.
- moodboardNotes: concrete visual references (lighting, palette, styling, locations) an operator can brief a shoot with.
- Keep each field concise and actionable for a production planner downstream.
- This is a DRAFT only — never imply the campaign is saved or live.`,
      providerOptions: resolveProviderOptions("structured"),
    });

    const summary =
      `Draft campaign brief for "${campaignName}" (${loaded.brandName}). ` +
      `Mood: ${object.mood}. Channels: ${channelList}. ` +
      "Awaiting operator review — nothing has been saved.";

    return {
      ok: true,
      error: null,
      brandId,
      brandName: loaded.brandName,
      campaignName,
      channels,
      draft: {
        status: "draft" as const,
        requiresHumanApproval: true as const,
        persisted: false as const,
        ...object,
        summary,
      },
    };
  },
});
