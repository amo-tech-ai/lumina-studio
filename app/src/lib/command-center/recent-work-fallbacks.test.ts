import { describe, expect, it } from "vitest";

import {
  commandCenterRecentFallbacks,
  isRecentWorkFallback,
  resolveRecentWorkItems,
} from "./recent-work-fallbacks";

describe("recent-work-fallbacks", () => {
  it("returns five DC-aligned placeholder tiles", () => {
    const items = commandCenterRecentFallbacks("brand-1");
    expect(items).toHaveLength(5);
    expect(items[0].name).toBe("Spring hero");
    expect(items[0].channel).toBe("IG");
    expect(isRecentWorkFallback(items[0].id)).toBe(true);
  });

  it("pads live shoots to five DC tiles with fallbacks", () => {
    const live = [
      {
        id: "s1",
        name: "Live shoot",
        status: "active",
        dnaScore: 90,
        updatedAt: "2026-06-01T00:00:00Z",
      },
    ];
    const items = resolveRecentWorkItems(live, "brand-1");
    expect(items).toHaveLength(5);
    expect(items[0].name).toBe("Live shoot");
    expect(items[1].name).toBe("Spring hero");
  });
});
