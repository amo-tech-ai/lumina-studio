import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const VALID_SHOOT_CHANNELS = new Set([
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
]);

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

function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export function parseCommitShootDraftBody(body: unknown):
  | { ok: true; data: CommitShootDraftInput }
  | { ok: false; status: 400; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }

  const b = body as Record<string, unknown>;
  const {
    brand_id,
    shoot_name,
    brief,
    channels,
    deliverables,
    shots,
    approved_budget,
    budget_breakdown,
    run_id,
  } = b;

  if (
    !Array.isArray(deliverables) ||
    !Array.isArray(shots) ||
    typeof brand_id !== "string" ||
    typeof shoot_name !== "string" ||
    !deliverables.length ||
    !shots.length ||
    typeof approved_budget !== "number" ||
    !approved_budget
  ) {
    return {
      ok: false,
      status: 400,
      error: "brand_id, shoot_name, deliverables, shots, and approved_budget are required",
    };
  }

  const badDeliverable = (deliverables as CommitDeliverable[]).find(
    (d) =>
      !d ||
      typeof d.channel !== "string" ||
      !d.channel.trim() ||
      typeof d.quantity !== "number" ||
      d.quantity < 1,
  );
  if (badDeliverable) {
    return {
      ok: false,
      status: 400,
      error: "Each deliverable must have a non-empty channel and a positive quantity",
    };
  }

  const badShot = (shots as CommitShot[]).find(
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

  const safeChannels = Array.isArray(channels)
    ? channels.filter((c): c is string => typeof c === "string" && VALID_SHOOT_CHANNELS.has(c))
    : [];

  const safeDeliverables = (deliverables as CommitDeliverable[]).filter((d) =>
    VALID_SHOOT_CHANNELS.has(d.channel),
  );

  if (safeDeliverables.length === 0) {
    return { ok: false, status: 400, error: "No valid deliverables after channel filtering" };
  }

  return {
    ok: true,
    data: {
      brand_id,
      shoot_name,
      brief: typeof brief === "string" ? brief : undefined,
      channels: safeChannels,
      deliverables: safeDeliverables,
      shots: shots as CommitShot[],
      approved_budget,
      budget_breakdown:
        budget_breakdown && typeof budget_breakdown === "object"
          ? (budget_breakdown as Record<string, number>)
          : undefined,
      run_id: typeof run_id === "string" ? run_id : undefined,
    },
  };
}

export async function commitShootDraft(opts: {
  input: CommitShootDraftInput;
  operatorId: string;
  userSb: SupabaseClient;
}): Promise<CommitShootDraftResult> {
  const { input, operatorId, userSb } = opts;
  const { brand_id, shoot_name, brief, channels, deliverables, shots, approved_budget, budget_breakdown, run_id } =
    input;

  const { error: brandErr } = await userSb.from("brands").select("id").eq("id", brand_id).single();
  if (brandErr) {
    return { ok: false, status: 403, error: "Brand not found or access denied" };
  }

  const svc = serviceClient();
  const safeChannels = channels ?? [];
  const createdBy = /^[0-9a-f-]{36}$/i.test(operatorId) ? operatorId : null;

  const { data: rpcResult, error: rpcErr } = await svc.rpc("commit_shoot_draft", {
    p_brand_id: brand_id,
    p_name: shoot_name,
    p_brief: brief ?? null,
    p_target_channels: safeChannels,
    p_estimated_budget: approved_budget,
    p_budget_breakdown: budget_breakdown ?? null,
    p_created_by: createdBy,
    p_deliverables: deliverables.map((d) => ({
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
    return {
      ok: false,
      status: 500,
      error: rpcErr?.message ?? "Failed to commit shoot",
    };
  }

  try {
    const { error: logErr } = await svc.from("ai_agent_logs").insert({
      agent_name: "shoot-wizard",
      user_id: createdBy,
      brand_id,
      input: { run_id: run_id ?? null, shoot_name, channels: safeChannels },
      output: {
        shoot_id,
        deliverable_count: deliverables.length,
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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}
