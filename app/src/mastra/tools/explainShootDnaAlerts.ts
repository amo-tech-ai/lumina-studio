import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const FLAG_EXPLANATIONS: Record<string, string> = {
  color_mismatch: "Asset colors deviate from brand palette — check primary/secondary color compliance",
  logo_placement: "Logo placement or clear space does not meet brand guidelines",
  typography: "Font usage inconsistent with brand typography standards",
  composition: "Composition does not align with brand shot framing guidelines",
  background: "Background color or texture conflicts with brand's visual identity",
  lighting: "Lighting style inconsistent with brand aesthetic (e.g., harsh vs. soft key)",
  skin_tone: "Skin tone rendering may require color grading adjustment per brand standards",
};

export const explainShootDnaAlerts = createTool({
  id: "explainShootDnaAlerts",
  description:
    "Explain why shoot assets were flagged by DNA scoring — surfaces actionable guidance per flagged asset.",
  inputSchema: z.object({
    shoot_id: z.string().uuid(),
    flagged_asset_ids: z.array(z.string().uuid()).min(1),
    dna_flags: z
      .record(
        z.string(),
        z.array(z.string()),
      )
      .optional()
      .describe("Map of asset_id → flag keys (from shoot_assets.dna_flags)"),
  }),
  outputSchema: z.object({
    explanations: z.array(
      z.object({
        asset_id: z.string(),
        flags: z.array(z.string()),
        guidance: z.array(z.string()),
        summary: z.string(),
      }),
    ),
  }),
  execute: async (context) => {
    const { flagged_asset_ids, dna_flags = {} } = context;
    const explanations = flagged_asset_ids.map((asset_id) => {
      const flags: string[] = dna_flags[asset_id] ?? ["composition"];
      const guidance = flags.map(
        (f) => FLAG_EXPLANATIONS[f] ?? `Review asset for ${f} compliance`,
      );
      return {
        asset_id,
        flags,
        guidance,
        summary: `Asset flagged for: ${flags.join(", ")}. ${guidance[0]}`,
      };
    });
    return { explanations };
  },
});
