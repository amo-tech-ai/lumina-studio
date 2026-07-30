import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { scoreDealHealth } from "@/lib/crm/score-deal-health";
import { crmToolError, getCrmUserClient } from "./_shared";

/**
 * IPI-369 Phase A — on-demand scoring only (do not call from every panel open).
 * Pure formula in lib/crm/score-deal-health.ts — this tool only loads org-scoped rows.
 */
export const scoreDealHealthTool = createTool({
  id: "scoreDealHealth",
  description:
    "Score a CRM deal's health with a deterministic formula (no AI). Call explicitly when the operator asks about risk or health — do not recompute on every message. Use focus=at_risk to skip healthy deals.",
  inputSchema: z.object({
    dealId: z.string().uuid(),
    focus: z.enum(["all", "at_risk"]).optional().default("all"),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    score: z.number().optional(),
    reasons: z.array(z.string()).optional(),
    scoreVersion: z.string().optional(),
    asOf: z.string().optional(),
    evidenceIds: z.array(z.string()).optional(),
    matchesFocus: z.boolean().optional(),
  }),
  execute: async ({ dealId, focus }) => {
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);

      const { data: deal, error: dealErr } = await ctx.client
        .from("crm_deals")
        .select("id, company_id, stage, updated_at, expected_close_date, owner, value")
        .eq("id", dealId)
        .eq("org_id", ctx.orgId)
        .maybeSingle();

      if (dealErr) return crmToolError(dealErr.message);
      if (!deal) return crmToolError("Deal not found in your organization");

      // Load enough rows to compute last-touch (completed_at || created_at).
      // Order by created_at alone can miss an older task completed after many
      // newer creates — so we fetch a wider window and let the scorer pick max.
      const { data: activities, error: actErr } = await ctx.client
        .from("crm_activities")
        .select("id, created_at, completed_at")
        .eq("org_id", ctx.orgId)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (actErr) return crmToolError(actErr.message);

      const result = scoreDealHealth({
        deal: {
          id: deal.id,
          company_id: deal.company_id,
          stage: deal.stage,
          updated_at: deal.updated_at,
          expected_close_date: deal.expected_close_date,
          owner: deal.owner,
          value: deal.value === null || deal.value === undefined ? null : Number(deal.value),
        },
        activities: activities ?? [],
        focus,
      });

      return { ok: true, ...result };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
