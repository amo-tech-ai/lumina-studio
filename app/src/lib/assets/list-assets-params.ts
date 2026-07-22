// IPI-435 · CLD-102 — Shared URL + listAssets input contract for /app/assets.
// Supabase-first / RLS-backed. No Cloudinary Search in v1.

export type RawAssetsSearchParams = Record<string, string | string[] | undefined>;

export type AssetsLibrarySort = "newest" | "oldest";

export type AssetsLibraryCursor = {
  createdAt: string;
  id: string;
};

export type ListAssetsInput = {
  brandId?: string;
  query?: string;
  status?: string[];
  tags?: string[];
  sort?: AssetsLibrarySort;
  cursor?: AssetsLibraryCursor;
  limit?: number;
};

export type AssetsLibraryFilters = {
  brandId?: string;
  query: string;
  status: string[];
  tags: string[];
  sort: AssetsLibrarySort;
  cursor?: string;
  limit: number;
};

export type ParseAssetsLibraryResult =
  | { ok: true; data: AssetsLibraryFilters }
  | { ok: false; error: string };

/** Known `assets.status` values observed in schema defaults + library fixtures. */
export const ASSET_STATUS_VALUES = [
  "final",
  "ready",
  "draft",
  "archived",
  "pending",
  "processing",
  "approved",
  "rejected",
] as const;

export type AssetStatusValue = (typeof ASSET_STATUS_VALUES)[number];

export const DEFAULT_ASSETS_PAGE_LIMIT = 24;
export const MAX_ASSETS_PAGE_LIMIT = 50;
export const MAX_ASSETS_SEARCH_LENGTH = 100;
const MAX_CURSOR_LENGTH = 512;
const CURSOR_CHARSET_RE = /^[A-Za-z0-9_-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMPTZ_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function splitCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Tags are a Postgres `text[]` — elements may contain commas. URL form keeps a
 * single `tags=` key for shareability, so each tag is encodeURIComponent'd
 * before join. Legacy unencoded CSV (`editorial,approved`) still parses.
 */
export function encodeTagsQueryValue(tags: string[]): string {
  return tags
    .map((t) => normalizeAssetTag(t))
    .filter(Boolean)
    .map((t) => encodeURIComponent(t))
    .join(",");
}

export function decodeTagsQueryValue(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      try {
        return normalizeAssetTag(decodeURIComponent(trimmed));
      } catch {
        return normalizeAssetTag(trimmed);
      }
    })
    .filter(Boolean);
}

/** Lowercase + collapse internal whitespace — used for tags filter + tag text match. */
export function normalizeAssetTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

export function encodeAssetsCursor(cursor: AssetsLibraryCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAssetsCursor(value: string): AssetsLibraryCursor | null {
  if (!value || value.length > MAX_CURSOR_LENGTH || !CURSOR_CHARSET_RE.test(value)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AssetsLibraryCursor>;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") return null;
    if (
      !TIMESTAMPTZ_RE.test(parsed.createdAt) ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      !UUID_RE.test(parsed.id)
    ) {
      return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id.toLowerCase() };
  } catch {
    return null;
  }
}

export function parseAssetsLibraryParams(raw: RawAssetsSearchParams): ParseAssetsLibraryResult {
  const query = (firstValue(raw.q) ?? "").trim().slice(0, MAX_ASSETS_SEARCH_LENGTH);

  const brandRaw = firstValue(raw.brand);
  let brandId: string | undefined;
  if (brandRaw && brandRaw !== "all") {
    if (!UUID_RE.test(brandRaw)) {
      return { ok: false, error: "brand must be a valid UUID." };
    }
    brandId = brandRaw.toLowerCase();
  }

  const statusTokens = splitCsv(firstValue(raw.status));
  if (statusTokens.length > 0) {
    const invalid = statusTokens.find((s) => !(ASSET_STATUS_VALUES as readonly string[]).includes(s));
    if (invalid) {
      return { ok: false, error: `Invalid status filter: ${invalid}` };
    }
  }

  // Prefer a single tags= blob (encoded CSV). If the framework already split
  // repeated tags= keys into an array, treat each entry as one tag value.
  const tagsRaw = raw.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.flatMap((entry) => decodeTagsQueryValue(entry))
    : decodeTagsQueryValue(firstValue(tagsRaw));

  const sortRaw = firstValue(raw.sort);
  let sort: AssetsLibrarySort = "newest";
  if (sortRaw != null && sortRaw !== "") {
    if (sortRaw !== "newest" && sortRaw !== "oldest") {
      return { ok: false, error: 'sort must be "newest" or "oldest".' };
    }
    sort = sortRaw;
  }

  const limitRaw = firstValue(raw.limit);
  let limit = DEFAULT_ASSETS_PAGE_LIMIT;
  if (limitRaw != null && limitRaw !== "") {
    const parsed = Number.parseInt(limitRaw, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_ASSETS_PAGE_LIMIT) {
      return { ok: false, error: `limit must be an integer between 1 and ${MAX_ASSETS_PAGE_LIMIT}.` };
    }
    limit = parsed;
  }

  const cursorRaw = firstValue(raw.cursor);
  let cursor: string | undefined;
  if (cursorRaw != null && cursorRaw !== "") {
    if (!decodeAssetsCursor(cursorRaw)) {
      return { ok: false, error: "cursor is invalid." };
    }
    cursor = cursorRaw;
  }

  return {
    ok: true,
    data: {
      brandId,
      query,
      status: statusTokens,
      tags,
      sort,
      cursor,
      limit,
    },
  };
}

export function toListAssetsInput(filters: AssetsLibraryFilters): ListAssetsInput {
  const decoded = filters.cursor ? decodeAssetsCursor(filters.cursor) : null;
  return {
    brandId: filters.brandId,
    query: filters.query || undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    sort: filters.sort,
    cursor: decoded ?? undefined,
    limit: filters.limit,
  };
}

export function hasServerAssetsFilters(filters: AssetsLibraryFilters): boolean {
  return Boolean(
    filters.brandId ||
      filters.query ||
      filters.status.length > 0 ||
      filters.tags.length > 0 ||
      filters.sort !== "newest",
  );
}

/** Filter changes drop the cursor so operators never page into a stale window. */
export function buildAssetsLibraryUrl(
  filters: Partial<
    Pick<AssetsLibraryFilters, "brandId" | "query" | "status" | "tags" | "sort" | "limit" | "cursor">
  >,
): string {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brand", filters.brandId);
  if (filters.query) params.set("q", filters.query);
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.tags && filters.tags.length > 0) {
    params.set("tags", encodeTagsQueryValue(filters.tags));
  }
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.limit && filters.limit !== DEFAULT_ASSETS_PAGE_LIMIT) {
    params.set("limit", String(filters.limit));
  }
  if (filters.cursor) params.set("cursor", filters.cursor);
  const qs = params.toString();
  return qs ? `/app/assets?${qs}` : "/app/assets";
}
