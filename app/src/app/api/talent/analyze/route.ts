import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const runtime = "nodejs";

interface AnalyzeRequest {
  name: string;
  url: string;
}

interface AnalyzedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  evidence: string;
}

interface AnalyzeResponse {
  success: boolean;
  fields: AnalyzedField[];
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: "Name and URL are required" },
        { status: 400 }
      );
    }

    // TODO: Integrate actual AI analysis (Gemini/Mastra)
    // For now, return mock data matching the HTML example
    const fields: AnalyzedField[] = [
      {
        key: 'name',
        label: 'Full name',
        value: name,
        confidence: 96,
        evidence: 'Matched from Instagram bio & tagged professional posts.'
      },
      {
        key: 'handle',
        label: 'Handle',
        value: url.includes('instagram.com') ? `@${url.split('/').pop()}` : '@unknown',
        confidence: 99,
        evidence: 'Read directly from the connected Instagram profile.'
      },
      {
        key: 'niche',
        label: 'Niche',
        value: 'Running · Athlete lifestyle',
        confidence: 92,
        evidence: 'Top content themes across 128 posts: running (61%), lifestyle (24%), wellness (15%).'
      },
      {
        key: 'tier',
        label: 'Tier',
        value: 'Micro · 42.0K followers',
        confidence: 88,
        evidence: 'Follower count 42,013 places you in the Micro tier (10K–100K).'
      },
      {
        key: 'loc',
        label: 'Location',
        value: 'London, UK',
        confidence: 84,
        evidence: 'Inferred from post geotags (72% Greater London) and bio.'
      },
      {
        key: 'rate',
        label: 'Suggested day rate',
        value: '£1,200',
        confidence: 71,
        evidence: 'Benchmarked against Micro-tier running creators with 4%+ engagement. Please confirm.'
      },
      {
        key: 'bio',
        label: 'Short bio',
        value: 'Marathoner and running coach sharing authentic training content and race-day energy.',
        confidence: 79,
        evidence: 'Summarised from bio + 40 most-engaged captions.'
      },
    ];

    return NextResponse.json({ success: true, fields });
  } catch (error) {
    console.error("Talent analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze profile" },
      { status: 500 }
    );
  }
}
