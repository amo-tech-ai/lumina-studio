// IPI-433 — poll Supabase mirror by immutable cloudinary_asset_id
import { NextResponse } from "next/server";
import { isBrandAccessible } from "@/lib/assets/brand-access";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSET_ID_RE = /^[a-f0-9]{32}$/i;

function normalizeMirrorStatus(raw: string | null): "ready" | "processing" | "failed" | "archived" {
  if (raw === "ready") return "ready";
  if (raw === "archived") return "archived";
  if (raw === "failed" || raw === "processing_failed") return "failed";
  return "processing";
}

export async function GET(request: Request) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const cloudinaryAssetId = searchParams.get("cloudinaryAssetId")?.trim() ?? "";

  if (!cloudinaryAssetId || !ASSET_ID_RE.test(cloudinaryAssetId)) {
    return NextResponse.json({ error: "cloudinaryAssetId is required" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[assets/status] admin client unavailable:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("cloudinary_assets")
    .select("status, version, public_id, cloudinary_asset_id, brand_id")
    .eq("cloudinary_asset_id", cloudinaryAssetId)
    .maybeSingle();

  if (error) {
    console.error("[assets/status] lookup failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.brand_id && !UUID_RE.test(data.brand_id)) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Org-aware access: RLS ca_select_via_brand joins assets→brands and can deny org
  // members or rows still linking. Mirror lookup is service-role; gate on brands RLS.
  if (data.brand_id) {
    const operator = await createOperatorSupabaseClient(request);
    const access = await isBrandAccessible(operator, data.brand_id);
    if (!access.ok) {
      if (access.status === 500) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: normalizeMirrorStatus(data.status),
    cloudinary_asset_id: data.cloudinary_asset_id,
    version: data.version,
    public_id: data.public_id,
  });
}
