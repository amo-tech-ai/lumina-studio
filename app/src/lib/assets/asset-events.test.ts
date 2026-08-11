import { describe, expect, it, vi, beforeEach } from "vitest";

import { getAssetEvents, formatAssetEventKind } from "./asset-events";

const ASSET_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function mockClient(overrides: Record<string, unknown> = {}) {
  const assetsMaybeSingle = vi.fn().mockResolvedValue({ data: { id: ASSET_ID }, error: null });
  const eventsSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: "1",
                asset_id: ASSET_ID,
                cloudinary_asset_id: "abc",
                version: 1,
                kind: "upload",
                actor_id: null,
                reason: null,
                metadata: {},
                created_at: new Date().toISOString(),
              },
              {
                id: "2",
                asset_id: ASSET_ID,
                cloudinary_asset_id: "abc",
                version: 2,
                kind: "overwrite",
                actor_id: null,
                reason: null,
                metadata: {},
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
        }),
      }),
    }),
  });

  const from = vi.fn((table: string) => {
    if (table === "assets") {
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: assetsMaybeSingle }) }) };
    }
    if (table === "asset_events") {
      return { select: eventsSelect };
    }
    throw new Error(table);
  });

  return { from, assetsMaybeSingle, eventsSelect, ...overrides } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

describe("getAssetEvents", () => {
  it("returns events in reverse-chronological order when asset is readable", async () => {
    const client = mockClient();
    const res = await getAssetEvents(client as never, ASSET_ID);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toHaveLength(2);
  });

  it("returns 404 when asset not found (RLS or missing)", async () => {
    const assetsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn((table: string) => {
      if (table === "assets") return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: assetsMaybeSingle }) }) };
      throw new Error(table);
    });
    const client = { from } as unknown as import("@supabase/supabase-js").SupabaseClient;
    const res = await getAssetEvents(client as never, ASSET_ID);
    expect(res).toEqual(expect.objectContaining({ ok: false, status: 404 }));
  });

  it("rejects out-of-range limit", async () => {
    const client = mockClient();
    const res = await getAssetEvents(client as never, ASSET_ID, { limit: 999 });
    expect(res).toEqual(expect.objectContaining({ ok: false, status: 500 }));
  });
});

describe("formatAssetEventKind", () => {
  it.each([
    ["upload", "Uploaded"],
    ["rename", "Renamed"],
    ["overwrite", "Updated"],
    ["approved", "Approved"],
    ["archived", "Archived"],
  ])("maps %s to %s", (kind, label) => {
    expect(formatAssetEventKind(kind)).toBe(label);
  });
});
