import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { crmToolError, getCrmUserClient, verifyCrmAnchors } from "./_shared";

export const logActivity = createTool({
  id: "logActivity",
  description:
    "Log a CRM activity (note, call, email, meeting) against a company, contact, or deal. Requires at least one anchor id.",
  inputSchema: z.object({
    activityType: z.enum(["note", "call", "email", "meeting"]),
    body: z.string().min(1),
    companyId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
    dealId: z.string().uuid().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    activityId: z.string().uuid().optional(),
  }),
  execute: async ({ activityType, body, companyId, contactId, dealId }) => {
    if (!companyId && !contactId && !dealId) {
      return crmToolError("At least one of companyId, contactId, or dealId is required");
    }
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);
      const anchorError = await verifyCrmAnchors(ctx.client, ctx.orgId, {
        companyId,
        contactId,
        dealId,
      });
      if (anchorError) return crmToolError(anchorError);
      const { data, error } = await ctx.client
        .from("crm_activities")
        .insert({
          org_id: ctx.orgId,
          type: activityType,
          body,
          company_id: companyId ?? null,
          contact_id: contactId ?? null,
          deal_id: dealId ?? null,
          created_by: ctx.userId,
        })
        .select("id")
        .single();
      if (error) return crmToolError(error.message);
      return { ok: true, activityId: data.id };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
