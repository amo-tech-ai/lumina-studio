// IPI-218 — Brand detail + DNA scores for right context panel
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const [brandResult, scoresResult] = await Promise.all([
    svc.from("brands").select("id, name, intake_status, ai_profile").eq("id", id).single(),
    // brand_scores: one row per score_type — aggregate into Record<string, number>
    svc.from("brand_scores").select("score_type, score").eq("brand_id", id),
  ]);

  if (brandResult.error) {
    const status = brandResult.error.code === "PGRST116" ? 404 : 500;
    if (status === 500) console.error("[brands/id] brand query failed:", brandResult.error.message);
    return NextResponse.json(
      { error: status === 404 ? "Brand not found" : "Internal error" },
      { status },
    );
  }

  if (scoresResult.error) {
    console.error("[brands/id] scores query failed:", scoresResult.error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const b = brandResult.data;
  const scoreRows = scoresResult.data ?? [];
  const scoresMap: Record<string, number> = {};
  for (const row of scoreRows) {
    scoresMap[row.score_type] = Number(row.score);
  }

  return NextResponse.json({
    // Map DB column names to stable frontend contract
    brand: { id: b.id, name: b.name, status: b.intake_status, profile: b.ai_profile },
    scores: scoreRows.length > 0 ? { scores: scoresMap, confidence: null } : null,
  });
}
