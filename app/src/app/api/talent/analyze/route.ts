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

function instagramHandle(url: string): string {
  if (!url.includes("instagram.com")) return "@unknown";
  const segment = url.split("/").filter(Boolean).pop();
  return `@${segment ?? "unknown"}`;
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

  // TODO: Replace mock fields with Gemini/Mastra analysis in a follow-up.
  const fields: AnalyzedField[] = [
    {
      key: "name",
      label: "Full name",
      value: name,
      confidence: 96,
      evidence: "Matched from Instagram bio & tagged professional posts.",
    },
    {
      key: "handle",
      label: "Handle",
      value: instagramHandle(url),
      confidence: 99,
      evidence: "Read directly from the connected Instagram profile.",
    },
    {
      key: "niche",
      label: "Niche",
      value: "Running · Athlete lifestyle",
      confidence: 92,
      evidence: "Top content themes across 128 posts: running (61%), lifestyle (24%), wellness (15%).",
    },
    {
      key: "tier",
      label: "Tier",
      value: "Micro · 42.0K followers",
      confidence: 88,
      evidence: "Follower count 42,013 places you in the Micro tier (10K–100K).",
    },
    {
      key: "loc",
      label: "Location",
      value: "London, UK",
      confidence: 84,
      evidence: "Inferred from post geotags (72% Greater London) and bio.",
    },
    {
      key: "rate",
      label: "Suggested day rate",
      value: "£1,200",
      confidence: 71,
      evidence: "Benchmarked against Micro-tier running creators with 4%+ engagement. Please confirm.",
    },
    {
      key: "bio",
      label: "Short bio",
      value: "Marathoner and running coach sharing authentic training content and race-day energy.",
      confidence: 79,
      evidence: "Summarised from bio + 40 most-engaged captions.",
    },
  ];

  return NextResponse.json({ success: true, fields });
}
