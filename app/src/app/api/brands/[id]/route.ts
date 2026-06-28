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
    svc.from("brands").select("id, name, status, profile").eq("id", id).single(),
    svc
      .from("brand_scores")
      .select("scores, confidence, draft_status")
      .eq("brand_id", id)
      .eq("draft_status", "approved")
      .maybeSingle(),
  ]);

  if (brandResult.error) {
    const status = brandResult.error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: brandResult.error.message }, { status });
  }

  if (scoresResult.error) {
    return NextResponse.json({ error: scoresResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    brand: brandResult.data,
    scores: scoresResult.data ?? null,
  });
}
