import { describe, expect, it } from "vitest";
import {
  CHANNEL_PLATFORM,
  PREVIEW_CHANNELS,
  PREVIEW_PLATFORMS,
  channelsForPlatform,
  emptyChannelSpecs,
} from "./channel-specs";

describe("preview channel registry", () => {
  it("lists the 9 live-seeded channel slugs and no fabricated facebook_story", () => {
    expect([...PREVIEW_CHANNELS]).toEqual([
      "instagram_feed",
      "instagram_story",
      "instagram_reel",
      "facebook",
      "tiktok",
      "pinterest",
      "youtube",
      "amazon",
      "shopify",
    ]);
    expect(PREVIEW_CHANNELS).not.toContain("facebook_story");
  });

  it("derives Instagram placements from CHANNEL_PLATFORM, including Reel", () => {
    expect(channelsForPlatform("instagram")).toEqual([
      "instagram_feed",
      "instagram_story",
      "instagram_reel",
    ]);
  });

  it("gives Facebook only its verified Feed placement", () => {
    expect(channelsForPlatform("facebook")).toEqual(["facebook"]);
  });

  it("covers every PREVIEW_CHANNELS slug exactly once across platforms", () => {
    const grouped = PREVIEW_PLATFORMS.flatMap(channelsForPlatform);
    expect(grouped).toEqual([...PREVIEW_CHANNELS]);
    expect(PREVIEW_CHANNELS.every((c) => CHANNEL_PLATFORM[c])).toBe(true);
  });

  it("emptyChannelSpecs is keyed by every preview channel and starts null", () => {
    const empty = emptyChannelSpecs();
    expect(Object.keys(empty).sort()).toEqual([...PREVIEW_CHANNELS].sort());
    expect(Object.values(empty).every((v) => v === null)).toBe(true);
  });
});
