import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const ApprovedDeliverableSchema = z.object({
  id: z.string().uuid().optional(),
  channel: z.string(),
  format: z.string().optional(),
  quantity: z.number().int().positive(),
});

const ShotSchema = z.object({
  shot_number: z.number(),
  description: z.string(),
  angle: z.string(),
  lighting: z.string(),
  deliverable_ids: z.array(z.string()),
  notes: z.string().optional(),
});

export const generateShotListDraft = createTool({
  id: "generateShotListDraft",
  description:
    "Generate a shot list draft derived from approved deliverables. Requires at least one approved deliverable (HITL gate).",
  inputSchema: z.object({
    // ponytail: min(1) is the HITL invariant — shot list cannot exist without approved deliverables
    approved_deliverables: z
      .array(ApprovedDeliverableSchema)
      .min(1, "At least one approved deliverable is required before generating a shot list"),
    shoot_type: z.string().optional(),
    brand_dna_summary: z.string().optional(),
    product_names: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    shots: z.array(ShotSchema),
    total_shots: z.number(),
    uncovered_deliverable_warnings: z.array(z.string()),
  }),
  execute: async (context) => {
    const { approved_deliverables, product_names = [] } = context;

    const coveredIds = new Set<string>();
    let shotCounter = 0;
    const shots = approved_deliverables.flatMap((deliverable, di) => {
      const id = deliverable.id ?? `deliverable-${di}`;
      coveredIds.add(id);
      // Generate shots proportional to quantity (1 shot per 2-3 assets)
      const shotCount = Math.max(1, Math.ceil(deliverable.quantity / 3));
      return Array.from({ length: shotCount }, (_, si) => ({
        shot_number: ++shotCounter,
        description: `${deliverable.channel} ${deliverable.format ?? ""} — ${product_names[0] ?? "hero product"}`,
        angle: si === 0 ? "front" : si === 1 ? "3/4 angle" : "detail",
        lighting: deliverable.channel.includes("feed") ? "natural window light" : "studio strobe",
        deliverable_ids: [id],
        notes: undefined,
      }));
    });

    // Flag any deliverable not mapped to a shot (shouldn't happen here, but defensive)
    const uncovered = approved_deliverables
      .filter((d, i) => !coveredIds.has(d.id ?? `deliverable-${i}`))
      .map((d) => `Deliverable ${d.channel}/${d.format} has no shots`);

    return {
      shots,
      total_shots: shots.length,
      uncovered_deliverable_warnings: uncovered,
    };
  },
});
