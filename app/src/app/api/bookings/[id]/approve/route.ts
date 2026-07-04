export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse, serviceFailureResponse } from "@/lib/api/error-envelope";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveBooking } from "@/lib/booking/booking-service";
import { parseBookingIdParam } from "@/lib/booking/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    throw e;
  }

  const { id } = await context.params;
  const parsedId = parseBookingIdParam(id);
  if (!parsedId.ok) {
    return serviceFailureResponse(parsedId);
  }

  let userSb;
  try {
    userSb = await createSupabaseServerClient();
  } catch {
    return apiErrorResponse("INTERNAL_ERROR", 500);
  }

  let serviceSb;
  try {
    serviceSb = createSupabaseAdminClient();
  } catch {
    return apiErrorResponse("INTERNAL_ERROR", 500);
  }

  const result = await approveBooking(userSb, serviceSb, parsedId.id);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
