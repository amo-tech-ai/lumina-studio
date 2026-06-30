import { describe, expect, it } from "vitest";
import { resolveRouteBriefing } from "./route-briefing";

describe("resolveRouteBriefing", () => {
  it("maps Command Center", () => {
    const b = resolveRouteBriefing("/app");
    expect(b.section).toBe("Command Center");
    expect(b.nextActions.length).toBeGreaterThan(0);
  });

  it("maps shoot detail nested route", () => {
    const b = resolveRouteBriefing("/app/shoots/abc-123");
    expect(b.section).toBe("Shoot Detail");
  });

  it("maps assets workspace", () => {
    expect(resolveRouteBriefing("/app/assets").section).toBe("Assets");
  });
});
