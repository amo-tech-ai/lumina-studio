// IPI-308 · MODEL-P2 — Resolve the operator's current org id for org-scoped
// features (Talent shortlist). MVP: one org per user, first membership wins —
// same assumption get_or_create_shortlist's RPC makes server-side.
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let user;
  try {
    user = await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
  const svc = await createSupabaseServerClient();
  const { data, error } = await svc
    .from("org_members")
    .select("org_id, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[org/current] query failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No organization" }, { status: 404 });
  }
  const orgName = Array.isArray(data.organizations)
    ? data.organizations[0]?.name ?? null
    : (data.organizations as { name: string } | null)?.name ?? null;
  return NextResponse.json({ orgId: data.org_id, orgName });
}
