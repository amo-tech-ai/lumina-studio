import { describe, expect, it, vi } from "vitest";
import { getBrandAssets } from "./get-brand-assets";

describe("getBrandAssets", () => {
  it("returns normalized assets on success", async () => {
    const rows = [
      { id: "a1", source: "platform", url: "https://x/a.jpg", created_at: "2026-01-01" },
    ];
    const userSb = {
      rpc: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    const result = await getBrandAssets(userSb as never, "brand-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.length).toBe(1);
  });

  it("maps not_found to 404", async () => {
    const userSb = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "P0002", message: "not_found" } }),
    };
    const result = await getBrandAssets(userSb as never, "missing");
    expect(result).toEqual({ ok: false, status: 404, error: "Brand or shoot not found" });
  });
});
