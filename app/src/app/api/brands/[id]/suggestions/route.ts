// IPI-285 — AI-generated brand suggestions
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { generateSuggestions } from "@/lib/intelligence/generate-suggestions";
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
  const { data: scores, error } = await svc
    .from("brand_scores")
    .select("score_type, score")
    .eq("brand_id", id)
    .eq("is_latest", true);

  if (error) {
    console.error("[brands/id/suggestions] scores query failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const scoreMap: Record<string, number | null> = {};
  scores?.forEach((row) => {
    scoreMap[row.score_type] = row.score;
  });

  return NextResponse.json({ suggestions: generateSuggestions(scoreMap) });
}
