import { describe, expect, it } from "vitest";

import {
  buildAssetsLibraryUrl,
  decodeAssetsCursor,
  encodeAssetsCursor,
  normalizeAssetTag,
  parseAssetsLibraryParams,
  toListAssetsInput,
} from "./list-assets-params";

describe("parseAssetsLibraryParams", () => {
  it("parses the happy-path URL contract", () => {
    const result = parseAssetsLibraryParams({
      q: " runway ",
      brand: "11111111-1111-4111-8111-111111111111",
      status: "ready,final",
      tags: "Editorial, Approved",
      sort: "oldest",
      limit: "10",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.query).toBe("runway");
    expect(result.data.brandId).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.data.status).toEqual(["ready", "final"]);
    expect(result.data.tags).toEqual(["editorial", "approved"]);
    expect(result.data.sort).toBe("oldest");
    expect(result.data.limit).toBe(10);
  });

  it("rejects invalid sort, status, brand, limit, and cursor", () => {
    expect(parseAssetsLibraryParams({ sort: "hot" }).ok).toBe(false);
    expect(parseAssetsLibraryParams({ status: "ready,nope" }).ok).toBe(false);
    expect(parseAssetsLibraryParams({ brand: "not-a-uuid" }).ok).toBe(false);
    expect(parseAssetsLibraryParams({ limit: "0" }).ok).toBe(false);
    expect(parseAssetsLibraryParams({ limit: "51" }).ok).toBe(false);
    expect(parseAssetsLibraryParams({ cursor: "!!!bad!!!" }).ok).toBe(false);
  });

  it("defaults sort/limit and ignores brand=all", () => {
    const result = parseAssetsLibraryParams({ brand: "all" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.brandId).toBeUndefined();
    expect(result.data.sort).toBe("newest");
    expect(result.data.limit).toBe(24);
  });
});

describe("assets cursor codec", () => {
  it("round-trips createdAt + id", () => {
    const encoded = encodeAssetsCursor({
      createdAt: "2026-07-20T12:00:00.000Z",
      id: "22222222-2222-4222-8222-222222222222",
    });
    expect(decodeAssetsCursor(encoded)).toEqual({
      createdAt: "2026-07-20T12:00:00.000Z",
      id: "22222222-2222-4222-8222-222222222222",
    });
  });

  it("toListAssetsInput decodes a valid cursor token", () => {
    const encoded = encodeAssetsCursor({
      createdAt: "2026-07-20T12:00:00.000Z",
      id: "22222222-2222-4222-8222-222222222222",
    });
    const parsed = parseAssetsLibraryParams({ cursor: encoded, q: "x" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const input = toListAssetsInput(parsed.data);
    expect(input.cursor?.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(input.query).toBe("x");
  });
});

describe("buildAssetsLibraryUrl", () => {
  it("omits defaults and drops empty filters", () => {
    expect(buildAssetsLibraryUrl({})).toBe("/app/assets");
    expect(
      buildAssetsLibraryUrl({
        query: "runway",
        brandId: "11111111-1111-4111-8111-111111111111",
        status: ["ready"],
        tags: ["editorial"],
        sort: "oldest",
        limit: 10,
        cursor: "abc",
      }),
    ).toBe(
      "/app/assets?brand=11111111-1111-4111-8111-111111111111&q=runway&status=ready&tags=editorial&sort=oldest&limit=10&cursor=abc",
    );
  });
});

describe("normalizeAssetTag", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeAssetTag("  Editorial  Shoot ")).toBe("editorial shoot");
  });
});
