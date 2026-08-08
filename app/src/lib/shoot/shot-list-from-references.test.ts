import { describe, expect, it } from "vitest";
import {
  buildShotListFromReferences,
  channelMatchesReference,
  toReferenceChannel,
  type ReferenceShotType,
} from "./shot-list-from-references";

const REFS: ReferenceShotType[] = [
  {
    id: "ref-1",
    angle: "Ghost front",
    description: "Full front view on ghost/invisible mannequin",
    channel_fit: ["shopify_pdp", "amazon"],
    background: "white",
  },
  {
    id: "ref-2",
    angle: "Half body",
    description: "Waist-up model shot",
    channel_fit: ["instagram_feed", "instagram_story"],
    background: "studio_gradient",
  },
];

describe("shot-list-from-references", () => {
  it("maps shopify wizard channel to shopify_pdp for reference matching", () => {
    expect(toReferenceChannel("shopify")).toBe("shopify_pdp");
    expect(channelMatchesReference("shopify", ["shopify_pdp"])).toBe(true);
    expect(channelMatchesReference("instagram_feed", ["instagram_feed", "tiktok"])).toBe(true);
  });

  it("builds shots using reference angles — never generic front/3/4/detail", () => {
    const { shots } = buildShotListFromReferences(
      [{ id: "d1", channel: "instagram_feed", format: "1:1 JPG", quantity: 6 }],
      REFS,
    );
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((s) => REFS.some((r) => r.angle === s.angle))).toBe(true);
    expect(shots.some((s) => s.angle === "front")).toBe(false);
    expect(shots.every((s) => s.reference_id)).toBe(true);
  });

  it("refuses empty reference_shot_types", () => {
    expect(() =>
      buildShotListFromReferences([{ channel: "amazon", quantity: 4 }], []),
    ).toThrow(/lookupShotReferences/);
  });

  it("refuses empty approved deliverables at tool schema — builder needs at least one row", () => {
    expect(() => buildShotListFromReferences([], REFS)).not.toThrow();
    expect(buildShotListFromReferences([], REFS).shots).toHaveLength(0);
  });

  it("returns zero shots and an uncovered warning when channel has no compatible references", () => {
    const { shots, uncovered_deliverable_warnings } = buildShotListFromReferences(
      [{ channel: "tiktok", format: "9:16 video", quantity: 6 }],
      REFS,
    );
    expect(shots).toHaveLength(0);
    expect(uncovered_deliverable_warnings).toHaveLength(1);
    expect(uncovered_deliverable_warnings[0]).toContain("tiktok");
  });
});
