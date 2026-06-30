const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strip query/hash and trailing slashes (except `/app` root). */
export function normalizeRoutePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0].split("#")[0];
  return withoutQuery === "/app" ? withoutQuery : withoutQuery.replace(/\/+$/, "");
}

export function extractRouteSegment(pathname: string, segmentIndex: number): string | null {
  const part = normalizeRoutePath(pathname).split("/")[segmentIndex];
  return part && part.length > 0 ? part : null;
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function routeBrandId(pathname: string): string | null {
  if (!normalizeRoutePath(pathname).startsWith("/app/brand/")) return null;
  const id = extractRouteSegment(pathname, 3);
  return id && isUuid(id) ? id : null;
}

export function routeShootId(pathname: string): string | null {
  const normalized = normalizeRoutePath(pathname);
  if (!normalized.startsWith("/app/shoots/")) return null;
  const id = extractRouteSegment(pathname, 3);
  if (!id || id === "new" || !isUuid(id)) return null;
  return id;
}
