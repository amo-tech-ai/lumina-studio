// IPI-285 — AI-generated brand suggestions
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Suggestion = {
  id: string;
  type: "action" | "insight" | "warning";
  title: string;
  description: string;
  action?: { label: string; href: string };
  confidence: number;
};

function generateSuggestions(scores: Record<string, number | null>): Suggestion[] {
  const suggestions: Suggestion[] = [];
  let id = 0;

  const visual = scores.visual ?? 0;
  const commerce = scores.commerce_readiness ?? 0;
  const consistency = scores.consistency ?? 0;

  if (visual < 70) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "warning",
      title: "Visual inconsistency detected",
      description: "Audit logo and color usage across brand assets",
      action: { label: "Review assets →", href: "/app/assets" },
      confidence: 0.85,
    });
  }

  if (commerce < 70) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "action",
      title: "Commerce readiness low",
      description: "Add product shots to improve score",
      action: { label: "Plan shoot →", href: "/app/shoots/new" },
      confidence: 0.6,
    });
  }

  if (consistency >= 85) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "insight",
      title: "High consistency score",
      description: "Use as reference for new brands",
      confidence: 0.9,
    });
  }

  return suggestions.slice(0, 5);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
  const { data: scores } = await svc
    .from("brand_scores")
    .select("score_type, score")
    .eq("brand_id", id)
    .eq("is_latest", true);

  const scoreMap: Record<string, number | null> = {};
  scores?.forEach((row) => {
    scoreMap[row.score_type] = row.score;
  });

  const suggestions = generateSuggestions(scoreMap);
  return NextResponse.json({ suggestions });
}
