import { describe, expect, it } from "vitest";
import { resolveAgentId } from "./route-agent-map";

describe("resolveAgentId", () => {
  it("exact route match", () => {
    expect(resolveAgentId("/app/shoots")).toBe("production-planner");
    expect(resolveAgentId("/app/campaigns")).toBe("creative-director");
  });

  it("prefix match for nested routes", () => {
    expect(resolveAgentId("/app/shoots/new")).toBe("production-planner");
    expect(resolveAgentId("/app/shoots/123/detail")).toBe("production-planner");
    expect(resolveAgentId("/app/campaigns/abc")).toBe("creative-director");
  });

  it("all mapped routes resolve correctly", () => {
    expect(resolveAgentId("/app/brand")).toBe("production-planner");
    expect(resolveAgentId("/app/assets")).toBe("production-planner");
    expect(resolveAgentId("/app/matching")).toBe("production-planner");
    expect(resolveAgentId("/app/onboarding")).toBe("production-planner");
  });

  it("unknown route falls back to default", () => {
    expect(resolveAgentId("/app/unknown")).toBe("production-planner");
    expect(resolveAgentId("/")).toBe("production-planner");
    expect(resolveAgentId("")).toBe("production-planner");
  });

  it("does not match partial segment names", () => {
    expect(resolveAgentId("/app/shootsextra")).toBe("production-planner");
  });
});
