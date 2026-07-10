import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type Db = SupabaseClient<Database>;

export type AssetRow = Database["public"]["Tables"]["assets"]["Row"] & {
  brand: { name: string } | null;
};

/** Read-only asset library list (SCR-08). No explicit brand/user filter —
 *  `assets_select_via_brand` RLS already scopes to assets whose brand is
 *  owned by the current user (`public.brands.user_id = auth.uid()`), the
 *  same ownership model brand/page.tsx's plain `.from("brands")` query
 *  trusts for the brand list. Joins `brands.name` (via `assets_brand_id_fkey`)
 *  so the workspace can offer an honest brand filter — real column, not
 *  fabricated — matching SCR-08's DoD ("filter by brand"). */
export async function listAssets(client: Db): Promise<AssetRow[]> {
  const { data, error } = await client
    .from("assets")
    .select("*, brand:brands(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssetRow[];
}
