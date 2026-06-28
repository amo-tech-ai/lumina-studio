export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestShootBriefTool, ALLOWED_TONES } from "@/mastra/tools/suggestShootBrief";

const BodySchema = z.object({
  brandId: z.string().uuid().optional(),
  channels: z.array(z.string()),
  shootName: z.string().min(1, "shootName is required"),
  briefSeed: z.string().max(8000).optional(),
  tone: z.enum(ALLOWED_TONES).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const { brandId, channels, shootName, briefSeed, tone } = parsed.data;

    // If a brandId is supplied, verify the authenticated user can see it (RLS enforced)
    // and fetch the profile here so the tool never does its own tenant lookup.
    let brandContext: string | undefined;
    if (brandId) {
      const sb = await createSupabaseServerClient();
      const { data, error } = await sb
        .from("brands")
        .select("name, brand_url, ai_profile")
        .eq("id", brandId)
        .single();
      if (error) {
        // PGRST116 = no rows (brand not found / RLS denied)
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }
        throw new Error(`Brand lookup failed: ${error.message}`);
      }
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

    const result = await suggestShootBriefTool.execute!({ brandContext, channels, shootName, briefSeed, tone }, {} as never) as { brief: string } | undefined;
    if (!result) throw new Error("Tool returned no result");
    return NextResponse.json({ brief: result.brief });
  } catch (err) {
    if (err instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[suggest-brief]", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
