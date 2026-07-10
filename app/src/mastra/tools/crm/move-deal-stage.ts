import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { moveDealStage as moveDealStageForOperator, NON_TERMINAL_DEAL_STAGES } from "@/lib/crm/move-deal-stage";
import { crmToolError, getCrmUserClient } from "./_shared";

export const moveDealStage = createTool({
  id: "moveDealStage",
  description:
    "Move a CRM deal to a non-terminal pipeline stage (lead, qualified, proposal, negotiation). Cannot set won/lost — operator must use the HITL convert flow on the deal page (IPI-367).",
  inputSchema: z.object({
    dealId: z.string().uuid(),
    stage: z.enum(NON_TERMINAL_DEAL_STAGES),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    dealId: z.string().uuid().optional(),
    stage: z.string().optional(),
  }),
  // Delegates the actual write to lib/crm/move-deal-stage.ts — the same
  // function the PATCH /api/crm/deals/[id]/stage route calls (IPI-396),
  // so the allow-list + write logic lives in exactly one place.
  execute: async ({ dealId, stage }) => {
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);
      const result = await moveDealStageForOperator({ dealId, orgId: ctx.orgId, stage }, ctx.client);
      if (!result.ok) return crmToolError(result.message);
      return { ok: true, dealId: result.dealId, stage: result.stage };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
