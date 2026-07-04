export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse, serviceFailureResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBooking, transitionBooking } from "@/lib/booking/booking-service";
import { parseBookingIdParam, parseTransitionBody } from "@/lib/booking/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await withOperatorAuth(_req);
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
  const result = await getBooking(userSb, parsedId.id);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Invalid JSON body.");
  }

  const parsed = parseTransitionBody(body);
  if (!parsed.ok) {
    return serviceFailureResponse(parsed);
  }

  const userSb = await createSupabaseServerClient();
  const result = await transitionBooking(userSb, parsedId.id, parsed.data);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
