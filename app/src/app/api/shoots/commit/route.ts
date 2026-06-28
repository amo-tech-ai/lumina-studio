// POST /api/shoots/commit
// IPI-150 SHOOT-AI-003 — Gate 3 commit path (server-side, replaces direct edge fn call).
// Writes to shoot.* tables via service role. No browser INSERT ever touches shoot.* directly.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Deliverable = { channel: string; format?: string; quantity: number };
type Shot = { shot_number: number; description: string; angle?: string; lighting?: string };

const VALID_CHANNELS = new Set([
  "instagram_feed", "instagram_story", "instagram_reel",
  "tiktok", "tiktok_video", "pinterest", "amazon", "shopify",
  "facebook", "youtube", "website",
]);

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  let operator: Awaited<ReturnType<typeof withOperatorAuth>>;
  try {
    operator = await withOperatorAuth(req);
  } catch (e) {
    if (e instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  let body: {
    brand_id: string;
    shoot_name: string;
    brief?: string;
    channels?: string[];
    deliverables: Deliverable[];
    shots: Shot[];
    approved_budget: number;
    budget_breakdown?: Record<string, number>;
    run_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { brand_id, shoot_name, brief, channels, deliverables, shots, approved_budget, budget_breakdown, run_id } = body;

  if (!brand_id || !shoot_name || !deliverables?.length || !shots?.length || !approved_budget) {
    return NextResponse.json(
      { error: "brand_id, shoot_name, deliverables, shots, and approved_budget are required" },
      { status: 400 },
    );
  }

  // Verify operator has access to this brand (RLS enforces org membership)
  const userSb = await createSupabaseServerClient();
  const { error: brandErr } = await userSb.from("brands").select("id").eq("id", brand_id).single();
  if (brandErr) return NextResponse.json({ error: "Brand not found or access denied" }, { status: 403 });

  const svc = serviceClient();

  const safeChannels = (channels ?? []).filter((c) => VALID_CHANNELS.has(c));
  const safeDeliverables = deliverables.filter((d) => VALID_CHANNELS.has(d.channel));

  // 1. Insert shoot
  const { data: shoot, error: shootErr } = await svc
    .schema("shoot")
    .from("shoots")
    .insert({
      brand_id,
      name: shoot_name,
      type: "studio_ecommerce",
      brief: brief ?? null,
      target_channels: safeChannels,
      estimated_budget: approved_budget,
      budget_breakdown: budget_breakdown ?? null,
      created_by: operator.id,
      status: "planning",
    })
    .select("id")
    .single();

  if (shootErr || !shoot?.id) {
    console.error("[commit] shoot insert:", shootErr);
    return NextResponse.json({ error: shootErr?.message ?? "Failed to create shoot" }, { status: 500 });
  }
  const shoot_id: string = shoot.id;

  // 2. Insert deliverables
  if (safeDeliverables.length > 0) {
    const { error: delivErr } = await svc.schema("shoot").from("shoot_deliverables").insert(
      safeDeliverables.map((d) => ({
        shoot_id,
        channel: d.channel,
        format: d.format ?? null,
        quantity: d.quantity,
        origin: "ai_approved",
      })),
    );
    if (delivErr) {
      console.error("[commit] deliverables insert:", delivErr);
      await svc.schema("shoot").from("shoots").delete().eq("id", shoot_id);
      return NextResponse.json({ error: delivErr.message ?? "Failed to save deliverables" }, { status: 500 });
    }
  }

  // 3. Insert shot list
  const { error: shotErr } = await svc.schema("shoot").from("shot_list").insert(
    shots.map((s) => ({
      shoot_id,
      description: s.description,
      style_notes: [s.angle, s.lighting].filter(Boolean).join(" | ") || null,
      order: s.shot_number,
      origin: "ai_approved",
      status: "pending",
    })),
  );
  if (shotErr) {
    console.error("[commit] shot_list insert:", shotErr);
    await svc.schema("shoot").from("shoots").delete().eq("id", shoot_id);
    return NextResponse.json({ error: shotErr.message ?? "Failed to save shot list" }, { status: 500 });
  }

  // 4. Audit log (non-fatal)
  try {
    await svc.from("agent_logs").insert({
      agent_name: "shoot-wizard",
      user_id: operator.id,
      brand_id,
      input: { run_id: run_id ?? null, shoot_name, channels: safeChannels },
      output: { shoot_id, deliverable_count: safeDeliverables.length, shot_count: shots.length, approved_budget },
    });
  } catch (e) {
    console.error("[commit] audit log (non-fatal):", e);
  }

  return NextResponse.json({ shoot_id }, { status: 201 });
}
