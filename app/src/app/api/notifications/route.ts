export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuthOrResponse } from "@/lib/operator-gate";
import { serviceFailureResponse } from "@/lib/api/error-envelope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/notifications/notification-service";
import { parseListNotificationsQuery } from "@/lib/notifications/validation";

export async function GET(req: NextRequest) {
  const authError = await withOperatorAuthOrResponse(req);
  if (authError) {
    return authError;
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
