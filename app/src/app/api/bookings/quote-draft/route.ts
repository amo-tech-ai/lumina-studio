export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import { buildQuoteDraft } from "@/mastra/tools/booking-tools";
import { isIsoDate, isValidDateRange, isRateQuoted } from "@/lib/booking/validation";

const RATE_TIERS = new Set(["$", "$$", "$$$"]);

// Thin server-side wrapper around the exact pure function the booking agent's
// draftBookingQuote tool calls (booking-tools.ts) — same draft, reachable from
// a "Generate draft" button so the wizard doesn't need a live LLM round-trip
// for this deterministic step. The already-mounted CopilotKit chat dock (agentId
// "booking", route-agent-map.ts) remains available for free-form refinement.
export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    return apiErrorResponse("INTERNAL_ERROR", 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Invalid JSON body.");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  if (typeof b.displayName !== "string" || !b.displayName.trim()) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "displayName is required.");
  }
  if (!isIsoDate(b.dateStart) || !isIsoDate(b.dateEnd)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "dateStart/dateEnd must be valid YYYY-MM-DD dates.");
  }
  if (!isValidDateRange(b.dateStart as string, b.dateEnd as string)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "dateEnd must be on or after dateStart.");
  }
  if (b.rateQuoted !== undefined && b.rateQuoted !== null && !isRateQuoted(b.rateQuoted)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "rateQuoted must be a number between 0 and 999999.99.");
  }

  if (typeof b.rateTier === "string" && !RATE_TIERS.has(b.rateTier)) {
    return apiErrorResponse("VALIDATION_ERROR", 400, "rateTier must be one of: $, $$, $$$.");
  }
  const rateTier = typeof b.rateTier === "string" ? (b.rateTier as "$" | "$$" | "$$$") : undefined;

  try {
    const draft = buildQuoteDraft({
      displayName: b.displayName,
      dateStart: b.dateStart as string,
      dateEnd: b.dateEnd as string,
      rateTier,
      shootType: typeof b.shootType === "string" ? b.shootType : undefined,
      rateQuoted: typeof b.rateQuoted === "number" ? b.rateQuoted : undefined,
    });
    return NextResponse.json(draft, { status: 200 });
  } catch (error) {
    return apiErrorResponse("VALIDATION_ERROR", 400, error instanceof Error ? error.message : "Invalid input.");
  }
}
