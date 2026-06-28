import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
import { resolveModel } from "../models";

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
      model: resolveModel(),
      prompt: `You are a Creative Director writing a professional fashion photography creative brief.

${brandContext ? `Brand context:\n${brandContext}\n` : ""}Campaign: ${shootName}
Target channels: ${channelList}
${seedSection}${toneSection}
Write a complete creative brief of 4–6 paragraphs. Cover:
- Campaign vision and mood
- Visual direction: lighting, location, setting, composition
- Talent, styling, and art direction
- Content mix suited to the target channels
- Tone, brand alignment, and campaign goals

Be specific, professional, and actionable. Write in a confident creative director voice, first person from the brand's perspective. Output only the brief text — no headings, no labels, no bullet points.`,
      maxOutputTokens: 1200,
      // ponytail: thinkingBudget:0 — gemini-3.5-flash is a thinking model; without this it
      // burns ~760/800 tokens on reasoning and outputs only ~30 words of actual text.
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
      },
    });

    return { brief: text.trim() };
  },
});
