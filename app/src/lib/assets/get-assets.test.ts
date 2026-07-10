import { describe, expect, it, vi } from "vitest";
import { listAssets } from "./get-assets";

function mockClient(response: { data: unknown; error: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn(async () => response),
  };
  return { from: vi.fn(() => builder), _builder: builder } as never;
}

describe("listAssets", () => {
  it("returns the ordered rows on success", async () => {
    const rows = [{ id: "a1" }, { id: "a2" }];
    const client = mockClient({ data: rows, error: null });

    const result = await listAssets(client);

    expect(result).toEqual(rows);
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
});
