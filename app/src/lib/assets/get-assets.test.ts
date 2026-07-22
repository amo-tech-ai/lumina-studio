import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeAssetsCursor } from "./list-assets-params";
import { escapeIlikePattern, listAssets } from "./get-assets";

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
    expect(builder.or).toHaveBeenCalledWith(expect.stringContaining("cloudinary_public_id.ilike.%runway%"));
    expect(builder.or).toHaveBeenCalledWith(
      expect.stringContaining(
        "created_at.gt.2026-07-20T12:00:00.000Z,and(created_at.eq.2026-07-20T12:00:00.000Z,id.gt.33333333-3333-4333-8333-333333333333)",
      ),
    );
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(builder.limit).toHaveBeenCalledWith(11);
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
