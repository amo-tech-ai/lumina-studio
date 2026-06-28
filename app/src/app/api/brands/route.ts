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
    .select("id, name, status")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
