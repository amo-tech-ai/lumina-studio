import { describe, expect, it } from "vitest";

import { buildHeroGreeting } from "./greeting";

describe("buildHeroGreeting", () => {
  it("prioritizes pending approvals in subline", () => {
    const { subline } = buildHeroGreeting({
      brandName: "Nike",
      pendingApprovalCount: 3,
    });
    expect(subline).toContain("3 approvals need");
  });

  it("uses singular approval copy for one pending", () => {
    const { subline } = buildHeroGreeting({
      brandName: "Nike",
      pendingApprovalCount: 1,
    });
    expect(subline).toContain("1 approval needs");
  });

  it("falls back to recent shoot when no approvals", () => {
    const { subline } = buildHeroGreeting({
      brandName: "Nike",
      pendingApprovalCount: 0,
      recentShootName: "Spring drop",
    });
    expect(subline).toContain("Spring drop");
  });
});
