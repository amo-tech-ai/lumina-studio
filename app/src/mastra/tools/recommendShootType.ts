import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const SHOOT_TYPE_RULES: Record<string, string[]> = {
  ecommerce_pdp: ["shopify", "amazon", "website"],
  editorial: ["instagram_feed", "pinterest", "facebook"],
  ugc_style: ["instagram_reel", "tiktok"],
  lookbook: ["instagram_feed", "pinterest", "instagram_story"],
  campaign: ["instagram_feed", "instagram_reel", "facebook", "youtube"],
  packshot: ["shopify", "amazon", "website"],
};

export const recommendShootType = createTool({
  id: "recommendShootType",
  description:
    "Suggest the best shoot type based on brief, products, channels, and brand DNA context.",
  inputSchema: z.object({
    brief: z.string().describe("Short shoot brief or campaign description"),
    channels: z
      .array(
        z.enum([
          "instagram_feed",
          "instagram_story",
          "instagram_reel",
          "tiktok",
          "pinterest",
          "amazon",
          "shopify",
          "facebook",
          "youtube",
          "website",
        ]),
      )
      .min(1),
    product_category: z.string().optional(),
    brand_dna_summary: z.string().optional(),
  }),
  outputSchema: z.object({
    shoot_type: z.string(),
    rationale: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
  execute: async (context) => {
    const { channels } = context;
    const scores: Record<string, number> = {};
    for (const [type, matchChannels] of Object.entries(SHOOT_TYPE_RULES)) {
      scores[type] = channels.filter((c) => matchChannels.includes(c)).length;
    }
    const shoot_type =
      Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      "ecommerce_pdp";
    const matchCount = scores[shoot_type] ?? 0;
    const confidence: "high" | "medium" | "low" =
      matchCount >= 2 ? "high" : matchCount === 1 ? "medium" : "low";
    return {
      shoot_type,
      rationale: `Best match for channels [${channels.join(", ")}] based on channel-type affinity matrix.`,
      confidence,
    };
  },
});
