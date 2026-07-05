import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { crmToolError, getCrmUserClient, NON_TERMINAL_DEAL_STAGES } from "./_shared";

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
  execute: async ({ dealId, stage }) => {
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);
      const { data, error } = await ctx.client
        .from("crm_deals")
        .update({ stage })
        .eq("id", dealId)
        .eq("org_id", ctx.orgId)
        .select("id, stage")
        .single();
      if (error) return crmToolError(error.message);
      return { ok: true, dealId: data.id, stage: data.stage };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
