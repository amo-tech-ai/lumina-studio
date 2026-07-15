import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiErrorCode } from "@/lib/api/error-envelope";
import type { Database } from "@/types/supabase";

// Type-level regression guard (IPI-587): ConvertDealResult.brand_id must stay
// nullable. Included in tsc --noEmit (not excluded like *.test.ts).
type _AssertBrandIdNullable = Database["public"]["Functions"]["crm_convert_deal"]["Returns"][number]["brand_id"];
const _assertBrandIdNullable: _AssertBrandIdNullable = null;

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

/** The only function allowed to call `crm_convert_deal` — the DB RPC (IPI-367
 *  migration `20260712084425_crm_deals_convert_rpc.sql`, hardened by
 *  `20260712100000_crm_deals_convert_hardening.sql`) that sets
 *  `crm_deals.stage = won/lost` and, on won, creates or links a `brands` row.
 *  Authorization is enforced inside the RPC itself (`is_org_editor_or_above`
 *  as of the hardening migration — not `is_org_member`, which admits
 *  role='viewer'), not re-checked here — this function is a thin
 *  error-mapping wrapper, the same shape as `moveDealStage` in
 *  `move-deal-stage.ts`. */
export async function convertDeal(
  { dealId, decision }: { dealId: string; decision: ConvertDecision },
  client: Db,
): Promise<ConvertDealResult> {
  const { data, error } = await client
    .rpc("crm_convert_deal", { p_deal_id: dealId, p_decision: decision })
    .single();

  if (error) {
    const message = error.message ?? "";
    if (message.includes("deal not found")) {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." };
    }
    // Matches both "caller must be an org editor or owner" (authorization)
    // and "company ... not found in org ..." (cross-org data integrity,
    // added by the hardening migration) — both are the caller-not-permitted
    // shape, not an unexpected server failure. Kept as two narrow substrings
    // rather than one broad one so a genuinely new/unrelated exception text
    // doesn't silently get mapped to 403.
    if (message.includes("not found in org")) {
      // Unlike a routine permission denial, this signals crm_deals.company_id
      // pointing at a company in a different org — a data-integrity anomaly,
      // not just an unauthorized caller. Logged so it doesn't vanish behind
      // an ordinary-looking 403 (the exact class of silent failure the
      // hardening migration's own audit trail was written to catch).
      console.error("[crm/convert-deal] rejected cross-org company:", message);
      return { ok: false, status: 403, code: "FORBIDDEN", message: "You do not have access to this deal." };
    }
    if (message.includes("editor or owner")) {
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
