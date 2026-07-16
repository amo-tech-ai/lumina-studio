import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAssets } from "./get-assets";

function mockClient(response: { data: unknown; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn(async () => response),
  };
  return { from: vi.fn(() => builder), _builder: builder } as never;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listAssets", () => {
  it("returns the ordered rows on success, each with a resolved displayUrl", async () => {
    const rows = [{ id: "a1" }, { id: "a2" }];
    const client = mockClient({ data: rows, error: null });

    const result = await listAssets(client);

    expect(result).toEqual(rows.map((r) => ({ ...r, displayUrl: null })));
    expect((client as unknown as { from: ReturnType<typeof vi.fn> }).from).toHaveBeenCalledWith("assets");
    const builder = (client as unknown as { _builder: { order: ReturnType<typeof vi.fn> } })._builder;
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns an honest empty list rather than null", async () => {
    const client = mockClient({ data: null, error: null });
    const result = await listAssets(client);
    expect(result).toEqual([]);
  });

  it("propagates a real query error instead of swallowing it", async () => {
    const client = mockClient({ data: null, error: { message: "boom" } });
    await expect(listAssets(client)).rejects.toThrow("boom");
  });

  it("resolves a public Cloudinary transform when no public_id exists (legacy/fixture URL path)", async () => {
    const rows = [
      { id: "a1", url: "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/a1.jpg", cloudinary_public_id: null },
    ];
    const client = mockClient({ data: rows, error: null });
    const [result] = await listAssets(client);
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
    const [result] = await listAssets(client);
    expect(result.displayUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/image\/authenticated\/s--[\w-]+--\//);
    expect(result.displayUrl).toContain("real-upload-01");
  });

  it("falls back to a null displayUrl (not a page-crashing throw) when signing fails for a public_id asset", async () => {
    // Hermetic: signing must fail even when the developer shell has
    // CLOUDINARY_* from .env.local (pre-push / local vitest).
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const rows = [{ id: "a1", cloudinary_public_id: "real-upload-01", url: null }];
    const client = mockClient({ data: rows, error: null });
    const [result] = await listAssets(client);
    expect(result.displayUrl).toBeNull();
  });
});
