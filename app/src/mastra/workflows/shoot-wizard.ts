/**
 * IPI-149 SHOOT-AI-002 — Shoot Wizard Workflow
 *
 * 3-gate HITL workflow: plan deliverables → approve → generate shot list → approve → estimate budget → approve → commit
 * File path is non-negotiable: shoot-wizard.ts (NOT shoot-production.ts)
 */
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { buildShotListFromReferences } from "@/lib/shoot/shot-list-from-references";
import { queryShotReferences } from "@/lib/shoot/query-shot-references";

const DeliverableSchema = z.object({
  id: z.string().optional(),
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
  reference_id: z.string(),
});

const BudgetSchema = z.object({
  crew: z.number(),
  studio: z.number(),
  equipment: z.number(),
  post: z.number(),
  total: z.number(),
});

const CHANNEL_DEFAULTS: Record<string, { format: string; quantity: number }[]> = {
  instagram_feed: [{ format: "1:1 JPG", quantity: 10 }],
  instagram_story: [{ format: "9:16 JPG", quantity: 8 }],
  instagram_reel: [{ format: "9:16 MP4 :15s", quantity: 5 }],
  tiktok: [{ format: "9:16 MP4 :30s", quantity: 5 }],
  pinterest: [{ format: "2:3 JPG", quantity: 6 }],
  amazon: [{ format: "1:1 JPG white-bg", quantity: 8 }, { format: "lifestyle JPG", quantity: 4 }],
  shopify: [{ format: "1:1 JPG white-bg", quantity: 6 }, { format: "lifestyle JPG", quantity: 4 }],
  facebook: [{ format: "4:5 JPG", quantity: 5 }],
  youtube: [{ format: "16:9 MP4 :60s", quantity: 2 }],
  website: [{ format: "16:9 JPG hero", quantity: 3 }, { format: "1:1 JPG card", quantity: 6 }],
};

// ── Gate 1: plan deliverables → operator approves ─────────────────────────────

const deliverableGateStep = createStep({
  id: "deliverable-gate",
  inputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
  }),
  suspendSchema: z.object({
    deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
    message: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    approved_deliverables: z.array(DeliverableSchema).min(1),
  }),
  outputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData?.approved) {
      const deliverables = inputData.channels.flatMap((ch) =>
        (CHANNEL_DEFAULTS[ch] ?? [{ format: "JPG", quantity: 6 }]).map((d, i) => ({
          id: `${ch}-${i}`,
          channel: ch,
          ...d,
        })),
      );
      const total_assets = deliverables.reduce((s, d) => s + d.quantity, 0);
      return await suspend({
        deliverables,
        total_assets,
        message: "Review and approve deliverables before the shot list is generated.",
      });
    }
    return {
      brand_id: inputData.brand_id,
      shoot_name: inputData.shoot_name,
      brief: inputData.brief,
      channels: inputData.channels,
      approved_deliverables: resumeData.approved_deliverables,
      total_assets: resumeData.approved_deliverables.reduce((s, d) => s + d.quantity, 0),
    };
  },
});

// ── Gate 2: generate shot list → operator approves ───────────────────────────

const shotListGateStep = createStep({
  id: "shot-list-gate",
  inputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
  }),
  suspendSchema: z.object({
    shots: z.array(ShotSchema),
    uncovered_warnings: z.array(z.string()),
    total_shots: z.number(),
    message: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    approved_shots: z.array(ShotSchema).min(1),
  }),
  outputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
    approved_shots: z.array(ShotSchema),
    total_shots: z.number(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData?.approved) {
      // ponytail: wizard input has no product category yet — clothing default for fashion shoots
      const referenceShotTypes = await queryShotReferences("clothing", inputData.channels);
      if (!referenceShotTypes.length) {
        throw new Error(
          "No shot references found for these channels — lookupShotReferences returned empty; cannot invent angles",
        );
      }
      const { shots, uncovered_deliverable_warnings } = buildShotListFromReferences(
        inputData.approved_deliverables,
        referenceShotTypes,
      );
      return await suspend({
        shots,
        uncovered_warnings: uncovered_deliverable_warnings,
        total_shots: shots.length,
        message:
          "Review shot list grounded in the reference library. Approve before budget — angles are from lookupShotReferences, not invented.",
      });
    }
    // Re-fetch trusted reference IDs and validate resumed shots against them.
    // The agent may have edited shots during the HITL review — we must reject
    // any reference_id that was not in the original lookupShotReferences call.
    const trustedReferences = await queryShotReferences("clothing", inputData.channels);
    const trustedIds = new Set(trustedReferences.map((r) => r.id));
    for (const shot of resumeData.approved_shots) {
      if (!trustedIds.has(shot.reference_id)) {
        throw new Error(
          `Invalid reference_id "${shot.reference_id}" in resumed shot ${shot.shot_number} — does not match lookupShotReferences`,
        );
      }
    }
    return {
      brand_id: inputData.brand_id,
      shoot_name: inputData.shoot_name,
      brief: inputData.brief,
      channels: inputData.channels,
      approved_deliverables: inputData.approved_deliverables,
      total_assets: inputData.total_assets,
      approved_shots: resumeData.approved_shots,
      total_shots: resumeData.approved_shots.length,
    };
  },
});

// ── Gate 3: estimate budget → operator approves → commit ─────────────────────

const budgetGateStep = createStep({
  id: "budget-gate",
  inputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    total_assets: z.number(),
    approved_shots: z.array(ShotSchema),
    total_shots: z.number(),
  }),
  suspendSchema: z.object({
    budget: BudgetSchema,
    total_shots: z.number(),
    total_assets: z.number(),
    message: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    budget_override_usd: z.number().optional(),
  }),
  outputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    approved_shots: z.array(ShotSchema),
    total_assets: z.number(),
    total_shots: z.number(),
    approved_budget_usd: z.number(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData?.approved) {
      const crew = Math.max(2, Math.ceil(inputData.total_shots / 8)) * 650;
      const post = inputData.total_assets * 45;
      const budget = {
        crew,
        studio: 800,
        equipment: Math.round(crew * 0.28),
        post,
        total: crew + 800 + Math.round(crew * 0.28) + post,
      };
      return await suspend({
        budget,
        total_shots: inputData.total_shots,
        total_assets: inputData.total_assets,
        message: "Approve budget to commit the shoot. No DB rows are written until you approve here.",
      });
    }
    return {
      brand_id: inputData.brand_id,
      shoot_name: inputData.shoot_name,
      brief: inputData.brief,
      channels: inputData.channels,
      approved_deliverables: inputData.approved_deliverables,
      approved_shots: inputData.approved_shots,
      total_assets: inputData.total_assets,
      total_shots: inputData.total_shots,
      // ponytail: recompute estimate on resume so override ?? estimate is never 0
      approved_budget_usd: resumeData.budget_override_usd ?? (() => {
        const crew = Math.max(2, Math.ceil(inputData.total_shots / 8)) * 650;
        const post = inputData.total_assets * 45;
        return crew + 800 + Math.round(crew * 0.28) + post;
      })(),
    };
  },
});

export const shootWizardWorkflow = createWorkflow({
  id: "shoot-wizard",
  inputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
  }),
  outputSchema: z.object({
    brand_id: z.string(),
    shoot_name: z.string(),
    brief: z.string(),
    channels: z.array(z.string()),
    approved_deliverables: z.array(DeliverableSchema),
    approved_shots: z.array(ShotSchema),
    total_assets: z.number(),
    total_shots: z.number(),
    approved_budget_usd: z.number(),
  }),
})
  .then(deliverableGateStep)
  .then(shotListGateStep)
  .then(budgetGateStep)
  .commit();
