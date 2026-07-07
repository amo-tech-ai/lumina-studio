import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
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
  execute: async ({ brandContext, channels, shootName, briefSeed, tone }) => {
    const channelList = channels.join(", ") || "unspecified channels";

    const seedSection = briefSeed
      ? `\nOperator's creative direction (use as intent and inspiration — do not simply continue this sentence, rewrite it into a complete professional brief):\n"${briefSeed}"\n`
      : "";

    const toneSection = tone
      ? `\nTone adjustment: rewrite the brief to feel ${tone}.\n`
      : "";

    const { text } = await generateText({
      model: resolveModel("default"),
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
      // 400-token output budget. No-op on Groq (resolveProviderOptions is provider-aware).
      providerOptions: resolveProviderOptions(),
    });

    return { brief: text.trim() };
  },
});
