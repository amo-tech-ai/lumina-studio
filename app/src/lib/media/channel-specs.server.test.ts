import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllChannelSpecs, getChannelSpec } from "./channel-specs.server";

type RuleRow = { image_type_slugs: string[]; platform_slugs: string[] } | null;
type SpecRow = Record<string, unknown> | null;

/**
 * getChannelSpec makes two sequential queries on ONE client instance:
 * recommendation_rules (filtered by condition_value = channel), then
 * image_specs (filtered by the rule's platform/image_type slugs). This
 * fake tracks which channel a client instance is resolving (captured off
 * the first .eq("condition_value", ...) call) so the second query's
 * resolver can be keyed by the same channel.
 */
function mockSupabase(resolvers: {
  rule: (channel: string) => RuleRow;
  spec: (channel: string, platformSlugs: string[], imageTypeSlugs: string[]) => SpecRow;
}) {
  (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockImplementation(async () => {
    let table = "";
    let channel = "";
    let platformSlugs: string[] = [];
    let imageTypeSlugs: string[] = [];
    const chain = {
      from(t: string) {
        table = t;
        return chain;
      },
      select() {
        return chain;
      },
      eq(col: string, val: string) {
        if (col === "condition_value") channel = val;
        return chain;
      },
      in(col: string, vals: string[]) {
        if (col === "platforms.slug") platformSlugs = vals;
        if (col === "image_type_defs.slug") imageTypeSlugs = vals;
        return chain;
      },
      limit() {
        return chain;
      },
      async maybeSingle() {
        if (table === "recommendation_rules") return { data: resolvers.rule(channel) };
        if (table === "image_specs") return { data: resolvers.spec(channel, platformSlugs, imageTypeSlugs) };
        return { data: null };
      },
    };
    return chain;
  });
}

const FULL_SPEC_ROW = {
  width_px: 1080,
  height_px: 1350,
  aspect_ratio_w: 4,
  aspect_ratio_h: 5,
  aspect_ratio_label: "4:5",
  accepted_formats: ["jpg", "png"],
  max_file_size_mb: 30,
  safe_zone_top_px: 100,
  safe_zone_bottom_px: 200,
  safe_zone_left_px: 10,
  safe_zone_right_px: 20,
  organic: true,
  paid: false,
  shopping_support: true,
  crop_notes: "Keep subject centered",
  platforms: { slug: "instagram", name: "Instagram" },
  image_type_defs: { slug: "feed_post", name: "Feed Post" },
};

afterEach(() => vi.restoreAllMocks());

describe("getChannelSpec", () => {
  it("maps a fully-populated spec row to a ChannelSpec, field for field", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: ["instagram"] }),
      spec: () => FULL_SPEC_ROW,
    });

    const result = await getChannelSpec("instagram_feed");

    expect(result).toEqual({
      channel: "instagram_feed",
      platformSlug: "instagram",
      platformName: "Instagram",
      imageTypeSlug: "feed_post",
      imageTypeName: "Feed Post",
      widthPx: 1080,
      heightPx: 1350,
      aspectRatioW: 4,
      aspectRatioH: 5,
      aspectRatioLabel: "4:5",
      acceptedFormats: ["jpg", "png"],
      maxFileSizeMb: 30,
      safeZone: { top: 100, bottom: 200, left: 10, right: 20 },
      organic: true,
      paid: false,
      shoppingSupport: true,
      cropNotes: "Keep subject centered",
    });
  });

  it("returns null when no recommendation_rules row matches the channel", async () => {
    mockSupabase({ rule: () => null, spec: () => FULL_SPEC_ROW });
    expect(await getChannelSpec("facebook")).toBeNull();
  });

  it("returns null when the rule has an empty image_type_slugs array", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: [], platform_slugs: ["instagram"] }),
      spec: () => FULL_SPEC_ROW,
    });
    expect(await getChannelSpec("instagram_feed")).toBeNull();
  });

  it("returns null when the rule has an empty platform_slugs array", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: [] }),
      spec: () => FULL_SPEC_ROW,
    });
    expect(await getChannelSpec("instagram_feed")).toBeNull();
  });

  it("returns null when no image_specs row matches the rule's slugs", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: ["instagram"] }),
      spec: () => null,
    });
    expect(await getChannelSpec("instagram_feed")).toBeNull();
  });

  it("returns null when the matched spec row has no joined platforms record", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: ["instagram"] }),
      spec: () => ({ ...FULL_SPEC_ROW, platforms: null }),
    });
    expect(await getChannelSpec("instagram_feed")).toBeNull();
  });

  it("returns null when the matched spec row has no joined image_type_defs record", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: ["instagram"] }),
      spec: () => ({ ...FULL_SPEC_ROW, image_type_defs: null }),
    });
    expect(await getChannelSpec("instagram_feed")).toBeNull();
  });

  it("null-coalesces missing safe-zone px values to 0 and missing accepted_formats to []", async () => {
    mockSupabase({
      rule: () => ({ image_type_slugs: ["feed_post"], platform_slugs: ["instagram"] }),
      spec: () => ({
        ...FULL_SPEC_ROW,
        accepted_formats: null,
        safe_zone_top_px: null,
        safe_zone_bottom_px: null,
        safe_zone_left_px: null,
        safe_zone_right_px: null,
      }),
    });

    const result = await getChannelSpec("instagram_feed");
    expect(result?.acceptedFormats).toEqual([]);
    expect(result?.safeZone).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });
});

describe("getAllChannelSpecs", () => {
  it("returns a record keyed by all 4 PREVIEW_CHANNELS with independent per-channel results", async () => {
    // Only facebook has a real rule/spec; the other 3 channels resolve null,
    // each for a different reason (no rule / empty slugs / no spec row) —
    // proving getAllChannelSpecs doesn't let one channel's success leak
    // into another's result via shared mutable state.
    mockSupabase({
      rule: (channel) => {
        if (channel === "facebook") return { image_type_slugs: ["feed_post"], platform_slugs: ["facebook"] };
        if (channel === "instagram_feed") return { image_type_slugs: [], platform_slugs: ["instagram"] };
        if (channel === "instagram_story") return null;
        return { image_type_slugs: ["story"], platform_slugs: ["tiktok"] }; // tiktok
      },
      spec: (channel) => {
        if (channel === "facebook") return { ...FULL_SPEC_ROW, platforms: { slug: "facebook", name: "Facebook" } };
        if (channel === "tiktok") return null; // rule resolves, but no spec row
        return FULL_SPEC_ROW;
      },
    });

    const result = await getAllChannelSpecs();

    expect(Object.keys(result).sort()).toEqual(
      ["facebook", "instagram_feed", "instagram_story", "tiktok"].sort(),
    );
    expect(result.facebook?.platformSlug).toBe("facebook");
    expect(result.instagram_feed).toBeNull(); // empty image_type_slugs
    expect(result.instagram_story).toBeNull(); // no rule row
    expect(result.tiktok).toBeNull(); // rule resolves, but spec lookup misses
  });
});
