import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const STUDIO_RATES: Record<string, number> = {
  rental: 1200,
  owned: 0,
  location: 800,
  outdoor: 200,
};

const CREW_DAY_RATE = 650;
const POST_PER_ASSET = 45;

export const estimateShootBudget = createTool({
  id: "estimateShootBudget",
  description:
    "Generate a line-item budget estimate for a shoot. All figures are estimates pending operator HITL approval.",
  inputSchema: z.object({
    crew_count: z.number().int().min(1),
    studio_type: z.enum(["rental", "owned", "location", "outdoor"]),
    shot_count: z.number().int().min(1),
    shoot_days: z.number().int().min(1).default(1),
    total_assets: z.number().int().min(1).optional(),
  }),
  outputSchema: z.object({
    crew: z.number(),
    studio: z.number(),
    equipment: z.number(),
    post: z.number(),
    total: z.number(),
    currency: z.literal("USD"),
    disclaimer: z.string(),
  }),
  execute: async (context) => {
    const { crew_count, studio_type, shot_count, shoot_days = 1, total_assets } = context;
    const crew = crew_count * CREW_DAY_RATE * shoot_days;
    const studio = (STUDIO_RATES[studio_type] ?? 800) * shoot_days;
    const equipment = Math.round(crew_count * 180 * shoot_days);
    const assets = total_assets ?? shot_count * 3;
    const post = assets * POST_PER_ASSET;
    const total = crew + studio + equipment + post;
    return {
      crew,
      studio,
      equipment,
      post,
      total,
      currency: "USD" as const,
      disclaimer:
        "Estimate only — subject to HITL approval before commit. Rates vary by market.",
    };
  },
});
