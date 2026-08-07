// IPI-924 · AGENT-RAG-001 — GET /api/brands/[id]/similar
// Org-scoped "Find similar brands" caller for the public.search_brands RPC.
// The RPC is service_role-only (security definer, EXECUTE revoked from public/anon/
// authenticated), so the UI must go through this route — the browser client cannot
// call it directly. Auth: withOperatorAuth (401 when auth enforced + cookie/Bearer
// invalid; dev-unauthenticated sentinel passes through when auth disabled).
// Embedding is fetched server-side here — never send raw vectors to the client.
//
// Response shapes:
//   200 { data: SimilarBrand[] }            — results or [] when no similar brands
//   200 { data: [], reason: "no_embedding" } — brand has no embedding yet (0/5832 live)
//   400 / 401 / 404 / 500 — error envelope { error: { code, message } }

import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { apiErrorBody } from "@/lib/api/error-envelope";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json(apiErrorBody("UNAUTHORIZED"), { status: 401 });
    }
    throw e;
  }

  const { id: brandId } = await params;
  if (!UUID_RE.test(brandId)) {
    return NextResponse.json(
      apiErrorBody("VALIDATION_ERROR", "brandId must be a valid UUID."),
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[brands/similar] admin client unavailable:", e);
    return NextResponse.json(apiErrorBody("INTERNAL_ERROR"), { status: 500 });
  }

  // Brand row read via service role — RLS bypassed here, gated by withOperatorAuth
  // above. Only embedding + org_id are read; raw vector never leaves the server.
  const { data: brand, error: brandError } = await admin
    .from("brands")
    .select("embedding, org_id")
    .eq("id", brandId)
    .maybeSingle();

  if (brandError) {
    console.error("[brands/similar] brand lookup failed:", brandError.message);
    return NextResponse.json(apiErrorBody("INTERNAL_ERROR"), { status: 500 });
  }
  if (!brand) {
    return NextResponse.json(apiErrorBody("NOT_FOUND"), { status: 404 });
  }
  if (!brand.embedding || !brand.org_id) {
    // Realistic steady state today — embedding pipeline has not populated any rows.
    return NextResponse.json({ data: [], reason: "no_embedding" });
  }

  const { data, error } = await admin.rpc("search_brands", {
    p_embedding: brand.embedding,
    p_org_id: brand.org_id,
    p_limit: limit,
    p_exclude_brand_id: brandId,
  });

  if (error) {
    console.error("[brands/similar] search_brands failed:", error.message);
    return NextResponse.json(apiErrorBody("INTERNAL_ERROR"), { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
