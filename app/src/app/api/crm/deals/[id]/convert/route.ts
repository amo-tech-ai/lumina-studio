import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/error-envelope";
import { convertDeal, type ConvertDecision } from "@/lib/crm/convert-deal";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DECISIONS = new Set<ConvertDecision>(["won", "lost"]);

type RouteContext = { params: Promise<{ id: string }> };

/** The only route allowed to set `crm_deals.stage = won/lost` (IPI-367). Wraps
 *  `crm_convert_deal`, the Postgres RPC that satisfies the `app.crm_convert`
 *  session-flag check `crm_deals_guard_terminal_stage()` requires and, on
 *  `won`, creates or links a `brands` row. Auth follows the same
 *  `createSupabaseServerClient` + `getUser` + `getCurrentOrgId` pattern as the
 *  sibling non-terminal `stage` route, not `withOperatorAuth` (that helper has
 *  a dev-auth-disabled bypass — wrong fit for the one irreversible,
 *  brand-creating write in this module). Org scoping itself is re-derived and
 *  re-checked inside the RPC from the deal row — this route's own
 *  `getCurrentOrgId` call is for the 403 short-circuit, not the source of
 *  truth. */
export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Invalid deal id.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Invalid JSON body.");
  }

  const decision = (body as { decision?: unknown })?.decision;
  if (typeof decision !== "string" || !DECISIONS.has(decision as ConvertDecision)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "decision must be won or lost.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiErrorResponse("UNAUTHORIZED", 401);
  }

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) {
    return apiErrorResponse("FORBIDDEN", 403, "No organization membership for this operator.");
  }

  const result = await convertDeal({ dealId: id, decision: decision as ConvertDecision }, supabase);
  if (!result.ok) {
    return apiErrorResponse(result.code, result.status, result.message);
  }

  return NextResponse.json(
    { ok: true, dealId: result.dealId, stage: result.stage, brandId: result.brandId },
    { status: 200 },
  );
}
