import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

type SimilarBrandRow = {
  brand_id: string;
  brand_name: string;
  shared_nodes: unknown;
  similarity: number;
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    await withOperatorAuth(request);
  } catch (error) {
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }

  const { id } = await params;

  // Read the source brand through the operator-scoped client so RLS proves the
  // caller may access this brand before the service-role RPC is used.
  const operator = await createOperatorSupabaseClient(request);
  const { data: brand, error: brandError } = await operator
    .from("brands")
    .select("id, embedding, org_id")
    .eq("id", id)
    .maybeSingle();

  if (brandError) {
    console.error("[brand/similar] source brand lookup failed:", brandError.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!brand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!brand.embedding) {
    return NextResponse.json({ similar: [], notice: "no-embeddings" });
  }

  if (!brand.org_id) {
    console.error("[brand/similar] source brand has no org_id:", brand.id);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    console.error("[brand/similar] admin client unavailable:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const { data, error } = await admin.rpc("search_brands", {
    p_embedding: brand.embedding,
    p_org_id: brand.org_id,
    p_exclude_brand_id: brand.id,
    p_limit: 6,
  });

  if (error) {
    console.error("[brand/similar] search_brands failed:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ similar: (data ?? []) as SimilarBrandRow[] });
}
