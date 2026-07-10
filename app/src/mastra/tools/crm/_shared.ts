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

// Canonical home is app/src/lib/crm/move-deal-stage.ts — re-exported here so
// existing imports (`from "./_shared"`) keep working. Do not redefine.
export { NON_TERMINAL_DEAL_STAGES } from "@/lib/crm/move-deal-stage";

export async function verifyCrmAnchors(
  client: SupabaseClient,
  orgId: string,
  anchors: { companyId?: string; contactId?: string; dealId?: string },
): Promise<string | null> {
  if (anchors.companyId) {
    const { data } = await client
      .from("crm_companies")
      .select("id")
      .eq("id", anchors.companyId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) return "Company not found in your organization";
  }
  if (anchors.contactId) {
    const { data } = await client
      .from("crm_contacts")
      .select("id")
      .eq("id", anchors.contactId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) return "Contact not found in your organization";
  }
  if (anchors.dealId) {
    const { data } = await client
      .from("crm_deals")
      .select("id")
      .eq("id", anchors.dealId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!data) return "Deal not found in your organization";
  }
  return null;
}
