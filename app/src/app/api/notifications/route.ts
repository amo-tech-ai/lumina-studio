export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { apiErrorResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/notifications/notification-service";
import { parseListNotificationsQuery } from "@/lib/notifications/validation";

function serviceFailureResponse(result: {
  status: number;
  code: Parameters<typeof apiErrorResponse>[0];
  message: string;
  details?: Record<string, unknown>;
}) {
  return apiErrorResponse(result.code, result.status, result.message, result.details);
}

export async function GET(req: NextRequest) {
  try {
    await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return apiErrorResponse("UNAUTHORIZED", 401);
    }
    throw e;
  }

  const parsed = parseListNotificationsQuery(new URL(req.url).searchParams);
  if (!parsed.ok) {
    return serviceFailureResponse(parsed);
  }

  const userSb = await createSupabaseServerClient();
  const result = await listNotifications(userSb, parsed.data);
  if (!result.ok) {
    return serviceFailureResponse(result);
  }

  return NextResponse.json(result.data, { status: 200 });
}
