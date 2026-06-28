import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import {
  commitShootDraft,
  createUserScopedClient,
  type CommitShootDraftInput,
} from "@/lib/shoot/commit-shoot-draft";

export const saveApprovedShootDraft = createTool({
  id: "saveApprovedShootDraft",
  description:
    "Persist an approved shoot draft after HITL operator approval. Never call before operator confirms.",
  inputSchema: z.object({
    brand_id: z.string().uuid(),
    shoot_type: z.string(),
    brief: z.string(),
    deliverables: z
      .array(
        z.object({
          channel: z.string(),
          format: z.string().optional(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    estimated_budget_usd: z.number().positive().optional(),
    shots: z
      .array(
        z.object({
          shot_number: z.number().int().positive(),
          description: z.string().min(1),
          angle: z.string().optional(),
          lighting: z.string().optional(),
        }),
      )
      .min(1)
      .optional(),
    access_token: z.string().describe("Operator JWT for auth"),
  }),
  outputSchema: z.object({
    shoot_id: z.string().uuid(),
    status: z.string(),
  }),
  execute: async (context) => {
    const { access_token, shoot_type, estimated_budget_usd, shots, ...rest } = context;
    if (!access_token?.trim()) {
      throw new Error("access_token is required to commit an approved shoot draft");
    }

    const userSb = createUserScopedClient(access_token.trim());
    const {
      data: { user },
      error: userErr,
    } = await userSb.auth.getUser();
    if (userErr || !user) {
      throw new Error("Invalid or expired access_token");
    }

    const channels = rest.deliverables.map((d) => d.channel);
    const approved_budget =
      estimated_budget_usd ??
      rest.deliverables.reduce((sum, d) => sum + d.quantity * 500, 0);

    const input: CommitShootDraftInput = {
      brand_id: rest.brand_id,
      shoot_name: shoot_type,
      brief: rest.brief,
      channels,
      deliverables: rest.deliverables,
      shots:
        shots ??
        [
          {
            shot_number: 1,
            description: rest.brief.trim() || `${shoot_type} approved hero shot`,
          },
        ],
      approved_budget,
    };

    const result = await commitShootDraft({
      input,
      operatorId: user.id,
      userSb,
      serviceSb: createSupabaseAdminClient(),
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    return { shoot_id: result.shoot_id, status: "planning" };
  },
});
