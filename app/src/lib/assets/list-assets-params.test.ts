import { describe, expect, it } from "vitest";

import {
  buildAssetsLibraryUrl,
  decodeAssetsCursor,
  decodeTags,
  encodeAssetsCursor,
  encodeTags,
  formatTagsDraft,
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

describe("tag codec SSOT (encodeTags / decodeTags / formatTagsDraft)", () => {
  function roundTrip(tags: string[]): string[] {
    return decodeTags(formatTagsDraft(tags));
  }

  it("keeps a single plain tag unchanged", () => {
    expect(roundTrip(["Nike"])).toEqual(["nike"]);
    expect(formatTagsDraft(["Nike"])).toBe(encodeTags(["Nike"]));
  });

  it("treats typed CSV as two tags", () => {
    expect(decodeTags("Nike, Adidas")).toEqual(["nike", "adidas"]);
  });

  it("keeps a single comma-containing tag intact", () => {
    expect(roundTrip(["Brand, Inc."])).toEqual(["brand, inc."]);
  });

  it("preserves mixed comma and non-comma tags", () => {
    expect(roundTrip(["Brand, Inc.", "Nike"])).toEqual(["brand, inc.", "nike"]);
  });

  it("is identical after encode → draft → decode (reload → submit)", () => {
    const original = ["brand, inc.", "nike"];
    const draft = formatTagsDraft(original);
    const afterSubmit = decodeTags(draft);
    expect(afterSubmit).toEqual(original);
    expect(decodeTags(encodeTags(afterSubmit))).toEqual(original);
  });

  it("ignores empty tag segments", () => {
    expect(decodeTags("nike,, ,adidas")).toEqual(["nike", "adidas"]);
    expect(roundTrip(["", "  ", "nike"])).toEqual(["nike"]);
  });

  it("preserves duplicate tags (no silent dedupe)", () => {
    expect(roundTrip(["nike", "nike"])).toEqual(["nike", "nike"]);
  });

  it("formatTagsDraft always uses encodeTags escaping", () => {
    const tags = ["Brand, Inc.", "runway"];
    expect(formatTagsDraft(tags)).toBe(encodeTags(tags));
    expect(formatTagsDraft(["editorial", "approved"])).toBe(encodeTags(["editorial", "approved"]));
  });

  it("buildAssetsLibraryUrl round-trips comma tags through parse", () => {
    const url = buildAssetsLibraryUrl({ tags: ["Brand, Inc.", "runway"] });
    const tagsParam = new URLSearchParams(url.split("?")[1] ?? "").get("tags");
    expect(decodeTags(tagsParam ?? "")).toEqual(["brand, inc.", "runway"]);

    const parsed = parseAssetsLibraryParams({ tags: tagsParam ?? undefined });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.tags).toEqual(["brand, inc.", "runway"]);
  });
});
