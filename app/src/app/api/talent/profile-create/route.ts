import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toCreateTalentProfileRpcArgs, type AnalyzedPublishField } from "@/lib/talent/profile-creation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzedFieldBody = {
  key?: unknown;
  value?: unknown;
  confidence?: unknown;
  evidence?: unknown;
  status?: unknown;
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const analyzedFields = Array.isArray(body.analyzedFields) ? body.analyzedFields : [];

  if (!displayName || !sourceUrl || analyzedFields.length === 0) {
    return NextResponse.json(
      { success: false, error: "displayName, sourceUrl, and analyzedFields are required" },
      { status: 400 },
    );
  }

  const agencyOrgId = typeof body.agencyOrgId === "string" ? body.agencyOrgId : undefined;
  const parsedFields = analyzedFields.flatMap((field): AnalyzedFieldBody[] =>
    field && typeof field === "object" ? [field as AnalyzedFieldBody] : [],
  ).flatMap((field): AnalyzedPublishField[] => {
    if (typeof field.key !== "string" || typeof field.confidence !== "number") return [];
    if (field.status !== "approved" && field.status !== "edited") return [];
    return [{
      key: field.key,
      value: typeof field.value === "string" ? field.value : undefined,
      confidence: field.confidence,
      evidence: typeof field.evidence === "string" ? field.evidence : undefined,
      status: field.status === "edited" ? "edited" : "approved",
    }];
  });

  if (parsedFields.length === 0) {
    return NextResponse.json(
      { success: false, error: "analyzedFields must include approved or edited provenance" },
      { status: 400 },
    );
  }

  const args = toCreateTalentProfileRpcArgs({
    displayName,
    bio: typeof body.bio === "string" ? body.bio : undefined,
    handle: typeof body.handle === "string" ? body.handle : undefined,
    niche: typeof body.niche === "string" ? body.niche : undefined,
    location: typeof body.location === "string" ? body.location : undefined,
    dayRate: typeof body.dayRate === "string" ? body.dayRate : undefined,
    languages: Array.isArray(body.languages)
      ? body.languages.filter((item): item is string => typeof item === "string")
      : [],
    sourceUrl,
    agencyOrgId,
    analyzedFields: parsedFields,
  });

  const { data, error } = await supabase.rpc("create_talent_profile_with_sources", args);

  if (error || !data) {
    const message = error?.message ?? "Failed to create talent profile";
    const status = message.includes("already exists")
      ? 409
      : message.includes("role required") || message.includes("not an editor")
        ? 403
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }

  const row = data as {
    id: string;
    display_name: string;
    bio: string | null;
    verification_status: string;
    sources_inserted: number;
    created_at?: string;
  };

  return NextResponse.json({
    success: true,
    profile: {
      id: row.id,
      displayName: row.display_name,
      bio: row.bio,
      verificationStatus: row.verification_status,
      createdAt: row.created_at ?? new Date().toISOString(),
    },
    sourcesInserted: row.sources_inserted,
  });
}
