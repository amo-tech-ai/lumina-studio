import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { resolveModel } from "@/mastra/models";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { brandId, channels, shootName } = await req.json() as {
      brandId?: string;
      channels: string[];
      shootName: string;
    };

    let brandContext = "";
    if (brandId) {
      const { data } = await adminClient()
        .from("brands")
        .select("name, brand_url, ai_profile")
        .eq("id", brandId)
        .single();
      if (data) {
        const profile = data.ai_profile as Record<string, unknown> | null;
        brandContext = [
          `Brand: ${data.name}`,
          data.brand_url ? `URL: ${data.brand_url}` : "",
          profile?.overview ? `Overview: ${profile.overview}` : "",
          profile?.tagline ? `Tagline: ${profile.tagline}` : "",
          profile?.targetAudience ? `Target audience: ${profile.targetAudience}` : "",
          profile?.brandVoice ? `Brand voice: ${profile.brandVoice}` : "",
          profile?.uvp ? `UVP: ${profile.uvp}` : "",
        ].filter(Boolean).join("\n");
      }
    }

    const channelList = channels.join(", ") || "unspecified channels";

    const { text } = await generateText({
      model: resolveModel(),
      prompt: `You are a creative director writing a shoot brief. Write a concise, inspiring shoot brief (3–5 sentences) for a photography/video shoot.

${brandContext ? `Brand context:\n${brandContext}\n` : ""}Shoot name: ${shootName}
Target channels: ${channelList}

Write the brief in first person from the brand's perspective. Focus on vision, tone, products/subject matter, and campaign goals. Be specific and actionable. Output only the brief text, no headings or labels.`,
      maxOutputTokens: 300,
    });

    return NextResponse.json({ brief: text.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate brief";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
