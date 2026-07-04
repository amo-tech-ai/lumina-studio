export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markNotificationsRead } from "@/lib/notifications/notification-service";
import { parseMarkReadBody } from "@/lib/notifications/validation";

function serviceFailureResponse(result: {
  status: number;
  code: Parameters<typeof apiErrorResponse>[0];
  message: string;
  details?: Record<string, unknown>;
}) {
  return apiErrorResponse(result.code, result.status, result.message, result.details);
}

export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    throw e;
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
