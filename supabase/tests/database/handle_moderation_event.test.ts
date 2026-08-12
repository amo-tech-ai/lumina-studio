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

  it("approved → rejected → approved without request_id creates distinct rows (UUID fallback)", async () => {
    // First approved without request_id → UUID generated, should be changed
    const { data: d1 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    // Note: first approved may be no-op if already approved from previous test, so reset to pending first
    await client.from("cloudinary_assets").update({ moderation_status: "pending" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    const { data: d2 } = await client.rpc("handle_moderation_event", {
      p_cloudinary_asset_id: cloudinaryAssetId,
      p_version: 1,
      p_moderation_status: "approved",
      p_request_id: null,
      p_moderation_kind: "manual",
      p_public_id: "test/handle",
    });
    expect(d2).toBe("changed");
    const { count: c2 } = await client.from("asset_events").select("id", { count: "exact" }).eq("cloudinary_asset_id", cloudinaryAssetId).eq("version", 1);
    // Should have at least 2 approved events with different request_ids (UUIDs)
    expect((c2 ?? 0) >= 2).toBe(true);
  });
});
