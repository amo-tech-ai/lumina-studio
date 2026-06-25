import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const SHOOT_TYPE_RULES: Record<string, string[]> = {
  ecommerce_pdp: ["shopify", "amazon", "website"],
  editorial: ["instagram_feed", "pinterest", "facebook"],
  ugc_style: ["instagram_reel", "tiktok"],
  lookbook: ["instagram_feed", "pinterest", "instagram_story"],
  campaign: ["instagram_feed", "instagram_reel", "facebook", "youtube"],
  packshot: ["shopify", "amazon"],
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
    const { channels, brief = "", product_category = "", brand_dna_summary = "" } = context;
    const contextText = `${brief} ${product_category} ${brand_dna_summary}`.toLowerCase();

    // Brief/brand keyword boosters per shoot type
    const BRIEF_BOOSTERS: Record<string, string[]> = {
      ecommerce_pdp: ["pdp", "product detail", "listing", "ecommerce", "e-commerce"],
      editorial: ["editorial", "story", "magazine", "fashion", "lifestyle"],
      ugc_style: ["ugc", "user generated", "authentic", "organic", "creator"],
      lookbook: ["lookbook", "collection", "seasonal", "catalog"],
      campaign: ["campaign", "brand awareness", "hero", "launch"],
      packshot: ["packshot", "pack shot", "packaging", "white background", "white bg"],
    };

    const scores: Record<string, number> = {};
    for (const [type, matchChannels] of Object.entries(SHOOT_TYPE_RULES)) {
      scores[type] = channels.filter((c) => matchChannels.includes(c)).length;
      // Add 1 for each keyword hit in brief/brand context
      const boosters = BRIEF_BOOSTERS[type] ?? [];
      if (boosters.some((kw) => contextText.includes(kw))) scores[type] += 1;
    }
    const shoot_type =
      Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      "ecommerce_pdp";
    const matchCount = scores[shoot_type] ?? 0;
    const confidence: "high" | "medium" | "low" =
      matchCount >= 2 ? "high" : matchCount === 1 ? "medium" : "low";
    return {
      shoot_type,
      rationale: `Best match for channels [${channels.join(", ")}]${brief ? ` and brief context` : ""} based on channel-type affinity and brand context.`,
      confidence,
    };
  },
});
