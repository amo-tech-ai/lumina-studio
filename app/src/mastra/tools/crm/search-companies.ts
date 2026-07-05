import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listCompanies } from "@/lib/crm/queries";
import { crmToolError, getCrmUserClient } from "./_shared";

export const searchCompanies = createTool({
  id: "searchCompanies",
  description: "Search CRM companies in the operator org by name, domain, status, owner, or industry.",
  inputSchema: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    owner: z.string().optional(),
    industry: z.string().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    companies: z.array(z.record(z.unknown())).optional(),
  }),
  execute: async ({ search, status, owner, industry }) => {
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);
      const companies = await listCompanies(
        { orgId: ctx.orgId, search, status, owner, industry },
        ctx.client,
      );
      return { ok: true, companies };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
