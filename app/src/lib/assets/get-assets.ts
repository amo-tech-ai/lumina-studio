import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import { isDeliverableCover, withCloudinaryPreset } from "@/lib/cloudinary/url";
import { cloudinarySignedPresetUrl } from "@/app/api/_lib/cloudinary-signed-url";
import {
  DEFAULT_ASSETS_PAGE_LIMIT,
  MAX_ASSETS_PAGE_LIMIT,
  encodeAssetsCursor,
  normalizeAssetTag,
  type ListAssetsInput,
} from "@/lib/assets/list-assets-params";

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

export type ListAssetsPage = {
  items: AssetRow[];
  nextCursor: string | null;
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

/** Escape `%` / `_` / `\` so user query text is literal under ILIKE. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function normalizeLimit(limit: number | undefined): number {
  const n = limit ?? DEFAULT_ASSETS_PAGE_LIMIT;
  if (!Number.isInteger(n) || n < 1 || n > MAX_ASSETS_PAGE_LIMIT) {
    throw new Error(`Asset page limit must be between 1 and ${MAX_ASSETS_PAGE_LIMIT}.`);
  }
  return n;
}

/**
 * Read-only asset library list (SCR-08 / IPI-435).
 *
 * No service-role reads — callers pass the authenticated Supabase client so
 * `assets_select_via_brand` RLS (org-aware) stays active. Filters run in
 * Postgres before the page is returned. Cloudinary Search is intentionally
 * out of scope for v1 (future optional discovery for native dimensions /
 * EXIF / visual similarity, intersected with authorized Supabase ids).
 *
 * v1 free-text (`query`) matches:
 * - `cloudinary_public_id` (partial)
 * - `metadata.original_filename` / `metadata.title` / `metadata.alt_text` /
 *   `metadata.alt` when present (schema has no dedicated filename/title cols yet)
 * - exact normalized tag equality
 */
export async function listAssets(
  client: Db,
  input: ListAssetsInput = {},
): Promise<ListAssetsPage> {
  const limit = normalizeLimit(input.limit);
  const sort = input.sort ?? "newest";
  const ascending = sort === "oldest";

  let query = client.from("assets").select("*, brand:brands(name)");

  if (input.brandId) {
    query = query.eq("brand_id", input.brandId);
  }
  if (input.status && input.status.length > 0) {
    query = query.in("status", input.status);
  }
  if (input.tags && input.tags.length > 0) {
    const normalized = input.tags.map(normalizeAssetTag).filter(Boolean);
    if (normalized.length > 0) {
      // AND semantics: asset must include every requested tag.
      query = query.contains("tags", normalized);
    }
  }

  const rawQuery = input.query?.trim();
  if (rawQuery) {
    const pattern = `%${escapeIlikePattern(rawQuery)}%`;
    const tagExact = normalizeAssetTag(rawQuery);
    const parts = [
      `cloudinary_public_id.ilike.${pattern}`,
      `metadata->>original_filename.ilike.${pattern}`,
      `metadata->>title.ilike.${pattern}`,
      `metadata->>alt_text.ilike.${pattern}`,
      `metadata->>alt.ilike.${pattern}`,
    ];
    if (tagExact) {
      // PostgREST array contains: tags.cs.{"value"}
      parts.push(`tags.cs.{"${tagExact.replace(/"/g, "")}"}`);
    }
    query = query.or(parts.join(","));
  }

  if (input.cursor) {
    const { createdAt, id } = input.cursor;
    if (ascending) {
      query = query.or(
        `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`,
      );
    } else {
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  if (error) throw error;

  const rows = (data ?? []) as AssetDbRow[];
  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  const last = pageRows.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeAssetsCursor({ createdAt: last.created_at, id: last.id })
      : null;

  return {
    items: pageRows.map((row) => ({
      ...row,
      displayUrl: resolveDisplayUrl(row),
    })) as AssetRow[],
    nextCursor,
  };
}
