import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiErrorCode } from "@/lib/api/error-envelope";
import type { Database } from "@/types/supabase";

type Db = SupabaseClient<Database>;

export type ConvertDecision = "won" | "lost";

export type ConvertDealFailure = {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
};
export type ConvertDealResult =
  | { ok: true; dealId: string; stage: ConvertDecision; brandId: string | null }
  | ConvertDealFailure;

type CrmConvertDealRow = { deal_id: string; stage: string; brand_id: string | null };

/** The only function allowed to call `crm_convert_deal` — the DB RPC (IPI-367
 *  migration `20260712090000_crm_deals_convert_rpc.sql`) that sets
 *  `crm_deals.stage = won/lost` and, on won, creates or links a `brands` row.
 *  Org membership is enforced inside the RPC itself (`is_org_member`), not
 *  re-checked here — this function is a thin error-mapping wrapper, the same
 *  shape as `moveDealStage` in `move-deal-stage.ts`.
 *
 *  `.rpc("crm_convert_deal", ...)` is cast through an untyped client because
 *  `types/supabase.ts` hasn't been regenerated against this new function yet
 *  (regeneration requires the migration to be applied to the remote project
 *  first) — remove the cast once `npm run supabase:gen-types` (or MCP
 *  `generate_typescript_types`) picks it up. */
export async function convertDeal(
  { dealId, decision }: { dealId: string; decision: ConvertDecision },
  client: Db,
): Promise<ConvertDealResult> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .rpc("crm_convert_deal", { p_deal_id: dealId, p_decision: decision })
    .single<CrmConvertDealRow>();

  if (error) {
    const message = error.message ?? "";
    if (message.includes("deal not found")) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." };
    }
    if (message.includes("not a member")) {
      return { ok: false, status: 403, code: "FORBIDDEN", message: "You do not have access to this deal." };
    }
    if (message.includes("already terminal")) {
      return {
        ok: false,
        status: 409,
        code: "INVALID_TRANSITION",
        message: "This deal has already been marked won or lost.",
      };
    }
    // Never forward the raw Postgres message — same idiom as move-deal-stage.ts.
    console.error("[crm/convert-deal] rpc failed:", message);
    return { ok: false, status: 500, code: "INTERNAL_ERROR", message: "Failed to convert the deal." };
  }

  if (!data) {
    console.error("[crm/convert-deal] rpc returned no row");
    return { ok: false, status: 500, code: "INTERNAL_ERROR", message: "Failed to convert the deal." };
  }

  return { ok: true, dealId: data.deal_id, stage: data.stage as ConvertDecision, brandId: data.brand_id };
}
