export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse, serviceFailureResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBookingRequest, listBookings } from "@/lib/booking/booking-service";
import { parseCreateBookingBody, parseListBookingsQuery } from "@/lib/booking/validation";

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

  const parsed = parseCreateBookingBody(body);
  if (!parsed.ok) {
    return serviceFailureResponse(parsed);
  }

  const userSb = await createSupabaseServerClient();
  const result = await createBookingRequest(userSb, parsed.data);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function GET(req: NextRequest) {
  try {
    await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    return apiErrorResponse("INTERNAL_ERROR", 500);
  }

  const parsed = parseListBookingsQuery(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return serviceFailureResponse(parsed);
  }

  const userSb = await createSupabaseServerClient();
  const result = await listBookings(userSb, parsed.data);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
