// IPI-219 — Latest 6 brand assets for the right context panel
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cloudinaryPresetUrl } from "@/lib/cloudinary/url";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildThumbUrl(publicId: string): string {
  return cloudinaryPresetUrl(publicId, "asset-tile");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
  }

  const svc = await createSupabaseServerClient();

  const [rowsResult, countResult] = await Promise.all([
    svc
      .from("assets")
      .select("id, cloudinary_public_id, status, dna_status")
      .eq("brand_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
    svc
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", id),
  ]);

  if (rowsResult.error) {
    console.error("[brands/id/assets] rows query failed:", rowsResult.error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (countResult.error) {
    console.error("[brands/id/assets] count query failed:", countResult.error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const assets = (rowsResult.data ?? []).map((row) => ({
    id: row.id,
    cloudinary_public_id: row.cloudinary_public_id ?? null,
    thumb_url: row.cloudinary_public_id ? buildThumbUrl(row.cloudinary_public_id) : null,
    status: row.status,
    dna_status: row.dna_status ?? null,
  }));

  return NextResponse.json({ assets, total: countResult.count ?? 0 });
}
