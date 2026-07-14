import { describe, expect, it, beforeAll } from "vitest";

// Contract test for the CopilotKit/Mastra registry.
// This catches the "Agent 'default' not found after runtime sync" class of bug
// that build/lint/tsc cannot see (it is runtime-only). The runtime exposes these
// ids via MastraAgent.getLocalAgents(); CopilotKit's prebuilt UI resolves "default".
//
// Loaded lazily in beforeAll (not a top-level import) so this file's collection
// doesn't pay ./index's full agent/workflow/storage graph cost — that import is
// the same one measured at 1.2-1.3s cold, which leaves too little headroom
// against the default 5s test timeout under any load. beforeAll gets the more
// generous hookTimeout, and the cost is paid once per file instead of blocking
// every worker that merely enumerates this file's tests.
let mod: typeof import("./index");

beforeAll(async () => {
  mod = await import("./index");
}, 15_000);

describe("mastra agent registry", () => {
  it("registers every id the runtime + prebuilt UI require", () => {
    for (const id of mod.REQUIRED_AGENT_IDS) {
      expect(mod.agents, `missing required agent id "${id}"`).toHaveProperty(id);
    }
  });

  it("keeps `default` aliased to the primary (production-planner) agent", () => {
    expect(mod.agents.default).toBe(mod.agents["production-planner"]);
  });

  it("includes the creative-director agent as a distinct entry", () => {
    expect(mod.agents["creative-director"]).toBeDefined();
    expect(mod.agents["creative-director"]).not.toBe(mod.agents["production-planner"]);
  });

  it("registers booking agent for model booking flows (IPI-348)", () => {
    expect(mod.agents.booking).toBeDefined();
    expect(mod.agents.booking.id).toBe("booking");
  });
});
