import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import { isDeliverableCover, withCloudinaryPreset } from "@/lib/cloudinary/url";
import { cloudinarySignedPresetUrl } from "@/app/api/_lib/cloudinary-signed-url";

type Db = SupabaseClient<Database>;
type AssetDbRow = Database["public"]["Tables"]["assets"]["Row"];

export type AssetRow = AssetDbRow & {
  brand: { name: string } | null;
  /** Final delivery URL to render, or null for the icon fallback. Resolved
   *  here (server-only) because a real `cloudinary_public_id` asset needs a
   *  *signed* URL (`cloudinarySignedPresetUrl`, uses `CLOUDINARY_API_SECRET`)
   *  — see cloudinary-signed-url.ts: uploads always go in as `type:"authenticated"`
   *  until a future approval flow exists, so an unsigned public delivery URL
   *  404s/401s for every real (non-fixture) asset. */
  displayUrl: string | null;
};

function resolveDisplayUrl(
  row: Pick<AssetDbRow, "cloudinary_public_id" | "url" | "thumbnail_url">,
): string | null {
  if (row.cloudinary_public_id) {
    try {
      return cloudinarySignedPresetUrl(row.cloudinary_public_id, "asset-masonry");
    } catch (err) {
      console.error("[assets] signed URL failed for", row.cloudinary_public_id, err);
      return null;
    }
  }
  const raw = row.thumbnail_url ?? row.url;
  return isDeliverableCover(raw) ? withCloudinaryPreset(raw, "asset-masonry") : null;
}

/** Read-only asset library list (SCR-08). No explicit brand/user filter —
 *  `assets_select_via_brand` RLS already scopes to assets whose brand is
 *  owned by the current user (`public.brands.user_id = auth.uid()`), the
 *  same ownership model brand/page.tsx's plain `.from("brands")` query
 *  trusts for the brand list. Joins `brands.name` (via `assets_brand_id_fkey`)
 *  so the workspace can offer an honest brand filter — real column, not
 *  fabricated — matching SCR-08's DoD ("filter by brand").
 *
 *  Known gaps (tracked, not fixed here — both need an RLS/migration change,
 *  out of scope per SCR-08-assets.md's own "Out of scope: Backend migrations"):
 *  org-shared brands (non-owner org members get 0 assets — `assets_select_via_brand`
 *  isn't org-aware like `brands_select_org`), and shoot-scoped assets living in
 *  `shoot.shoot_assets` (only `get_brand_assets(brand_id)`, a brand-scoped RPC,
 *  currently unions them — this is a brand-agnostic library query). */
export async function listAssets(client: Db): Promise<AssetRow[]> {
  const { data, error } = await client
    .from("assets")
    .select("*, brand:brands(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, displayUrl: resolveDisplayUrl(row) })) as AssetRow[];
}
