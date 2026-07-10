import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/error-envelope";
import { isNonTerminalDealStage, moveDealStage } from "@/lib/crm/move-deal-stage";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

/** Non-terminal-only stage PATCH for the Deal Detail stage selector
 *  (IPI-396). Delegates to lib/crm/move-deal-stage.ts — the same function
 *  the crm-assistant Mastra tool calls — rather than re-implementing the
 *  allow-list, per IPI-365's own "do not duplicate" note. Won/lost is
 *  rejected here before touching Supabase (defense-in-depth on top of the
 *  IPI-362 DB trigger, not a replacement for it); the real HITL gate is
 *  the separate `/api/crm/deals/[id]/convert` route IPI-367 owns. */
export async function PATCH(req: NextRequest, context: RouteContext) {
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

  const stage = (body as { stage?: unknown })?.stage;
  if (typeof stage !== "string" || !isNonTerminalDealStage(stage)) {
    return apiErrorResponse(
      "VALIDATION_ERROR",
      400,
      "stage must be one of lead, qualified, proposal, negotiation. Won/Lost require the approval flow (IPI-367).",
    );
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

  const result = await moveDealStage({ dealId: id, orgId, stage }, supabase);
  if (!result.ok) {
    return apiErrorResponse(result.code, result.status, result.message);
  }

  return NextResponse.json({ ok: true, dealId: result.dealId, stage: result.stage }, { status: 200 });
}
