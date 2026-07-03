import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBrandAssets } from "@/lib/shoot/get-brand-assets";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const brandId = searchParams.get("brand_id");
  const shootId = searchParams.get("shoot_id");

  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  if (shootId && !UUID_RE.test(shootId)) {
    return NextResponse.json({ error: "Invalid shoot_id" }, { status: 400 });
  }

  const userSb = await createSupabaseServerClient();
  const result = await getBrandAssets(userSb, brandId, shootId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ assets: result.data });
}
