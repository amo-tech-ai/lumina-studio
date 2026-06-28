// POST /api/shoots/commit
// IPI-228 — Gate 3 commit path via commit_shoot_draft RPC (service_role).
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { commitShootDraft, parseCommitShootDraftBody } from "@/lib/shoot/commit-shoot-draft";

export async function POST(req: NextRequest) {
  let operator;
  try {
    operator = await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCommitShootDraftBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const userSb = await createSupabaseServerClient();
  const result = await commitShootDraft({
    input: parsed.data,
    operatorId: operator.id,
    userSb,
    serviceSb: createSupabaseAdminClient(),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ shoot_id: result.shoot_id }, { status: 201 });
}
