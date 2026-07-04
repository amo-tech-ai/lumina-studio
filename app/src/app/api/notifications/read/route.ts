export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuthOrResponse } from "@/lib/operator-gate";
import { apiErrorResponse, serviceFailureResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markNotificationsRead } from "@/lib/notifications/notification-service";
import { parseMarkReadBody } from "@/lib/notifications/validation";

export async function POST(req: NextRequest) {
  const authError = await withOperatorAuthOrResponse(req);
  if (authError) {
    return authError;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse("VALIDATION_ERROR", 400, "Invalid JSON body.");
  }

  const parsed = parseMarkReadBody(body);
  if (!parsed.ok) {
    return serviceFailureResponse(parsed);
  }

  const userSb = await createSupabaseServerClient();
  const result = await markNotificationsRead(userSb, parsed.data);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
