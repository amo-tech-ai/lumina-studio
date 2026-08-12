import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type Db = SupabaseClient<Database>;

export type AssetEventRow = {
  id: string;
  asset_id: string;
  cloudinary_asset_id: string | null;
  version: number | null;
  kind: string;
  actor_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type GetAssetEventsResult =
  | { ok: true; data: AssetEventRow[] }
  | { ok: false; status: 404 | 403 | 500; error?: string };

/**
 * IPI-441 — Append-only timeline read.
 * Org isolation via asset_events_select RLS (assets.brand_id → is_org_member).
 * Reverse-chronological (newest first), exact version binding preserved.
 */
export async function getAssetEvents(
  client: Db,
  assetId: string,
  opts?: { limit?: number },
): Promise<GetAssetEventsResult> {
  const limit = opts?.limit ?? 50;
  if (limit < 1 || limit > 200) {
    return { ok: false, status: 500, error: "limit out of range" };
  }

  // Confirm asset is readable under org RLS before leaking existence of events
  const { data: asset, error: assetErr } = await client
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .maybeSingle();

  if (assetErr) return { ok: false, status: 500, error: assetErr.message };
  if (!asset) return { ok: false, status: 404 };

  const { data, error } = await client
    .from("asset_events")
    .select("id, asset_id, cloudinary_asset_id, version, kind, actor_id, reason, metadata, created_at")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    // RLS 42501 or similar → treat as 403, not 500
    if ((error as { code?: string }).code === "42501") return { ok: false, status: 403, error: error.message };
    return { ok: false, status: 500, error: error.message };
  }

  return { ok: true, data: (data ?? []) as AssetEventRow[] };
}

export function formatAssetEventKind(kind: string): string {
  switch (kind) {
    case "upload":
      return "Uploaded";
    case "rename":
      return "Renamed";
    case "overwrite":
      return "Updated";
    case "moderated":
      return "Moderated";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    case "deleted":
      return "Deleted";
    default:
      return kind;
  }
}
