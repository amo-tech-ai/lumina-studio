import { describe, expect, it } from "vitest";
import { resolveRouteBriefing } from "./route-briefing";

describe("resolveRouteBriefing", () => {
  it("maps Command Center (brand root)", () => {
    const b = resolveRouteBriefing("/app");
    expect(b.section).toBe("Command Center");
    expect(b.nextActions.length).toBeGreaterThan(0);
    expect(b.panelSections).toBeUndefined();
  });

  it("maps a brand nested route", () => {
    const b = resolveRouteBriefing("/app/brand/11111111-1111-1111-1111-111111111111");
    expect(b.section).toBe("Brand Hub");
    expect(b.panelSections).toBeUndefined();
  });

  it("maps shoot list", () => {
    const b = resolveRouteBriefing("/app/shoots");
    expect(b.section).toBe("Shoots");
    expect(b.panelSections).toBeUndefined();
  });

  it("maps shoot detail nested route", () => {
    const b = resolveRouteBriefing("/app/shoots/abc-123");
    expect(b.section).toBe("Shoot Detail");
    // PR 2 (IPI-286) — real shoot sections wait on a documented data
    // contract; PR 1 must not synthesize panelSections for shoot routes.
    expect(b.panelSections).toBeUndefined();
  });

  it("maps assets workspace", () => {
    expect(resolveRouteBriefing("/app/assets").section).toBe("Assets");
  });

  it("maps campaign list to the reusable coming-soon placeholder", () => {
    const b = resolveRouteBriefing("/app/campaigns");
    expect(b.section).toBe("Campaigns");
    expect(b.panelSections).toEqual(["campaign-placeholder"]);
  });

  it("maps campaign detail to the reusable coming-soon placeholder", () => {
    const b = resolveRouteBriefing("/app/campaigns/22222222-2222-2222-2222-222222222222");
    expect(b.section).toBe("Campaigns");
    expect(b.panelSections).toEqual(["campaign-placeholder"]);
  });

  it("falls back safely for an unknown route", () => {
    const b = resolveRouteBriefing("/app/does-not-exist");
    expect(b.section).toBe("Operator");
    expect(b.nextActions.length).toBeGreaterThan(0);
    expect(b.panelSections).toBeUndefined();
  });

  it("handles a trailing slash the same as the bare route", () => {
    expect(resolveRouteBriefing("/app/campaigns/").panelSections).toEqual([
      "campaign-placeholder",
    ]);
    expect(resolveRouteBriefing("/app/").section).toBe("Command Center");
  });

  it("derives independently per call — no stale state across a route transition", () => {
    const first = resolveRouteBriefing("/app/brand");
    const second = resolveRouteBriefing("/app/campaigns");
    const third = resolveRouteBriefing("/app/brand");

    expect(first.section).toBe("Brand Hub");
    expect(second.section).toBe("Campaigns");
    expect(second.panelSections).toEqual(["campaign-placeholder"]);
    // Re-resolving the original route after an intermediate call must not
    // carry over the previous route's panelSections (pure function, no
    // shared mutable state to go stale).
    expect(third).toEqual(first);
    expect(third.panelSections).toBeUndefined();
  });
});
