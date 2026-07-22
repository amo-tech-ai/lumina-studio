import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeAssetsCursor } from "./list-assets-params";
import {
  escapeIlikePattern,
  getAssetDetail,
  listAssets,
  quotePostgrestValue,
} from "./get-assets";

function mockClient(response: { data: unknown; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => response),
  };
  return { from: vi.fn(() => builder), _builder: builder } as never;
}

function mockDetailClient(response: { data: unknown; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => response),
  };
  return { from: vi.fn(() => builder), _builder: builder } as never;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("escapeIlikePattern", () => {
  it("escapes ILIKE wildcards", () => {
    expect(escapeIlikePattern("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});

describe("quotePostgrestValue", () => {
  it("wraps values and doubles embedded quotes", () => {
    expect(quotePostgrestValue("%spring, summer%")).toBe('"%spring, summer%"');
    expect(quotePostgrestValue('say "hi"')).toBe('"say ""hi"""');
  });
});

describe("listAssets", () => {
  it("returns a cursor page ordered newest-first by default", async () => {
    const rows = [{ id: "a1", created_at: "2026-07-20T00:00:00.000Z" }, { id: "a2", created_at: "2026-07-19T00:00:00.000Z" }];
    const client = mockClient({ data: rows, error: null });

    const result = await listAssets(client);

    expect(result.items).toEqual(rows.map((r) => ({ ...r, displayUrl: null })));
    expect(result.nextCursor).toBeNull();
    expect((client as unknown as { from: ReturnType<typeof vi.fn> }).from).toHaveBeenCalledWith("assets");
    const builder = (client as unknown as { _builder: { order: ReturnType<typeof vi.fn>; limit: ReturnType<typeof vi.fn> } })
      ._builder;
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(builder.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(25);
  });

  it("applies brand, status, tags, query, sort, and cursor filters in Postgres", async () => {
    const client = mockClient({ data: [], error: null });
    const cursor = {
      createdAt: "2026-07-20T12:00:00.000Z",
      id: "33333333-3333-4333-8333-333333333333",
    };

    await listAssets(client, {
      brandId: "11111111-1111-4111-8111-111111111111",
      status: ["ready", "final"],
      tags: ["Editorial"],
      query: "runway",
      sort: "oldest",
      cursor,
      limit: 10,
    });

    const builder = (
      client as unknown as {
        _builder: {
          eq: ReturnType<typeof vi.fn>;
          in: ReturnType<typeof vi.fn>;
          contains: ReturnType<typeof vi.fn>;
          or: ReturnType<typeof vi.fn>;
          order: ReturnType<typeof vi.fn>;
          limit: ReturnType<typeof vi.fn>;
        };
      }
    )._builder;

    expect(builder.eq).toHaveBeenCalledWith("brand_id", "11111111-1111-4111-8111-111111111111");
    expect(builder.in).toHaveBeenCalledWith("status", ["ready", "final"]);
    expect(builder.contains).toHaveBeenCalledWith("tags", ["editorial"]);
    // One combined .or() so search is not dropped when cursor is present.
    expect(builder.or).toHaveBeenCalledTimes(1);
    const orArg = builder.or.mock.calls[0][0] as string;
    expect(orArg).toContain('and(or(');
    expect(orArg).toContain('cloudinary_public_id.ilike."%runway%"');
    expect(orArg).toContain(
      'created_at.gt."2026-07-20T12:00:00.000Z",and(created_at.eq."2026-07-20T12:00:00.000Z",id.gt."33333333-3333-4333-8333-333333333333")',
    );
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(builder.limit).toHaveBeenCalledWith(11);
  });

  it("quotes commas inside free-text search so PostgREST .or() does not split the pattern", async () => {
    const client = mockClient({ data: [], error: null });
    await listAssets(client, { query: "spring, summer" });
    const builder = (client as unknown as { _builder: { or: ReturnType<typeof vi.fn> } })._builder;
    expect(builder.or).toHaveBeenCalledTimes(1);
    const orArg = builder.or.mock.calls[0][0] as string;
    expect(orArg).toContain('cloudinary_public_id.ilike."%spring, summer%"');
    expect(orArg).not.toMatch(/ilike\.%spring, summer%/);
  });

  it("emits nextCursor when more than limit rows return", async () => {
    const rows = [
      { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-07-20T00:00:00.000Z" },
      { id: "22222222-2222-4222-8222-222222222222", created_at: "2026-07-19T00:00:00.000Z" },
    ];
    const client = mockClient({ data: rows, error: null });
    const result = await listAssets(client, { limit: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe(
      encodeAssetsCursor({
        createdAt: "2026-07-20T00:00:00.000Z",
        id: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });

  it("returns an honest empty list rather than null", async () => {
    const client = mockClient({ data: null, error: null });
    const result = await listAssets(client);
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("propagates a real query error instead of swallowing it", async () => {
    const client = mockClient({ data: null, error: { message: "boom" } });
    await expect(listAssets(client)).rejects.toThrow("boom");
  });

  it("rejects an out-of-range limit", async () => {
    const client = mockClient({ data: [], error: null });
    await expect(listAssets(client, { limit: 51 })).rejects.toThrow(/between 1 and 50/);
  });

  it("resolves a public Cloudinary transform when no public_id exists (legacy/fixture URL path)", async () => {
    const rows = [
      { id: "a1", url: "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/a1.jpg", cloudinary_public_id: null },
    ];
    const client = mockClient({ data: rows, error: null });
    const [result] = (await listAssets(client)).items;
    expect(result.displayUrl).toBe(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/c_limit,w_600,f_auto,q_auto/v1/a1.jpg",
    );
  });

  it("resolves a signed authenticated URL when cloudinary_public_id is present — real uploads are never public", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
    const rows = [{ id: "a1", cloudinary_public_id: "real-upload-01", url: "https://example.com/unused.jpg" }];
    const client = mockClient({ data: rows, error: null });
    const [result] = (await listAssets(client)).items;
    expect(result.displayUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/image\/authenticated\/s--[\w-]+--\//);
    expect(result.displayUrl).toContain("real-upload-01");
  });

  it("falls back to a null displayUrl (not a page-crashing throw) when signing fails for a public_id asset", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const rows = [{ id: "a1", cloudinary_public_id: "real-upload-01", url: null }];
    const client = mockClient({ data: rows, error: null });
    const [result] = (await listAssets(client)).items;
    expect(result.displayUrl).toBeNull();
  });
});

describe("getAssetDetail", () => {
  it("returns 404 when the asset is missing (or RLS hides it)", async () => {
    const client = mockDetailClient({ data: null, error: null });
    await expect(getAssetDetail(client, "missing")).resolves.toEqual({ ok: false, status: 404 });
  });

  it("returns 500 when the query errors", async () => {
    const client = mockDetailClient({ data: null, error: { message: "boom" } });
    await expect(getAssetDetail(client, "a1")).resolves.toEqual({ ok: false, status: 500 });
  });

  it("omits invented identity when the Cloudinary mirror is absent", async () => {
    const client = mockDetailClient({
      data: {
        id: "a1",
        brand_id: "b1",
        brand: { name: "Acme" },
        asset_type: "image",
        cloudinary_public_id: null,
        url: "https://example.com/x.jpg",
        thumbnail_url: null,
        shoot_id: null,
        tags: ["runway"],
        width: null,
        height: null,
        file_size: null,
        mime_type: null,
        status: "ready",
        dna_score: null,
        dna_status: null,
        dna_pillars: {},
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
        mirror: null,
        asset_links: [],
        commerce_product_links: [],
      },
      error: null,
    });

    const result = await getAssetDetail(client, "a1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.mirror).toBeNull();
    expect(result.data.consoleUrl).toBeNull();
    expect(result.data.whereUsed).toEqual([]);
    expect(result.data.tags).toEqual(["runway"]);
  });

  it("maps optional mirror identity + Where Used joins without inventing missing fields", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");

    const client = mockDetailClient({
      data: {
        id: "a1",
        brand_id: "b1",
        brand: { name: "Acme" },
        asset_type: "image",
        cloudinary_public_id: "brand/look-01",
        url: "https://example.com/unused.jpg",
        thumbnail_url: null,
        shoot_id: "shoot-1",
        tags: null,
        width: 10,
        height: 10,
        file_size: 70,
        mime_type: "image/png",
        status: "ready",
        dna_score: 88,
        dna_status: "approved",
        dna_pillars: {},
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
        mirror: {
          public_id: "brand/look-01",
          cloudinary_asset_id: null,
          version: null,
          delivery_type: "authenticated",
          width: 1,
          height: 1,
          bytes: 70,
          format: "png",
          resource_type: "image",
          folder: "brand",
        },
        asset_links: [
          { entity_type: "shoot", entity_id: "shoot-1" },
          { entity_type: "event", entity_id: "event-9" },
        ],
        commerce_product_links: [{ medusa_product_id: "prod-42" }],
      },
      error: null,
    });

    const result = await getAssetDetail(client, "a1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.mirror?.delivery_type).toBe("authenticated");
    expect(result.data.mirror?.cloudinary_asset_id).toBeNull();
    expect(result.data.mirror?.version).toBeNull();
    expect(result.data.displayUrl).toContain("brand/look-01");
    expect(result.data.displayUrl).toContain("w_1600");
    expect(result.data.consoleUrl).toContain("media_library/search");
    expect(result.data.consoleUrl).toContain(encodeURIComponent("public_id=brand/look-01"));
    expect(result.data.whereUsed).toEqual([
      { kind: "shoot", id: "shoot-1", label: "Shoot · shoot-1", href: "/app/shoots/shoot-1" },
      { kind: "event", id: "event-9", label: "Event · event-9", href: null },
      { kind: "product", id: "prod-42", label: "Product · prod-42", href: null },
    ]);
  });
});
