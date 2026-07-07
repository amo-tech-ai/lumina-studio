import type { SupabaseClient } from "@supabase/supabase-js";
import { isRpcNotFoundError } from "./rpc-errors";

/** Matches shot.shot_list.status (DB enum shot_status). */
export type ShotStatus = "pending" | "captured" | "approved";

/** Matches shoot.shoot_assets.status (DB enum asset_status). */
export type ShootAssetStatus = "pending" | "approved" | "flagged" | "rejected";

/** Matches shoot.shoot_crew.role (DB enum crew_role). */
export type CrewRole =
  | "photographer"
  | "model"
  | "stylist"
  | "makeup_artist"
  | "hair_stylist"
  | "assistant"
  | "producer"
  | "other";

export type ShootDetailDeliverable = {
  id: string;
  channel: string;
  format: string | null;
  quantity: number;
  status: string | null;
};

export type ShootDetailShot = {
  id: string;
  shot_number: number;
  description: string;
  style_notes: string | null;
  status: ShotStatus;
};

/** shoot.shoot_assets row — no `name`/caption column, url + cloudinary metadata only.
 *  resource_type is Cloudinary's own value ("image"/"video"/"raw"), written verbatim
 *  from the upload webhook — the reliable signal for video vs image, not `format`. */
export type ShootDetailAsset = {
  id: string;
  url: string;
  cloudinary_id: string | null;
  format: string | null;
  resource_type: string | null;
  width: number | null;
  height: number | null;
  dna_score: number | null;
  status: ShootAssetStatus;
  created_at: string;
};

/** shoot.shoot_crew row — no resolved person name; render by role + confirmed state. */
export type ShootDetailCrewMember = {
  id: string;
  role: CrewRole;
  confirmed: boolean;
  notes: string | null;
  internal_contact_id: string | null;
  marketplace_vendor_id: string | null;
};

/** shoot.shoot_intake_drafts row filtered to this shoot's context. */
export type ShootDetailApproval = {
  id: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  agent_run_id: string | null;
};

/** public.ai_agent_logs row scoped to this shoot via input/output shoot_id. */
export type ShootDetailActivityEvent = {
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
    currency: string | null;
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
  activity: ShootDetailActivityEvent[];
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
    if (isRpcNotFoundError(error)) {
      return { ok: false, status: 404, error: "Shoot not found" };
    }
    console.error("[get_shoot_detail]", error.message);
    return { ok: false, status: 500, error: "Failed to load shoot" };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, status: 404, error: "Shoot not found" };
  }

  return { ok: true, data: data as ShootDetailPayload };
}
