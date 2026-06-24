import { describe, expect, it } from "vitest";
import { agents, REQUIRED_AGENT_IDS } from "./index";

// Contract test for the CopilotKit/Mastra registry.
// This catches the "Agent 'default' not found after runtime sync" class of bug
// that build/lint/tsc cannot see (it is runtime-only). The runtime exposes these
// ids via MastraAgent.getLocalAgents(); CopilotKit's prebuilt UI resolves "default".
describe("mastra agent registry", () => {
  it("registers every id the runtime + prebuilt UI require", () => {
    for (const id of REQUIRED_AGENT_IDS) {
      expect(agents, `missing required agent id "${id}"`).toHaveProperty(id);
    }
  });

  it("keeps `default` aliased to the primary (production-planner) agent", () => {
    expect(agents.default).toBe(agents["production-planner"]);
  });

  it("includes the creative-director agent as a distinct entry", () => {
    expect(agents["creative-director"]).toBeDefined();
    expect(agents["creative-director"]).not.toBe(agents["production-planner"]);
  });

  it("registers public-marketing for the isolated marketing runtime", () => {
    expect(agents["public-marketing"]).toBeDefined();
  });

  it("keeps public-marketing out of REQUIRED_AGENT_IDS (operator vs public isolation)", () => {
    // public-marketing is served from a separate Mastra instance on /api/marketing-chat.
    // Requiring it in the operator CopilotKit registry would blur that boundary.
    expect(REQUIRED_AGENT_IDS).not.toContain("public-marketing");
    expect(agents["public-marketing"]).toBeDefined();
  });
});
