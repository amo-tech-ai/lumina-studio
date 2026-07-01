import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { buildPanelData } from "@/lib/intelligence/build-panel-data";
import { buildThumbUrl } from "@/lib/intelligence/build-thumb-url";
import { generateSuggestions } from "@/lib/intelligence/generate-suggestions";
import { parseBrandScore } from "@/lib/brand-scores";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const brandId = new URL(request.url).searchParams.get("brandId");
  if (brandId && !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
  }

  const svc = await createSupabaseServerClient();

  const pendingQuery = svc
    .from("brands")
    .select("id, name, intake_status")
    .eq("intake_status", "draft_ready")
    .order("name");

  if (brandId) {
    const [brandResult, scoresResult, pendingResult, assetsResult] = await Promise.all([
      svc
        .from("brands")
        .select("id, name, intake_status")
        .eq("id", brandId)
        .single(),
      svc
        .from("brand_scores")
        .select("score_type, score")
        .eq("brand_id", brandId)
        .eq("is_latest", true),
      pendingQuery,
      svc
        .from("assets")
        .select("id, cloudinary_public_id, status, created_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (brandResult.error) {
      const status = brandResult.error.code === "PGRST116" ? 404 : 500;
      if (status === 500) {
        console.error("[intelligence/panel] brand query failed:", brandResult.error.message);
      }
      return NextResponse.json(
        { error: status === 404 ? "Brand not found" : "Internal error" },
        { status },
      );
    }

    if (scoresResult.error) {
      console.error("[intelligence/panel] scores query failed:", scoresResult.error.message);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    if (pendingResult.error) {
      console.error("[intelligence/panel] pending query failed:", pendingResult.error.message);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    if (assetsResult.error) {
      console.error("[intelligence/panel] assets query failed:", assetsResult.error.message);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    const scoreRows = (scoresResult.data ?? []).map((row) => ({
      score_type: row.score_type,
      score: row.score,
    }));

    const scoreMap: Record<string, number> = {};
    for (const row of scoreRows) {
      const score = parseBrandScore(row.score);
      if (score != null) scoreMap[row.score_type] = score;
    }

    const assets = (assetsResult.data ?? []).map((a) => {
      const thumb = a.cloudinary_public_id ? buildThumbUrl(a.cloudinary_public_id) : null;
      return {
        id: a.id,
        url: thumb ?? "",
        thumbnail_url: thumb,
        asset_type: "image" as const,
        width: null,
        height: null,
        created_at: a.created_at ?? new Date().toISOString(),
      };
    });

    const suggestions = generateSuggestions(scoreMap);

    const panelData = buildPanelData(brandResult.data, scoreRows, pendingResult.data ?? []);
    return NextResponse.json({ ...panelData, assets, suggestions });
  }

  const { data, error } = await pendingQuery;
  if (error) {
    console.error("[intelligence/panel] portfolio pending query failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json(buildPanelData(null, null, data ?? []));
}
