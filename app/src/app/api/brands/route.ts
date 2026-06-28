// IPI-218 — List brands for operator brand switcher
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
  const svc = await createSupabaseServerClient();
  const { data, error } = await svc
    .from("brands")
    .select("id, name, intake_status")
    .order("name");
  if (error) {
    console.error("[brands] list query failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  // Map intake_status → status so the frontend Brand interface stays stable
  return NextResponse.json((data ?? []).map((b) => ({ id: b.id, name: b.name, status: b.intake_status })));
}
