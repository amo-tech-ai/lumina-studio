import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parse `brand_id` from Cloudinary upload context (string or object). */
export function parseBrandIdFromCloudinaryContext(context: unknown): string | undefined {
  if (typeof context === "object" && context !== null && !Array.isArray(context)) {
    const value = (context as Record<string, unknown>).brand_id;
    if (typeof value === "string" && UUID_RE.test(value)) return value;
  }
  if (typeof context !== "string" || !context.includes("brand_id=")) return undefined;
  for (const part of context.split("|")) {
    const [key, value] = part.split("=");
    if (key === "brand_id" && value && UUID_RE.test(value)) return value;
  }
  return undefined;
}

/** RLS-backed brand access — succeeds when policy `brands_select_org` allows the row.
 *
 * Policy (migration 20260627170000_brands_rls_null_org_backfill.sql):
 * - org brands: visible when `public.is_org_member(org_id)` for the authenticated user
 * - legacy null-org brands: visible only to `brands.user_id = auth.uid()`
 *
 * This helper must run with `createOperatorSupabaseClient` (cookie or Bearer) so RLS
 * applies. Do not use the service-role client here — a missing policy would fail open.
 */
export type BrandAccessResult =
  | { ok: true; orgId: string }
  | { ok: false; status: 403 | 500; message: string };

export async function isBrandAccessible(
  supabase: SupabaseClient<Database>,
  brandId: string,
): Promise<BrandAccessResult> {
  if (!UUID_RE.test(brandId)) {
    return { ok: false, status: 403, message: "Invalid brand" };
  }

  const { data, error } = await supabase
    .from("brands")
    .select("id, org_id")
    .eq("id", brandId)
    .maybeSingle();
  if (error) {
    console.error("[brand-access] brands lookup failed:", error.message);
    return { ok: false, status: 500, message: "Internal error" };
  }
  if (!data) {
    return { ok: false, status: 403, message: "Brand not accessible to caller" };
  }
  return { ok: true, orgId: data.org_id };
}
