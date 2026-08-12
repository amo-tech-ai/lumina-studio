import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "https://nvdlhrodvevgwdsneplk.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe("handle_moderation_event — idempotency and version-bound", () => {
  const client = createClient(url, serviceKey);
  const brandId = "03720393-7cf0-4b06-bb67-7bf7ee3bc1a9"; // dev brand from previous QA
  let assetId: string;
  let cloudinaryAssetId: string;

  beforeAll(async () => {
    // Create a test asset and cloudinary_assets row for version 1
    const { data: asset } = await client.from("assets").insert({ brand_id: brandId, public_id: `test/handle-moderation-${Date.now()}` }).select("id").single();
    assetId = asset!.id;
    cloudinaryAssetId = `test-cloud-${Date.now()}`;
    await client.from("cloudinary_assets").insert({
      asset_id: assetId,
      public_id: `test/handle-moderation-${Date.now()}`,
      cloudinary_asset_id: cloudinaryAssetId,
      version: 1,
      moderation_status: "pending",
      status: "ready",
    });
  });

  afterAll(async () => {
    await client.from("asset_events").delete().eq("cloudinary_asset_id", cloudinaryAssetId);
    await client.from("cloudinary_assets").delete().eq("cloudinary_asset_id", cloudinaryAssetId);
    await client.from("assets").delete().eq("id", assetId);
  });

  it("same request_id retry is idempotent (no duplicate)", async () => {
    const requestId = `test-req-${Date.now()}`;
    const { data: d1 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: requestId,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(d1).toBe("changed");
    const { count: c1 } = await client.from("asset_events").select("id", { count: "exact" }).eq("request_id", requestId);
    const { data: d2 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: requestId,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(d2).toBe("unchanged"); // same-status no-op
    const { count: c2 } = await client.from("asset_events").select("id", { count: "exact" }).eq("request_id", requestId);
    expect(c2).toBe(c1);
  });

  it("same-status retry without request_id creates no duplicate (UUID only after lock)", async () => {
    // Ensure pending first
    await client.from("cloudinary_assets").update({ moderation_status: "pending" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    // Clean asset_events for this asset/version to isolate test
    await client.from("asset_events").delete().eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);

    const { data: d1 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(d1).toBe("changed");
    const { count: c1 } = await client.from("asset_events").select("id", { count: "exact" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    expect(c1).toBe(1);

    // Same-status retry without request_id — should return unchanged, no new row, UUID not generated
    const { data: d2 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(d2).toBe("unchanged");
    const { count: c2 } = await client.from("asset_events").select("id", { count: "exact" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    expect(c2).toBe(1);
  });

  it("approved → rejected → approved without request_id creates distinct rows (UUID fallback after lock)", async () => {
    await client.from("cloudinary_assets").update({ moderation_status: "pending" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    await client.from("asset_events").delete().eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);

    const { data: dApproved } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(dApproved).toBe("changed");

    const { data: dRejected } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "rejected",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(dRejected).toBe("changed");

    const { data: dApproved2 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(dApproved2).toBe("changed");

    const { data: events, count } = await client
      .from("asset_events")
      .select("id, request_id, metadata", { count: "exact" })
      .eq("cloudinary_asset_id", cloudinaryAssetId)
      .eq("version", 1)
      .order("created_at", { ascending: true });

    expect(count).toBe(3);
    // Each row should have a distinct UUID request_id (fallback) — not reusing same idempotency key
    const requestIds = (events ?? []).map((r: { request_id: string }) => r.request_id);
    expect(new Set(requestIds).size).toBe(3);
  });

  it("concurrent same-status retry with same request_id creates no duplicate (ON CONFLICT + unchanged)", async () => {
    await client.from("cloudinary_assets").update({ moderation_status: "pending" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    await client.from("asset_events").delete().eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);

    const requestId = `test-concurrent-${Date.now()}`;
    const p = {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: requestId,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    };

    // Simulate two concurrent deliveries with same request_id
    const [r1, r2] = await Promise.all([client.rpc("handle_moderation_event", p), client.rpc("handle_moderation_event", p)]);
    // One should be changed, other unchanged (or both changed but second ON CONFLICT skips insert, but our FOR UPDATE + same-status check makes second unchanged)
    expect([r1.data, r2.data].includes("changed")).toBe(true);
    const { count } = await client.from("asset_events").select("id", { count: "exact" }).eq("request_id", requestId);
    expect(count).toBe(1);
  });

  it("phantom asset/version returns unchanged (no false audit)", async () => {
    const { data } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: "non-existent-asset-id",
      p_version: 9999,
      p_moderation_status: "approved",
      p_request_id: `phantom-${Date.now()}`,
      p_moderation_kind: "manual",
      p_public_id: "test/phantom",
    });
    expect(data).toBe("unchanged");
  });
});
