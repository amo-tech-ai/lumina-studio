import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { buildPanelData } from "@/lib/intelligence/build-panel-data";
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
    const [brandResult, scoresResult, pendingResult] = await Promise.all([
      svc
        .from("brands")
        .select("id, name, intake_status")
        .eq("id", brandId)
        .single(),
      svc.from("brand_scores").select("score_type, score").eq("brand_id", brandId),
      pendingQuery,
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

    const scoreRows = (scoresResult.data ?? []).map((row) => ({
      score_type: row.score_type,
      score: Number(row.score),
    }));

    const [assetsResult, suggestionsResult] = await Promise.all([
      svc
        .from("assets")
        .select("id, cloudinary_public_id, status")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(6),
      svc
        .from("brand_scores")
        .select("score_type, score")
        .eq("brand_id", brandId)
        .eq("is_latest", true),
    ]);

    const assets = (assetsResult.data ?? []).map((a) => ({
      id: a.id,
      url: a.cloudinary_public_id ?? "",
      thumbnail_url: a.cloudinary_public_id
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME ?? "demo"}/image/upload/c_thumb,w_120,h_120,g_auto/${a.cloudinary_public_id}`
        : null,
      asset_type: "image" as const,
      width: null,
      height: null,
      created_at: new Date().toISOString(),
    }));

    const scoreMap: Record<string, number> = {};
    suggestionsResult.data?.forEach((row) => {
      scoreMap[row.score_type] = Number(row.score);
    });

    const suggestions = [];
    if (scoreMap.visual && scoreMap.visual < 70) {
      suggestions.push({
        id: "s1",
        type: "warning" as const,
        title: "Visual inconsistency detected",
        description: "Audit logo usage across assets",
        action: { label: "Review assets →", href: "/app/assets" },
        confidence: 0.85,
      });
    }
    if (scoreMap.commerce_readiness && scoreMap.commerce_readiness < 70) {
      suggestions.push({
        id: "s2",
        type: "action" as const,
        title: "Commerce readiness low",
        description: "Add product shots",
        action: { label: "Plan shoot →", href: "/app/shoots/new" },
        confidence: 0.6,
      });
    }

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
