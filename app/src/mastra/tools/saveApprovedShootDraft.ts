import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callEdgeFunction } from "./edge";

export const saveApprovedShootDraft = createTool({
  id: "saveApprovedShootDraft",
  description:
    "Persist an approved shoot draft after HITL operator approval. Never call before operator confirms.",
  inputSchema: z.object({
    brand_id: z.string().uuid(),
    shoot_type: z.string(),
    brief: z.string(),
    deliverables: z.array(
      z.object({
        channel: z.string(),
        format: z.string().optional(),
        quantity: z.number().int().positive(),
      }),
    ).min(1),
    estimated_budget_usd: z.number().positive().optional(),
    access_token: z.string().optional().describe("Operator JWT for auth"),
  }),
  outputSchema: z.object({
    shoot_id: z.string().uuid(),
    status: z.string(),
  }),
  execute: async (context) => {
    const { access_token, ...payload } = context;
    // ponytail: write goes through edge fn only — no direct supabase.from() here
    const result = await callEdgeFunction<{ shoot_id: string; status: string }>(
      "save-approved-shoot-draft",
      payload,
      { accessToken: access_token },
    );
    return result;
  },
});
