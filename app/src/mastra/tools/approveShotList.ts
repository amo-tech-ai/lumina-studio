import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callEdgeFunction } from "./edge";

const ShotRowSchema = z.object({
  shot_number: z.number().int().positive(),
  description: z.string(),
  angle: z.string().optional(),
  lighting: z.string().optional(),
  deliverable_ids: z.array(z.string()),
  notes: z.string().optional(),
});

export const approveShotList = createTool({
  id: "approveShotList",
  description:
    "Persist an approved shot list after operator HITL sign-off. Every shot must link to at least one deliverable.",
  inputSchema: z.object({
    shoot_id: z.string().uuid(),
    shots: z.array(ShotRowSchema).min(1),
    approved_by_user_id: z.string().uuid(),
    access_token: z.string().optional().describe("Operator JWT for auth"),
  }),
  outputSchema: z.object({
    shot_ids: z.array(z.string().uuid()),
    shoot_id: z.string().uuid(),
    status: z.string(),
  }),
  execute: async (context) => {
    const { access_token, ...payload } = context;
    // ponytail: write goes through edge fn only — no direct supabase.from() here
    const result = await callEdgeFunction<{
      shot_ids: string[];
      shoot_id: string;
      status: string;
    }>("approve-shot-list", payload, { accessToken: access_token });
    return result;
  },
});
