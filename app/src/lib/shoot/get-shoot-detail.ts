import type { SupabaseClient } from "@supabase/supabase-js";

export type ShootDetailDeliverable = {
  id: string;
  channel: string;
  format: string | null;
  quantity: number;
  status?: string;
};

export type ShootDetailShot = {
  id: string;
  shot_number: number;
  description: string;
  style_notes: string | null;
  status?: string;
};

export type ShootDetailAsset = {
  id: string;
  url: string;
  cloudinary_id: string;
  format: string | null;
  width: number | null;
  height: number | null;
  dna_score: number | null;
  status: string;
  created_at: string;
};

export type ShootDetailCrewMember = {
  id: string;
  role: string;
  confirmed: boolean;
  notes: string | null;
  internal_contact_id: string | null;
  marketplace_vendor_id: string | null;
};

export type ShootDetailApproval = {
  id: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  agent_run_id: string | null;
};

export type ShootDetailActivity = {
  id: string;
  agent_name: string;
  created_at: string;
  model: string | null;
};

export type ShootDetailPayload = {
  shoot: {
    id: string;
    name: string;
    status: string;
    brief: string | null;
    target_channels: string[];
    estimated_budget: number | null;
    actual_cost: number | null;
    currency: string;
    budget_breakdown: Record<string, number> | null;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    dna_score: number | null;
    mood_board_urls: string[];
    cover_url: string | null;
    created_at: string;
    updated_at: string;
    brand_id: string;
  };
  brand: { id: string; name: string };
  deliverables: ShootDetailDeliverable[];
  shots: ShootDetailShot[];
  assets: ShootDetailAsset[];
  crew: ShootDetailCrewMember[];
  approvals: ShootDetailApproval[];
  activity: ShootDetailActivity[];
};

export type GetShootDetailResult =
  | { ok: true; data: ShootDetailPayload }
  | { ok: false; status: 404 | 500; error: string };

export async function getShootDetail(
  userSb: SupabaseClient,
  shootId: string,
): Promise<GetShootDetailResult> {
  const { data, error } = await userSb.rpc("get_shoot_detail", {
    p_shoot_id: shootId,
  });

  if (error) {
    if (error.code === "P0002" || error.message?.includes("not_found")) {
      return { ok: false, status: 404, error: "Shoot not found" };
    }
    console.error("[get_shoot_detail]", error.message);
    return { ok: false, status: 500, error: "Failed to load shoot" };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, status: 404, error: "Shoot not found" };
  }

  const payload = data as ShootDetailPayload;
  return {
    ok: true,
    data: {
      ...payload,
      assets: payload.assets ?? [],
      crew: payload.crew ?? [],
      approvals: payload.approvals ?? [],
      activity: payload.activity ?? [],
    },
  };
}
