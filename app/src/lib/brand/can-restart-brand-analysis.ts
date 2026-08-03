import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * IPI-918 · ONB2-INT-001e — display gate for the Brand Hub "Restart analysis"
 * control. Mirrors the rule POST /api/brands/[id]/restart-analysis enforces
 * server-side (restart-failed-analysis.ts → assertCanRestart): org brands need
 * editor+, personal brands need the creator. This only decides whether an
 * operator is shown a button that would work — the route remains the authority,
 * so a viewer who forges the request still gets 403.
 */
export async function canRestartBrandAnalysis(
  supabase: SupabaseClient,
  actorId: string,
  brand: { org_id: string | null; user_id: string | null },
): Promise<boolean> {
  if (!brand.org_id) return brand.user_id != null && brand.user_id === actorId;

  const { data, error } = await supabase.rpc("is_org_editor_or_above", {
    p_org_id: brand.org_id,
  });
  if (error) {
    console.error("[can-restart-brand-analysis] role check failed", {
      code: error.code,
    });
    return false;
  }
  return data === true;
}
