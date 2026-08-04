// IPI-XXX — Unified Cloudinary signing endpoint (widget-provided params)
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";
import {
  signCloudinaryUpload,
  type WidgetSignRequest,
} from "@/lib/cloudinary/unified-sign-service";
import { type WorkType } from "@/lib/cloudinary/taxonomy";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SignBody = {
  paramsToSign?: unknown;
  workType?: unknown;
  workId?: unknown;
};

export async function POST(request: Request) {
  let operator;
  try {
    operator = await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as SignBody)
      : undefined;
  const paramsToSign = body?.paramsToSign;

  if (!paramsToSign || typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
    return NextResponse.json({ error: "paramsToSign is required" }, { status: 400 });
  }

  // Pass workType/workId directly to unified service for validation
  const supabase = await createOperatorSupabaseClient(request);
  const requestPayload: WidgetSignRequest = {
    mode: "widget",
    paramsToSign: paramsToSign as Record<string, unknown>,
    workType: body?.workType as WorkType | undefined,
    workId: body?.workId as string | undefined,
  };

  const result = await signCloudinaryUpload(requestPayload, supabase, operator.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
