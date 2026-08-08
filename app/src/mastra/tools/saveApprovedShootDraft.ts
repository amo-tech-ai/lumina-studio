import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import {
  commitShootDraft,
  createUserScopedClient,
  SHOOT_CHANNEL_VALUES,
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
          channel: z.enum(SHOOT_CHANNEL_VALUES),
          format: z.string().optional(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    estimated_budget_usd: z
      .number()
      .positive("Operator must approve budget (HITL gate 3) before commit"),
    shots: z
      .array(
        z.object({
          shot_number: z.number().int().positive(),
          description: z.string().min(1),
          angle: z.string().min(1),
          lighting: z.string().optional(),
        }),
      )
      .min(1, "Operator must approve shot list (HITL gate 2) before commit"),
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

    const input: CommitShootDraftInput = {
      brand_id: rest.brand_id,
      shoot_name: shoot_type,
      brief: rest.brief,
      channels,
      deliverables: rest.deliverables,
      shots,
      approved_budget: estimated_budget_usd,
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
