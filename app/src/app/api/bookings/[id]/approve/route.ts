export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { approveBooking } from "@/lib/booking/booking-service";
import { parseBookingIdParam } from "@/lib/booking/validation";

type RouteContext = { params: Promise<{ id: string }> };

function serviceFailureResponse(result: {
  status: number;
  code: Parameters<typeof apiErrorResponse>[0];
  message: string;
  details?: Record<string, unknown>;
}) {
  return apiErrorResponse(result.code, result.status, result.message, result.details);
}

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

  const userSb = await createSupabaseServerClient();
  const result = await approveBooking(userSb, createSupabaseAdminClient(), parsedId.id);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
