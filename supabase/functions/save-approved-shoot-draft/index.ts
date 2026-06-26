/**
 * save-approved-shoot-draft
 *
 * IPI-150 SHOOT-AI-003 — Gate 3 commit path.
 *
 * Called after the operator approves budget in the shoot wizard.
 * Writes to durable shoot.* tables via service-role client (bypasses RLS).
 * No browser INSERT ever touches shoot.* directly.
 *
 * Body:
 *   brand_id        string
 *   shoot_name      string
 *   brief           string
 *   channels        string[]        — shoot.channel enum values
 *   deliverables    Deliverable[]   — { channel, format, quantity }
 *   shots           Shot[]          — { shot_number, description, angle, lighting, deliverable_ids }
 *   approved_budget number          — final budget (override or estimate)
 *   budget_breakdown { crew, studio, equipment, post, total }
 *   run_id          string          — Mastra workflow run_id (audit)
 *
 * Returns: { shoot_id }
 */

import { corsHeaders } from "../_shared/cors.ts";
import { resolveAuth, isAuthFailure } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { insertAgentLog } from "../_shared/agent-log.ts";
import { errorResponse } from "../_shared/response.ts";

const VALID_CHANNELS = new Set([
  "instagram_feed", "instagram_story", "instagram_reel",
  "tiktok", "pinterest", "amazon", "shopify",
  "facebook", "youtube", "website",
]);

type Deliverable = { channel: string; format: string; quantity: number };
type Shot = {
  shot_number: number;
  description: string;
  angle?: string;
  lighting?: string;
  deliverable_ids?: string[];
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await resolveAuth(req, { required: true });
  if (isAuthFailure(auth)) return auth.response;

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
    return errorResponse("invalid_json", "Request body must be JSON", 400);
  }

  const { brand_id, shoot_name, brief, channels, deliverables, shots, approved_budget, budget_breakdown, run_id } = body;

  if (!brand_id || !shoot_name || !deliverables?.length || !shots?.length) {
    return errorResponse("missing_fields", "brand_id, shoot_name, deliverables, and shots are required", 400);
  }

  const svc = createServiceClient();

  // -- Validate channel values (filter unknowns rather than reject — defensive)
  const safeChannels = (channels ?? []).filter((c) => VALID_CHANNELS.has(c));
  const safeDeliverables = deliverables.filter((d) => VALID_CHANNELS.has(d.channel));

  // -- 1. Insert shoot record
  const { data: shoot, error: shootErr } = await svc
    .schema("shoot")
    .from("shoots")
    .insert({
      brand_id,
      name: shoot_name,
      type: "studio_ecommerce", // ponytail: default type; wizard step for type selection is IPI-87
      brief: brief ?? null,
      target_channels: safeChannels,
      estimated_budget: approved_budget,
      budget_breakdown: budget_breakdown ?? null,
      created_by: auth.user.id,
      status: "planning",
    })
    .select("id")
    .single();

  if (shootErr || !shoot?.id) {
    console.error("shoot insert error", shootErr);
    return errorResponse("db_error", shootErr?.message ?? "Failed to create shoot", 500);
  }
  const shoot_id: string = shoot.id;

  // -- 2. Insert deliverables
  if (safeDeliverables.length > 0) {
    const { error: delivErr } = await svc.schema("shoot").from("shoot_deliverables").insert(
      safeDeliverables.map((d) => ({
        shoot_id,
        channel: d.channel,
        format: d.format || null,
        quantity: d.quantity,
        origin: "ai_approved",
      })),
    );
    if (delivErr) {
      console.error("deliverables insert error", delivErr);
      // Non-fatal: shoot is created; log and continue
    }
  }

  // -- 3. Insert shot list
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
    console.error("shot_list insert error", shotErr);
    // Non-fatal: continue
  }

  // -- 4. Audit log
  try {
    await insertAgentLog(svc, {
      agentName: "shoot-wizard",
      userId: auth.user.id,
      brandId: brand_id,
      input: { run_id: run_id ?? null, shoot_name, channels: safeChannels },
      output: { shoot_id, deliverable_count: safeDeliverables.length, shot_count: shots.length, approved_budget },
    });
  } catch (e) {
    console.error("audit log error (non-fatal)", e);
  }

  return new Response(JSON.stringify({ shoot_id }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
