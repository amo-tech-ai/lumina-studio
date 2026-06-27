// IPI-187 · MI-02 — lookupChannelSpecs unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

import { createClient } from "@supabase/supabase-js";
import { lookupChannelSpecs } from "./lookupChannelSpecs";

// Build a Supabase mock where from() returns different things per call
const mockFrom = vi.fn();

function makeRuleMock(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  return { select, eq1, eq2 };
}

function makeSpecMock(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const limit = vi.fn(() => ({ maybeSingle }));
  const in2 = vi.fn(() => ({ limit }));
  const in1 = vi.fn(() => ({ in: in2 }));
  const select = vi.fn(() => ({ in: in1 }));
  return { select, in1, in2 };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });
});

const STORY_SPEC_ROW = {
  width_px: 1080, height_px: 1920,
  aspect_ratio_w: 9, aspect_ratio_h: 16, aspect_ratio_label: "9:16",
  accepted_formats: ["jpg", "mp4"], max_file_size_mb: 30,
  safe_zone_top_px: 250, safe_zone_bottom_px: 250, safe_zone_left_px: 0, safe_zone_right_px: 0,
  organic: true, paid: true, shopping_support: false, crop_notes: null,
  last_verified_at: new Date().toISOString(),
  platforms: { slug: "instagram", name: "Instagram" },
  image_type_defs: { slug: "story", name: "Story" },
};

describe("lookupChannelSpecs", () => {
  it("returns spec for a known seeded channel", async () => {
    const ruleMock = makeRuleMock({ image_type_slugs: ["story"], platform_slugs: ["instagram"] });
    const specMock = makeSpecMock(STORY_SPEC_ROW);
    mockFrom.mockReturnValueOnce(ruleMock).mockReturnValueOnce(specMock);

    const result = await lookupChannelSpecs.execute!({ channels: ["instagram_story"] }, {} as never);

    // verify query contract
    expect(ruleMock.eq1).toHaveBeenCalledWith("rule_type", "channel_required");
    expect(ruleMock.eq2).toHaveBeenCalledWith("condition_value", "instagram_story");
    expect(specMock.in1).toHaveBeenCalledWith("platforms.slug", ["instagram"]);
    expect(specMock.in2).toHaveBeenCalledWith("image_type_defs.slug", ["story"]);

    expect(result.results).toHaveLength(1);
    const entry = result.results[0];
    expect(entry.channel).toBe("instagram_story");
    expect(entry.spec).not.toBeNull();
    expect(entry.spec!.widthPx).toBe(1080);
    expect(entry.spec!.heightPx).toBe(1920);
    expect(entry.spec!.aspectRatioLabel).toBe("9:16");
    expect(entry.warning).toBeUndefined();
  });

  it("returns null spec with warning for unknown channel — never fabricates", async () => {
    const result = await lookupChannelSpecs.execute!({ channels: ["pinterest"] }, {} as never);

    expect(result.results).toHaveLength(1);
    const entry = result.results[0];
    expect(entry.channel).toBe("pinterest");
    expect(entry.spec).toBeNull();
    expect(entry.warning).toMatch(/Unknown channel/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("handles mixed known + unknown in one call", async () => {
    mockFrom
      .mockReturnValueOnce(makeRuleMock({ image_type_slugs: ["feed"], platform_slugs: ["facebook"] }))
      .mockReturnValueOnce(makeSpecMock({
        width_px: 1200, height_px: 628,
        aspect_ratio_w: 1.91, aspect_ratio_h: 1, aspect_ratio_label: "1.91:1",
        accepted_formats: ["jpg", "png"], max_file_size_mb: 10,
        safe_zone_top_px: 0, safe_zone_bottom_px: 0, safe_zone_left_px: 0, safe_zone_right_px: 0,
        organic: true, paid: true, shopping_support: true, crop_notes: null,
        last_verified_at: new Date().toISOString(),
        platforms: { slug: "facebook", name: "Facebook" },
        image_type_defs: { slug: "feed", name: "Feed" },
      }));

    const result = await lookupChannelSpecs.execute!({ channels: ["facebook", "youtube"] }, {} as never);

    expect(result.results).toHaveLength(2);
    const fb = result.results.find((r) => r.channel === "facebook");
    const yt = result.results.find((r) => r.channel === "youtube");
    expect(fb?.spec?.widthPx).toBe(1200);
    expect(yt?.spec).toBeNull();
    expect(yt?.warning).toMatch(/Unknown channel/);
  });
});
