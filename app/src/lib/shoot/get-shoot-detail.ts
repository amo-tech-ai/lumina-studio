import type { SupabaseClient } from "@supabase/supabase-js";
import { isRpcNotFoundError } from "./rpc-errors";

export type ShootDetailDeliverable = {
  id: string;
  channel: string;
  format: string | null;
  quantity: number;
};

export type ShootDetailShot = {
  id: string;
  shot_number: number;
  description: string;
  style_notes: string | null;
};

export type ShootDetailPayload = {
  shoot: {
    id: string;
    name: string;
    status: string;
    brief: string | null;
    target_channels: string[];
    estimated_budget: number | null;
    budget_breakdown: Record<string, number> | null;
    created_at: string;
    updated_at: string;
    brand_id: string;
  };
  brand: { id: string; name: string };
  deliverables: ShootDetailDeliverable[];
  shots: ShootDetailShot[];
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
