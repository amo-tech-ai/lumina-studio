import { describe, expect, it, vi } from "vitest";
import { getShootDetail } from "./get-shoot-detail";

describe("getShootDetail", () => {
  it("returns payload on success", async () => {
    const payload = {
      shoot: { id: "s1", name: "Spring", currency: "USD" },
      brand: { id: "b1", name: "Acme" },
      deliverables: [],
      shots: [],
      assets: [],
      crew: [],
      approvals: [],
      activity: [],
    };
    const userSb = {
      rpc: vi.fn().mockResolvedValue({ data: payload, error: null }),
    };
    const result = await getShootDetail(userSb as never, "s1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.shoot.name).toBe("Spring");
  });

  it("maps not_found to 404", async () => {
    const userSb = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "P0002", message: "not_found" } }),
    };
    const result = await getShootDetail(userSb as never, "missing");
    expect(result).toEqual({ ok: false, status: 404, error: "Shoot not found" });
  });
});
