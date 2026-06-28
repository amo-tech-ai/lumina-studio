import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SHOOT_CHANNEL_VALUES = [
  "instagram_feed",
  "instagram_story",
  "instagram_reel",
  "tiktok",
  "pinterest",
  "amazon",
  "shopify",
  "facebook",
  "youtube",
  "website",
] as const;

export type ShootChannel = (typeof SHOOT_CHANNEL_VALUES)[number];

export const VALID_SHOOT_CHANNELS = new Set<string>(SHOOT_CHANNEL_VALUES);

export type CommitDeliverable = { channel: string; format?: string; quantity: number };
export type CommitShot = {
  shot_number: number;
  description: string;
  angle?: string;
  lighting?: string;
};

export type CommitShootDraftInput = {
  brand_id: string;
  shoot_name: string;
  brief?: string;
  channels?: string[];
  deliverables: CommitDeliverable[];
  shots: CommitShot[];
  approved_budget: number;
  budget_breakdown?: Record<string, number>;
  run_id?: string;
};

export type CommitShootDraftResult =
  | { ok: true; shoot_id: string }
  | { ok: false; status: 400 | 403 | 500; error: string };

const RPC_FAIL_MESSAGE = "Failed to commit shoot";

function validateCommitShootDraftInput(input: CommitShootDraftInput):
  | { ok: true; safeChannels: string[]; safeDeliverables: CommitDeliverable[] }
  | { ok: false; status: 400; error: string } {
  const { brand_id, shoot_name, deliverables, shots, approved_budget, channels } = input;

  if (
    typeof brand_id !== "string" ||
    typeof shoot_name !== "string" ||
    !Array.isArray(deliverables) ||
    !Array.isArray(shots) ||
    !deliverables.length ||
    !shots.length
  ) {
    return {
      ok: false,
      status: 400,
      error: "brand_id, shoot_name, deliverables, shots, and approved_budget are required",
    };
  }

  if (
    typeof approved_budget !== "number" ||
    !Number.isFinite(approved_budget) ||
    approved_budget <= 0
  ) {
    return {
      ok: false,
      status: 400,
      error: "approved_budget must be a positive number",
    };
  }

  const badDeliverable = deliverables.find(
    (d) =>
      !d ||
      typeof d.channel !== "string" ||
      !d.channel.trim() ||
      typeof d.quantity !== "number" ||
      !Number.isInteger(d.quantity) ||
      d.quantity < 1,
  );
  if (badDeliverable) {
    return {
      ok: false,
      status: 400,
      error: "Each deliverable must have a valid channel and a positive integer quantity",
    };
  }

  const badShot = shots.find(
    (s) =>
      !s ||
      !Number.isInteger(s.shot_number) ||
      s.shot_number < 1 ||
      typeof s.description !== "string" ||
      !s.description.trim(),
  );
  if (badShot) {
    return {
      ok: false,
      status: 400,
      error: "Each shot must have a positive integer shot_number and a non-empty description",
    };
  }

  const invalidChannel = (channels ?? []).find((c) => !VALID_SHOOT_CHANNELS.has(c));
  if (invalidChannel) {
    return { ok: false, status: 400, error: `Unsupported channel: ${invalidChannel}` };
  }

  const invalidDeliverableChannel = deliverables.find((d) => !VALID_SHOOT_CHANNELS.has(d.channel));
  if (invalidDeliverableChannel) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported deliverable channel: ${invalidDeliverableChannel.channel}`,
    };
  }

  return {
    ok: true,
    safeChannels: channels ?? [],
    safeDeliverables: deliverables,
  };
}

export function parseCommitShootDraftBody(body: unknown):
  | { ok: true; data: CommitShootDraftInput }
  | { ok: false; status: 400; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }

  const b = body as Record<string, unknown>;
  const input: CommitShootDraftInput = {
    brand_id: b.brand_id as string,
    shoot_name: b.shoot_name as string,
    brief: typeof b.brief === "string" ? b.brief : undefined,
    channels: Array.isArray(b.channels)
      ? b.channels.filter((c): c is string => typeof c === "string")
      : undefined,
    deliverables: b.deliverables as CommitDeliverable[],
    shots: b.shots as CommitShot[],
    approved_budget: b.approved_budget as number,
    budget_breakdown:
      b.budget_breakdown && typeof b.budget_breakdown === "object"
        ? (b.budget_breakdown as Record<string, number>)
        : undefined,
    run_id: typeof b.run_id === "string" ? b.run_id : undefined,
  };

  const validated = validateCommitShootDraftInput(input);
  if (!validated.ok) {
    return validated;
  }

  return { ok: true, data: { ...input, channels: validated.safeChannels, deliverables: validated.safeDeliverables } };
}

export async function commitShootDraft(opts: {
  input: CommitShootDraftInput;
  operatorId: string;
  userSb: SupabaseClient;
  serviceSb: SupabaseClient;
}): Promise<CommitShootDraftResult> {
  const { input, operatorId, userSb, serviceSb } = opts;

  const validated = validateCommitShootDraftInput(input);
  if (!validated.ok) {
    return validated;
  }

  const { brand_id, shoot_name, brief, shots, approved_budget, budget_breakdown, run_id } = input;
  const { safeChannels, safeDeliverables } = validated;

  const { error: brandErr } = await userSb.from("brands").select("id").eq("id", brand_id).single();
  if (brandErr) {
    return { ok: false, status: 403, error: "Brand not found or access denied" };
  }

  const createdBy = /^[0-9a-f-]{36}$/i.test(operatorId) ? operatorId : null;

  const { data: rpcResult, error: rpcErr } = await serviceSb.rpc("commit_shoot_draft", {
    p_brand_id: brand_id,
    p_name: shoot_name,
    p_brief: brief ?? null,
    p_target_channels: safeChannels,
    p_estimated_budget: approved_budget,
    p_budget_breakdown: budget_breakdown ?? null,
    p_created_by: createdBy,
    p_deliverables: safeDeliverables.map((d) => ({
      channel: d.channel,
      format: d.format ?? null,
      quantity: d.quantity,
    })),
    p_shots: shots.map((s) => ({
      description: s.description,
      style_notes: [s.angle, s.lighting].filter(Boolean).join(" | ") || null,
      order: s.shot_number,
    })),
  });

  const shoot_id =
    rpcResult && typeof rpcResult === "object" && "shoot_id" in rpcResult
      ? String((rpcResult as { shoot_id: string }).shoot_id)
      : null;

  if (rpcErr || !shoot_id) {
    console.error("[commit] rpc commit_shoot_draft:", rpcErr);
    return { ok: false, status: 500, error: RPC_FAIL_MESSAGE };
  }

  try {
    const { error: logErr } = await serviceSb.from("ai_agent_logs").insert({
      agent_name: "shoot-wizard",
      user_id: createdBy,
      brand_id,
      input: { run_id: run_id ?? null, shoot_name, channels: safeChannels },
      output: {
        shoot_id,
        deliverable_count: safeDeliverables.length,
        shot_count: shots.length,
        approved_budget,
      },
    });
    if (logErr) console.error("[commit] audit log (non-fatal):", logErr);
  } catch (e) {
    console.error("[commit] audit log (non-fatal):", e);
  }

  return { ok: true, shoot_id };
}

/** User-scoped client for Mastra tool commits (JWT from operator session). */
export function createUserScopedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase user client not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
