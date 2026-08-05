// IPI-951 · CLD-SIGN-001 — Consolidate Cloudinary Signing Endpoints into Unified Service
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";
import {
  signCloudinaryUpload,
  type ServerSignRequest,
} from "@/lib/cloudinary/unified-sign-service";
import { type WorkType } from "@/lib/cloudinary/taxonomy";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UploadSignBody = {
  brandId?: string;
  resourceType?: string;
  filename?: string;
  workType?: string;
  workId?: string;
  context?: { shootId?: string; campaignId?: string };
  notificationUrl?: string;
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
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = parsed as UploadSignBody;

  const { brandId, resourceType, filename, workType: rawWorkType, workId: rawWorkId, context, notificationUrl } = body;
  
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }
  if (!resourceType) {
    return NextResponse.json({ error: "resourceType is required" }, { status: 400 });
  }
  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  let workType: WorkType | undefined;
  if (rawWorkType !== undefined && rawWorkType !== null) {
    workType = rawWorkType as WorkType;
  }

  let workId: string | undefined;
  if (rawWorkId !== undefined && rawWorkId !== null) {
    if (typeof rawWorkId !== "string" || !UUID_RE.test(rawWorkId)) {
      return NextResponse.json({ error: "Invalid workId" }, { status: 400 });
    }
    workId = rawWorkId;
  }

  const supabase = await createOperatorSupabaseClient(request);
  const requestPayload: ServerSignRequest = {
    mode: "server",
    brandId,
    resourceType,
    filename,
    workType,
    workId,
    context,
    notificationUrl,
  };

  const result = await signCloudinaryUpload(requestPayload, supabase, operator.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
