// IPI-526 — Planner Hub URL-parameter parsing/building. Pure functions so
// the frozen validation rules (Linear correction #4) and cursor-clearing
// rule (correction #3) are unit-testable without rendering the page.

import type { EntityType, PlannerInstanceStatus } from "@/lib/planner/types";

export type RawHubSearchParams = Record<string, string | string[] | undefined>;

export type HubFilters = {
  search: string;
  entityType?: EntityType;
  status?: PlannerInstanceStatus;
  includeArchived: boolean;
  cursor?: string;
  limit: number;
};

const ENTITY_TYPES: readonly EntityType[] = ["shoot", "campaign", "crm_deal"];

// Mirrors the key set of status-transitions.ts's TRANSITIONS/UI_TREATMENT —
// the canonical Planner instance status enumeration. That module only
// exports per-status lookups, not an array, so the runtime list used for
// query-param validation and the status <select> options lives here.
export const PLANNER_INSTANCE_STATUSES: readonly PlannerInstanceStatus[] = [
  "draft",
  "planned",
  "active",
  "blocked",
  "completed",
  "archived",
  "cancelled",
];

// Matches queries.ts's own MAX_SEARCH_LENGTH exactly — that's the layer that
// actually enforces it (INVALID_INPUT past this). A larger Hub-side limit
// let 101-200-char searches through parseHubSearchParams only to fail at
// the query layer and throw to the error boundary; truncating to the same
// bound here means the Hub never sends a search it knows will be rejected.
// Exported so the search <input>'s maxLength (hub-filters.tsx) can reference
// the same value instead of hardcoding a second copy that can drift out of
// sync with this one — the exact bug this constant's own comment describes.
export const MAX_SEARCH_LENGTH = 100;
// Matches queries.ts's decodeCursor bound and charset exactly — a value that
// couldn't have been issued by listPlannerInstances (too long, or containing
// a character outside base64url) is treated as absent (fall back to page 1)
// instead of being sent through to fail.
const MAX_CURSOR_LENGTH = 512;
const CURSOR_CHARSET_RE = /^[A-Za-z0-9_-]+$/;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isEntityType(value: string | undefined): value is EntityType {
  return value !== undefined && (ENTITY_TYPES as readonly string[]).includes(value);
}

function isPlannerStatus(value: string | undefined): value is PlannerInstanceStatus {
  return value !== undefined && (PLANNER_INSTANCE_STATUSES as readonly string[]).includes(value);
}

export function parseHubSearchParams(raw: RawHubSearchParams): HubFilters {
  const search = (firstValue(raw.search) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  const entityTypeRaw = firstValue(raw.entityType);
  const entityType = isEntityType(entityTypeRaw) ? entityTypeRaw : undefined;

  const statusRaw = firstValue(raw.status);
  const status = isPlannerStatus(statusRaw) ? statusRaw : undefined;

  const includeArchivedRaw = firstValue(raw.includeArchived);
  const includeArchived = includeArchivedRaw === "true" || includeArchivedRaw === "1";

  const cursorRaw = firstValue(raw.cursor);
  const cursor =
    cursorRaw &&
    cursorRaw.length > 0 &&
    cursorRaw.length <= MAX_CURSOR_LENGTH &&
    CURSOR_CHARSET_RE.test(cursorRaw)
      ? cursorRaw
      : undefined;

  const limitRaw = firstValue(raw.limit);
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
  const limit =
    Number.isInteger(limitParsed) && limitParsed >= 1 && limitParsed <= MAX_LIMIT
      ? limitParsed
      : DEFAULT_LIMIT;

  return { search, entityType, status, includeArchived, cursor, limit };
}

// includeArchived only ever widens results (never narrows them), so it can
// never explain zero matches — excluded here so an org with a truly empty
// portfolio and archived visibility on still gets the "no plans yet" state,
// not "no plans match these filters" pointing at a toggle that can't be the
// cause.
export function hasActiveFilters(filters: HubFilters): boolean {
  return Boolean(filters.search || filters.entityType || filters.status);
}

// Any filter change must drop the cursor (correction #3) — every caller
// building a type-chip/search/clear link passes no `cursor`, so it's always
// omitted unless explicitly forwarded. Only hub-pagination.tsx forwards one.
export function buildHubUrl(
  filters: Partial<
    Pick<HubFilters, "search" | "entityType" | "status" | "includeArchived" | "limit" | "cursor">
  >,
): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.status) params.set("status", filters.status);
  if (filters.includeArchived) params.set("includeArchived", "true");
  if (filters.limit && filters.limit !== DEFAULT_LIMIT) params.set("limit", String(filters.limit));
  if (filters.cursor) params.set("cursor", filters.cursor);

  const qs = params.toString();
  return qs ? `/app/planner?${qs}` : "/app/planner";
}
