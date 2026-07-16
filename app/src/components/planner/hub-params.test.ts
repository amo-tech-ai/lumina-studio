import { describe, expect, it } from "vitest";

import { buildHubUrl, hasActiveFilters, parseHubSearchParams } from "./hub-params";

describe("parseHubSearchParams", () => {
  it("parses a valid combined filter set", () => {
    const filters = parseHubSearchParams({
      search: "Summer",
      entityType: "shoot",
      status: "active",
      includeArchived: "true",
      cursor: "abc123",
      limit: "10",
    });

    expect(filters).toEqual({
      search: "Summer",
      entityType: "shoot",
      status: "active",
      includeArchived: true,
      cursor: "abc123",
      limit: 10,
    });
  });

  it("defaults to no filters, includeArchived false, and limit 20 when absent", () => {
    const filters = parseHubSearchParams({});
    expect(filters).toEqual({
      search: "",
      entityType: undefined,
      status: undefined,
      includeArchived: false,
      cursor: undefined,
      limit: 20,
    });
  });

  it("takes the first value when a parameter is repeated", () => {
    const filters = parseHubSearchParams({
      search: ["first", "second"],
      entityType: ["shoot", "campaign"],
      status: ["active", "blocked"],
      cursor: ["cursor-a", "cursor-b"],
      limit: ["5", "40"],
    });

    expect(filters.search).toBe("first");
    expect(filters.entityType).toBe("shoot");
    expect(filters.status).toBe("active");
    expect(filters.cursor).toBe("cursor-a");
    expect(filters.limit).toBe(5);
  });

  it("omits an invalid entityType instead of passing it through", () => {
    const filters = parseHubSearchParams({ entityType: "not-a-real-type" });
    expect(filters.entityType).toBeUndefined();
  });

  it("omits an invalid status instead of passing it through", () => {
    const filters = parseHubSearchParams({ status: "not-a-real-status" });
    expect(filters.status).toBeUndefined();
  });

  it("falls back to the default limit for a non-numeric value", () => {
    expect(parseHubSearchParams({ limit: "not-a-number" }).limit).toBe(20);
  });

  it("falls back to the default limit for a value above 50", () => {
    expect(parseHubSearchParams({ limit: "51" }).limit).toBe(20);
  });

  it("falls back to the default limit for a value below 1", () => {
    expect(parseHubSearchParams({ limit: "0" }).limit).toBe(20);
  });

  it("accepts the boundary limit of 50", () => {
    expect(parseHubSearchParams({ limit: "50" }).limit).toBe(50);
  });

  it("trims and truncates an overlong search to 100 characters — matches queries.ts's own cap", () => {
    // A larger Hub-side cap than the query layer's would let a 101-200 char
    // search through parseHubSearchParams only to fail listPlannerInstances
    // and throw to the error boundary — this bound must match exactly.
    const overlong = `  ${"a".repeat(150)}  `;
    const filters = parseHubSearchParams({ search: overlong });
    expect(filters.search).toHaveLength(100);
    expect(filters.search).toBe("a".repeat(100));
  });

  it("treats an overlong cursor as absent rather than forwarding it", () => {
    const filters = parseHubSearchParams({ cursor: "x".repeat(600) });
    expect(filters.cursor).toBeUndefined();
  });

  it("accepts a cursor at the 512-character boundary", () => {
    const cursor = "x".repeat(512);
    expect(parseHubSearchParams({ cursor }).cursor).toBe(cursor);
  });

  it.each(["has space", "has!bang", "has/slash", "has+plus", "has=equals"])(
    "treats a cursor with a non-base64url character as absent: %s",
    (cursor) => {
      expect(parseHubSearchParams({ cursor }).cursor).toBeUndefined();
    },
  );

  it("accepts a cursor containing only base64url characters (letters, digits, -, _)", () => {
    const cursor = "AbC123-_xyz";
    expect(parseHubSearchParams({ cursor }).cursor).toBe(cursor);
  });

  it("maps includeArchived=1 to true", () => {
    expect(parseHubSearchParams({ includeArchived: "1" }).includeArchived).toBe(true);
  });

  it("maps any other includeArchived value to false", () => {
    expect(parseHubSearchParams({ includeArchived: "yes" }).includeArchived).toBe(false);
  });

  it.each(["50% off", "under_score", "back\\slash"])(
    "passes a literal search string through unescaped: %s",
    (value) => {
      expect(parseHubSearchParams({ search: value }).search).toBe(value);
    },
  );
});

describe("hasActiveFilters", () => {
  it("is false when no filters are set", () => {
    expect(hasActiveFilters(parseHubSearchParams({}))).toBe(false);
  });

  it.each([
    { search: "x" },
    { entityType: "shoot" },
    { status: "active" },
    { includeArchived: "true" },
  ])("is true when %o is set", (raw) => {
    expect(hasActiveFilters(parseHubSearchParams(raw))).toBe(true);
  });
});

describe("buildHubUrl", () => {
  it("returns the bare route with no filters", () => {
    expect(buildHubUrl({})).toBe("/app/planner");
  });

  it("omits includeArchived from the URL when false (canonical URL rule)", () => {
    expect(buildHubUrl({ includeArchived: false })).toBe("/app/planner");
  });

  it("includes includeArchived=true when true", () => {
    expect(buildHubUrl({ includeArchived: true })).toBe("/app/planner?includeArchived=true");
  });

  it("omits limit when it equals the default", () => {
    expect(buildHubUrl({ limit: 20 })).toBe("/app/planner");
  });

  it("includes a non-default limit", () => {
    expect(buildHubUrl({ limit: 10 })).toContain("limit=10");
  });

  it("drops an existing cursor when a filter-change link explicitly clears it", () => {
    const filters = parseHubSearchParams({ cursor: "existing-cursor" });
    // Matches every real caller in hub-filters.tsx: spread current filters,
    // then explicitly null out `cursor` — a filter change must not reuse a
    // cursor issued under different filters (correction #3).
    const url = buildHubUrl({ ...filters, entityType: "shoot", cursor: undefined });
    expect(url).not.toContain("cursor=");
  });

  it("forwards an explicit cursor only when the caller passes one (pagination links)", () => {
    const url = buildHubUrl({ cursor: "next-page-cursor" });
    expect(url).toContain("cursor=next-page-cursor");
  });

  it("preserves multiple filters together", () => {
    const url = buildHubUrl({ search: "Summer", entityType: "shoot", status: "active" });
    expect(url).toContain("search=Summer");
    expect(url).toContain("entityType=shoot");
    expect(url).toContain("status=active");
  });
});
