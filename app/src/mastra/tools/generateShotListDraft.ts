import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  buildShotListFromReferences,
  type ReferenceShotType,
} from "@/lib/shoot/shot-list-from-references";

const ApprovedDeliverableSchema = z.object({
  id: z.string().uuid().optional(),
  channel: z.string(),
  format: z.string().optional(),
  quantity: z.number().int().positive(),
});

const ReferenceShotTypeSchema = z.object({
  id: z.string(),
  angle: z.string(),
  description: z.string(),
  channel_fit: z.array(z.string()),
  background: z.string().nullable().optional(),
});

const ShotSchema = z.object({
  shot_number: z.number(),
  description: z.string(),
  angle: z.string(),
  lighting: z.string(),
  deliverable_ids: z.array(z.string()),
  notes: z.string().optional(),
  reference_id: z.string(),
});

export const generateShotListDraft = createTool({
  id: "generateShotListDraft",
  description:
    "Generate a shot list draft from operator-approved deliverables and lookupShotReferences rows. " +
    "Requires approved deliverables (HITL gate 1) and reference_shot_types from lookupShotReferences — " +
    "never invent angle names.",
  inputSchema: z.object({
    approved_deliverables: z
      .array(ApprovedDeliverableSchema)
      .min(1, "At least one approved deliverable is required before generating a shot list"),
    reference_shot_types: z
      .array(ReferenceShotTypeSchema)
      .min(
        1,
        "reference_shot_types is required — call lookupShotReferences first and pass its shot_types",
      ),
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
    const { approved_deliverables, reference_shot_types, product_names = [] } = context;

    const { shots, uncovered_deliverable_warnings } = buildShotListFromReferences(
      approved_deliverables,
      reference_shot_types as ReferenceShotType[],
      product_names,
    );

    return {
      shots,
      total_shots: shots.length,
      uncovered_deliverable_warnings,
    };
  },
});
