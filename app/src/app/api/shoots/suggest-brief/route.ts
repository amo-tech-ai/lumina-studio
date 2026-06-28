export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestShootBriefTool } from "@/mastra/tools/suggestShootBrief";

const BodySchema = z.object({
  brandId: z.string().uuid().optional(),
  channels: z.array(z.string()),
  shootName: z.string().min(1, "shootName is required"),
  briefSeed: z.string().optional(),
  tone: z.string().optional(),
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
    if (brandId) {
      const sb = await createSupabaseServerClient();
      const { error } = await sb.from("brands").select("id").eq("id", brandId).single();
      if (error) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const result = await suggestShootBriefTool.execute!({ brandId, channels, shootName, briefSeed, tone }, {} as never) as { brief: string } | undefined;
    if (!result) throw new Error("Tool returned no result");
    return NextResponse.json({ brief: result.brief });
  } catch (err) {
    if (err instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[suggest-brief]", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
