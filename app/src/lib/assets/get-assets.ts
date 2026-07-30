import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import {
  isDeliverableCover,
  withCloudinaryPreset,
  type CloudinaryPresetName,
} from "@/lib/cloudinary/url";
import {
  cloudinarySignedDownloadUrl,
  cloudinarySignedPresetUrl,
  type CloudinaryDeliveryType,
  type CloudinaryResourceType,
} from "@/app/api/_lib/cloudinary-signed-url";
import {
  DEFAULT_ASSETS_PAGE_LIMIT,
  MAX_ASSETS_PAGE_LIMIT,
  encodeAssetsCursor,
  normalizeAssetTag,
  type ListAssetsInput,
} from "@/lib/assets/list-assets-params";

type Db = SupabaseClient<Database>;
type AssetDbRow = Database["public"]["Tables"]["assets"]["Row"];
type CloudinaryMirrorRow = Database["public"]["Tables"]["cloudinary_assets"]["Row"];

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

/** Read-optimized Cloudinary mirror fields — all optional at render time. */
export type AssetMirrorFields = Pick<
  CloudinaryMirrorRow,
  | "public_id"
  | "cloudinary_asset_id"
  | "version"
  | "delivery_type"
  | "width"
  | "height"
  | "bytes"
  | "format"
  | "resource_type"
  | "folder"
>;

export type WhereUsedItem = {
  kind: "shoot" | "event" | "product" | "other";
  id: string;
  label: string;
  href: string | null;
};

export type AssetDetail = AssetRow & {
  mirror: AssetMirrorFields | null;
  whereUsed: WhereUsedItem[];
  /** Media Library search deep link when a public_id is known — never invent one. */
  consoleUrl: string | null;
  /** Signed original/attachment URL — not the preview transform. */
  downloadUrl: string | null;
};

export type GetAssetDetailResult =
  | { ok: true; data: AssetDetail }
  | { ok: false; status: 404 | 500 };

export type ListAssetsPage = {
  items: AssetRow[];
  nextCursor: string | null;
};

function resolveDisplayUrl(
  row: Pick<AssetDbRow, "cloudinary_public_id" | "url" | "thumbnail_url">,
  preset: CloudinaryPresetName = "asset-masonry",
): string | null {
  if (row.cloudinary_public_id) {
    try {
      return cloudinarySignedPresetUrl(row.cloudinary_public_id, preset);
    } catch (err) {
      console.error("[assets] signed URL failed for", row.cloudinary_public_id, err);
      return null;
    }
  }
  const raw = row.thumbnail_url ?? row.url;
  return isDeliverableCover(raw) ? withCloudinaryPreset(raw, preset) : null;
}

/** Prefer mirror public_id (webhook may land before assets-row sync). */
export function resolveCloudinaryPublicId(
  row: Pick<AssetDbRow, "cloudinary_public_id">,
  mirror: Pick<AssetMirrorFields, "public_id"> | null,
): string | null {
  return mirror?.public_id?.trim() || row.cloudinary_public_id?.trim() || null;
}

export function resolveCloudinaryResourceType(
  row: Pick<AssetDbRow, "asset_type">,
  mirror: Pick<AssetMirrorFields, "resource_type"> | null,
): CloudinaryResourceType {
  const fromMirror = mirror?.resource_type?.trim();
  if (fromMirror === "image" || fromMirror === "video" || fromMirror === "raw") {
    return fromMirror;
  }
  if (row.asset_type === "video") return "video";
  if (row.asset_type === "document") return "raw";
  return "image";
}

export function resolveCloudinaryDeliveryType(
  mirror: Pick<AssetMirrorFields, "delivery_type"> | null,
): CloudinaryDeliveryType {
  const fromMirror = mirror?.delivery_type?.trim();
  if (fromMirror === "upload" || fromMirror === "authenticated" || fromMirror === "private") {
    return fromMirror;
  }
  return "authenticated";
}

function resolveDetailUrls(
  row: AssetDbRow,
  mirror: AssetMirrorFields | null,
  preset: CloudinaryPresetName,
): { displayUrl: string | null; downloadUrl: string | null; publicId: string | null } {
  const publicId = resolveCloudinaryPublicId(row, mirror);
  if (!publicId) {
    return {
      displayUrl: resolveDisplayUrl(row, preset),
      downloadUrl: null,
      publicId: null,
    };
  }

  const resourceType = resolveCloudinaryResourceType(row, mirror);
  const deliveryType = resolveCloudinaryDeliveryType(mirror);
  const signOpts = { resourceType, deliveryType };

  let displayUrl: string | null = null;
  try {
    displayUrl = cloudinarySignedPresetUrl(publicId, preset, signOpts);
  } catch (err) {
    console.error("[assets] signed detail URL failed for", publicId, err);
  }

  let downloadUrl: string | null = null;
  try {
    downloadUrl = cloudinarySignedDownloadUrl(publicId, {
      ...signOpts,
      format: mirror?.format ?? null,
    });
  } catch (err) {
    console.error("[assets] signed download URL failed for", publicId, err);
  }

  return { displayUrl, downloadUrl, publicId };
}

function cloudinaryConsoleUrl(publicId: string): string {
  // Media Library global search — operator lands with public_id prefilled.
  // No Admin API; console deep-link only when public_id is already known.
  const q = encodeURIComponent(`public_id=${publicId}`);
  return `https://console.cloudinary.com/console/media_library/search?q=${q}`;
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function buildWhereUsed(args: {
  shootId: string | null;
  links: Array<{ entity_type: string; entity_id: string }> | null;
  products: Array<{ medusa_product_id: string }> | null;
}): WhereUsedItem[] {
  const items: WhereUsedItem[] = [];
  const seen = new Set<string>();

  const push = (item: WhereUsedItem) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  if (args.shootId) {
    push({
      kind: "shoot",
      id: args.shootId,
      label: `Shoot · ${shortId(args.shootId)}`,
      href: `/app/shoots/${args.shootId}`,
    });
  }

  for (const link of args.links ?? []) {
    if (link.entity_type === "shoot") {
      push({
        kind: "shoot",
        id: link.entity_id,
        label: `Shoot · ${shortId(link.entity_id)}`,
        href: `/app/shoots/${link.entity_id}`,
      });
      continue;
    }
    if (link.entity_type === "event") {
      push({
        kind: "event",
        id: link.entity_id,
        label: `Event · ${shortId(link.entity_id)}`,
        href: null,
      });
      continue;
    }
    push({
      kind: "other",
      id: link.entity_id,
      label: `${link.entity_type} · ${shortId(link.entity_id)}`,
      href: null,
    });
  }

  for (const product of args.products ?? []) {
    push({
      kind: "product",
      id: product.medusa_product_id,
      label: `Product · ${shortId(product.medusa_product_id)}`,
      href: null,
    });
  }

  return items;
}

/** Escape `%` / `_` / `\` so user query text is literal under ILIKE. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Wrap a PostgREST filter value in double quotes so reserved `.or()` / `.and()`
 * delimiters (commas, parentheses, periods) stay inside one operand.
 * Embedded `"` → `""` per PostgREST double-quoted value rules.
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeLimit(limit: number | undefined): number {
  const n = limit ?? DEFAULT_ASSETS_PAGE_LIMIT;
  if (!Number.isInteger(n) || n < 1 || n > MAX_ASSETS_PAGE_LIMIT) {
    throw new Error(`Asset page limit must be between 1 and ${MAX_ASSETS_PAGE_LIMIT}.`);
  }
  return n;
}

function buildSearchOrFilter(rawQuery: string): string {
  const pattern = quotePostgrestValue(`%${escapeIlikePattern(rawQuery)}%`);
  const tagExact = normalizeAssetTag(rawQuery);
  const parts = [
    `cloudinary_public_id.ilike.${pattern}`,
    `metadata->>original_filename.ilike.${pattern}`,
    `metadata->>title.ilike.${pattern}`,
    `metadata->>alt_text.ilike.${pattern}`,
    `metadata->>alt.ilike.${pattern}`,
  ];
  if (tagExact) {
    // PostgREST array contains; quote the JSON array literal so commas in tags stay intact.
    parts.push(`tags.cs.${quotePostgrestValue(`{"${tagExact.replace(/"/g, "")}"}`)}`);
  }
  return parts.join(",");
}

function buildCursorOrFilter(
  cursor: { createdAt: string; id: string },
  ascending: boolean,
): string {
  const createdAt = quotePostgrestValue(cursor.createdAt);
  const id = quotePostgrestValue(cursor.id);
  if (ascending) {
    return `created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`;
  }
  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`;
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
 *
 * Search + cursor must share one `.or()` payload. Chaining two `.or()` calls is
 * fragile across PostgREST parsers; we AND the groups explicitly as
 * `or=(and(or(search…),or(cursor…)))`.
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
  const searchOr = rawQuery ? buildSearchOrFilter(rawQuery) : null;
  const cursorOr = input.cursor ? buildCursorOrFilter(input.cursor, ascending) : null;

  if (searchOr && cursorOr) {
    query = query.or(`and(or(${searchOr}),or(${cursorOr}))`);
  } else if (searchOr) {
    query = query.or(searchOr);
  } else if (cursorOr) {
    query = query.or(cursorOr);
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

type AssetDetailQueryRow = AssetDbRow & {
  brand: { name: string } | null;
  mirror: AssetMirrorFields | AssetMirrorFields[] | null;
  asset_links: Array<{ entity_type: string; entity_id: string }> | null;
  commerce_product_links: Array<{ medusa_product_id: string }> | null;
};

/**
 * Single-asset detail for `/app/assets/[id]` (IPI-436).
 * Reads the authenticated Supabase mirror only — no Cloudinary Admin API.
 * Identity / media fields may be null; callers must omit, not invent.
 */
export async function getAssetDetail(
  client: Db,
  assetId: string,
): Promise<GetAssetDetailResult> {
  const { data, error } = await client
    .from("assets")
    .select(
      [
        "*",
        "brand:brands(name)",
        "mirror:cloudinary_assets(public_id, cloudinary_asset_id, version, delivery_type, width, height, bytes, format, resource_type, folder)",
        "asset_links(entity_type, entity_id)",
        "commerce_product_links(medusa_product_id)",
      ].join(", "),
    )
    .eq("id", assetId)
    .maybeSingle();

  if (error) {
    console.error("[assets] getAssetDetail failed:", error.message);
    return { ok: false, status: 500 };
  }
  if (!data) return { ok: false, status: 404 };

  const row = data as unknown as AssetDetailQueryRow;
  const mirrorRaw = row.mirror;
  const mirror = Array.isArray(mirrorRaw) ? (mirrorRaw[0] ?? null) : mirrorRaw;

  const { mirror: _m, asset_links, commerce_product_links, ...assetFields } = row;
  const { displayUrl, downloadUrl, publicId } = resolveDetailUrls(row, mirror, "asset-detail");

  return {
    ok: true,
    data: {
      ...(assetFields as AssetDbRow & { brand: { name: string } | null }),
      displayUrl,
      downloadUrl,
      mirror,
      // Parent `assets.shoot_id` is visible under org-aware assets RLS.
      // Child embeds (`asset_links`, `commerce_product_links`) need matching
      // org-aware SELECT policies — sibling IPI-770 · CLD-WHERE-USED-RLS-001 —
      // or org members silently get empty Where Used for those relations.
      whereUsed: buildWhereUsed({
        shootId: row.shoot_id,
        links: asset_links,
        products: commerce_product_links,
      }),
      consoleUrl: publicId ? cloudinaryConsoleUrl(publicId) : null,
    },
  };
}
