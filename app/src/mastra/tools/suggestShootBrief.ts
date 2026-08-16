import { createTool } from "@mastra/core/tools";
import type { RequestContext } from "@mastra/core/request-context";
import { z } from "zod";
import { generateText } from "ai";
import { resolveAgentModel } from "@/lib/ai/cloudflare-models";
import { resolveModel, resolveProviderOptions } from "../models";

export const ALLOWED_TONES = ["shorter", "more luxury", "more commercial", "more social-first", "more editorial"] as const;
export type AllowedTone = (typeof ALLOWED_TONES)[number];

export const suggestShootBriefTool = createTool({
  id: "suggestShootBrief",
  description: "Generate a complete professional creative brief for a fashion photography shoot.",
  inputSchema: z.object({
    brandContext: z.string().optional(),
    channels: z.array(z.string()),
    shootName: z.string(),
    briefSeed: z.string().max(8000).optional(),
    tone: z.enum(ALLOWED_TONES).optional(),
  }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async (
    { brandContext, channels, shootName, briefSeed, tone },
    { requestContext }: { requestContext?: RequestContext } = {} as never,
  ) => {
    const channelList = channels.join(", ") || "unspecified channels";

    const seedSection = briefSeed
      ? `\nOperator's creative direction (use as intent and inspiration — do not simply continue this sentence, rewrite it into a complete professional brief):\n"${briefSeed}"\n`
      : "";

    const toneSection = tone
      ? `\nTone adjustment: rewrite the brief to feel ${tone}.\n`
      : "";

    // IPI-752 · CF-MIG-230-W3 — request-aware first (reuse IPI-750 draftCampaignBrief).
    // Legacy resolveModel only when context is missing or the resolver throws.
    let model;
    try {
      if (requestContext) {
        model = await resolveAgentModel({ agentId: "production-planner", tier: "default", requestContext });
      } else {
        model = resolveModel("default");
      }
    } catch {
      console.warn(
        "[suggestShootBrief] resolveAgentModel failed (agentId: production-planner, tier: default); falling back to legacy model",
      );
      model = resolveModel("default");
    }

    const { text } = await generateText({
      model,
      prompt: `You are a Creative Director writing a concise shoot brief.

${brandContext ? `Brand context:\n${brandContext}\n` : ""}Campaign: ${shootName}
Target channels: ${channelList}
${seedSection}${toneSection}
Write 2–3 short paragraphs (150–220 words total):
1. Vision and mood — what this shoot should feel like and why
2. Visual direction — light, location, talent, styling in one tight paragraph
3. One sentence on how the content serves ${channelList}

No headings, no bullet points, no deliverables list. Confident creative director voice. Output only the brief text.`,
      maxOutputTokens: 400,
      // On Gemini, thinkingBudget:0 prevents reasoning tokens from eating the
      // 400-token output budget. Empty when this tier routes via AI Gateway.
      providerOptions: resolveProviderOptions("default"),
    });

    return { brief: text.trim() };
  },
});
