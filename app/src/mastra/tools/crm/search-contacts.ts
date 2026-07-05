import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listContacts } from "@/lib/crm/queries";
import { crmToolError, getCrmUserClient } from "./_shared";

export const searchContacts = createTool({
  id: "searchContacts",
  description: "Search CRM contacts in the operator org by name, email, phone, company, or role.",
  inputSchema: z.object({
    search: z.string().optional(),
    companyId: z.string().uuid().optional(),
    role: z.string().optional(),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    error: z.string().optional(),
    contacts: z.array(z.record(z.unknown())).optional(),
  }),
  execute: async ({ search, companyId, role }) => {
    try {
      const ctx = await getCrmUserClient();
      if (!ctx.client) return crmToolError(ctx.error);
      const contacts = await listContacts(
        { orgId: ctx.orgId, search, companyId, role },
        ctx.client,
      );
      return { ok: true, contacts };
    } catch (e) {
      return crmToolError(e instanceof Error ? e.message : String(e));
    }
  },
});
