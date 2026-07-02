import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { buildPanelData } from "@/lib/intelligence/build-panel-data";
import { buildPortfolioPanelData } from "@/lib/intelligence/build-portfolio-panel-data";
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
        .select("id, name, intake_status, ai_profile")
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

    return NextResponse.json(
      buildPanelData(brandResult.data, scoreRows, pendingResult.data ?? []),
    );
  }

  const [pendingResult, brandsResult] = await Promise.all([
    pendingQuery,
    svc.from("brands").select("id, name, intake_status").order("name"),
  ]);

  if (pendingResult.error) {
    console.error("[intelligence/panel] portfolio pending query failed:", pendingResult.error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (brandsResult.error) {
    console.error("[intelligence/panel] portfolio brands query failed:", brandsResult.error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const brands = brandsResult.data ?? [];
  const brandIds = brands.map((b) => b.id);
  const data = pendingResult.data;

  let scoreRows: Array<{ brand_id: string; score_type: string; score: number }> = [];
  if (brandIds.length) {
    const scoresResult = await svc
      .from("brand_scores")
      .select("brand_id, score_type, score")
      .in("brand_id", brandIds);

    if (scoresResult.error) {
      console.error("[intelligence/panel] portfolio scores query failed:", scoresResult.error.message);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    scoreRows = scoresResult.data ?? [];
  }

  return NextResponse.json(
    buildPortfolioPanelData(brands, scoreRows, data ?? []),
  );
}
