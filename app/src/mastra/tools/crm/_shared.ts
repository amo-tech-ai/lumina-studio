import type { SupabaseClient } from "@supabase/supabase-js";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { requestToken } from "@/lib/request-token";

export function crmToolError(message: string) {
  return { ok: false as const, error: message };
}

type CrmUserContext =
  | { client: null; error: string }
  | { client: SupabaseClient; orgId: string; userId: string };

export async function getCrmUserClient(): Promise<CrmUserContext> {
  const accessToken = requestToken.getStore();
  if (!accessToken) return { client: null, error: "Access token not available in request context" };
  const client = createUserScopedClient(accessToken);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { client: null, error: "Could not resolve operator identity" };
  const orgId = await getCurrentOrgId(user.id, client);
  if (!orgId) return { client: null, error: "No organization membership for this operator" };
  return { client, orgId, userId: user.id };
}

export const NON_TERMINAL_DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation"] as const;
