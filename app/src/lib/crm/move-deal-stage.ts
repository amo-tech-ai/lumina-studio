import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiErrorCode } from "@/lib/api/error-envelope";
import type { Database } from "@/types/supabase";

type Db = SupabaseClient<Database>;

/** The 4 stages a deal may move through without the IPI-367 HITL gate.
 *  Single source of truth for this allow-list — the crm-assistant Mastra
 *  tool (`mastra/tools/crm/move-deal-stage.ts`) and the operator-facing
 *  `PATCH /api/crm/deals/[id]/stage` route both call `moveDealStage` below
 *  rather than each re-implementing the write. IPI-365's own Phase-0 notes
 *  are explicit: "do not duplicate moveDealStage's allow-list logic in a
 *  second place." */
export const NON_TERMINAL_DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation"] as const;
export type NonTerminalDealStage = (typeof NON_TERMINAL_DEAL_STAGES)[number];

export function isNonTerminalDealStage(value: string): value is NonTerminalDealStage {
  return (NON_TERMINAL_DEAL_STAGES as readonly string[]).includes(value);
}

export type MoveDealStageFailure = {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
};
export type MoveDealStageResult =
  | { ok: true; dealId: string; stage: string }
  | MoveDealStageFailure;

/** Org-scoped, allow-list-guarded deal stage update. `stage` is typed to
 *  `NonTerminalDealStage` so a caller can't pass "won"/"lost" without an
 *  explicit cast — the DB's own `crm_deals_guard_terminal_stage()` trigger
 *  (IPI-362) is the real backstop, this is defense-in-depth matching the
 *  pattern already used across this codebase's other CRM writes. */
export async function moveDealStage(
  { dealId, orgId, stage }: { dealId: string; orgId: string; stage: NonTerminalDealStage },
  client: Db,
): Promise<MoveDealStageResult> {
  const { data, error } = await client
    .from("crm_deals")
    .update({ stage })
    .eq("id", dealId)
    .eq("org_id", orgId)
    .select("id, stage")
    .single();
  if (error) {
    // PGRST116 = no row matched id+org_id — stale/deleted/cross-org id, not a
    // server failure. Same idiom as api/brands/[id] and api/intelligence/panel.
    if (error.code === "PGRST116") {
      return { ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." };
    }
    // Never forward the raw PostgREST message to the client — it can include
    // schema/constraint/RLS details. Same shape as api/brands/[id]'s 500 path.
    console.error("[crm/move-deal-stage] update failed:", error.message);
    return { ok: false, status: 500, code: "INTERNAL_ERROR", message: "Failed to update deal stage." };
  }
  return { ok: true, dealId: data.id, stage: data.stage };
}
