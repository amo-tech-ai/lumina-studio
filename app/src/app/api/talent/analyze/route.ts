import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  evidence: string;
}

const MOCK_EVIDENCE = "Placeholder draft — not crawled. Live analysis is not wired yet.";
const MOCK_CONFIDENCE = 0;

export function instagramHandle(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "@unknown";
  }
  if (!parsed.hostname.includes("instagram.com")) return "@unknown";
  const segment = parsed.pathname.split("/").filter(Boolean)[0];
  return segment ? `@${segment}` : "@unknown";
}

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

  let body: { name?: unknown; url?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; url?: unknown };
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!name || !url) {
    return NextResponse.json(
      { success: false, error: "Name and URL are required" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ success: false, error: "URL must be a valid absolute URL" }, { status: 400 });
  }

  // ponytail: mock drafts only. Gemini/Mastra analysis is a follow-up.
  const fields: AnalyzedField[] = [
    { key: "name", label: "Full name", value: name, confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "handle", label: "Handle", value: instagramHandle(url), confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "niche", label: "Niche", value: "Running · Athlete lifestyle", confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "tier", label: "Tier", value: "Micro · 42.0K followers", confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "loc", label: "Location", value: "London, UK", confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "rate", label: "Suggested day rate", value: "£1,200", confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
    { key: "bio", label: "Short bio", value: "Marathoner and running coach sharing authentic training content and race-day energy.", confidence: MOCK_CONFIDENCE, evidence: MOCK_EVIDENCE },
  ];

  return NextResponse.json({ success: true, fields });
}
