import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const CHANNEL_DEFAULTS: Record<string, { format: string; quantity: number }[]> =
  {
    instagram_feed: [{ format: "1:1 JPG", quantity: 10 }],
    instagram_story: [{ format: "9:16 JPG", quantity: 8 }],
    instagram_reel: [{ format: "9:16 MP4 :15s", quantity: 5 }],
    tiktok: [{ format: "9:16 MP4 :30s", quantity: 5 }],
    pinterest: [{ format: "2:3 JPG", quantity: 6 }],
    amazon: [
      { format: "1:1 JPG white-bg", quantity: 8 },
      { format: "lifestyle JPG", quantity: 4 },
    ],
    shopify: [
      { format: "1:1 JPG white-bg", quantity: 6 },
      { format: "lifestyle JPG", quantity: 4 },
    ],
    facebook: [{ format: "4:5 JPG", quantity: 5 }],
    youtube: [{ format: "16:9 MP4 :60s", quantity: 2 }],
    website: [
      { format: "16:9 JPG hero", quantity: 3 },
      { format: "1:1 JPG card", quantity: 6 },
    ],
  };

const DeliverableSchema = z.object({
  channel: z.string(),
  format: z.string(),
  quantity: z.number().int().positive(),
});

export const planDeliverables = createTool({
  id: "planDeliverables",
  description:
    "Generate a deliverables plan (counts per format) from target channels and optional brand DNA context.",
  inputSchema: z.object({
    channels: z
      .array(z.enum(["instagram_feed", "instagram_story", "instagram_reel", "tiktok", "pinterest", "amazon", "shopify", "facebook", "youtube", "website"]))
      .min(1),
    brand_dna: z
      .object({
        product_category: z.string().optional(),
        style_keywords: z.array(z.string()).optional(),
      })
      .optional(),
    shoot_type: z.string().optional(),
  }),
  outputSchema: z.object({
    deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
  }),
  execute: async (context) => {
    const { channels, brand_dna, shoot_type } = context;
    // Quantity multiplier: packshot/ecommerce shoots get +2 per format for white-bg channels
    const isPackshot = shoot_type === "packshot" || shoot_type === "ecommerce_pdp";
    const isVideoHeavy = brand_dna?.style_keywords?.some((k) => /video|motion|reel/i.test(k));
    const deliverables = channels.flatMap((channel) => {
      const defaults = CHANNEL_DEFAULTS[channel];
      return defaults.map((d) => ({
        channel,
        ...d,
        quantity:
          isPackshot && d.format.includes("white-bg")
            ? d.quantity + 2
            : isVideoHeavy && d.format.includes("MP4")
              ? d.quantity + 1
              : d.quantity,
      }));
    });
    return {
      deliverables,
      total_assets: deliverables.reduce((sum, d) => sum + d.quantity, 0),
    };
  },
});
