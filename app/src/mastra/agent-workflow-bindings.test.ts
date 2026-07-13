import { describe, expect, it, beforeAll } from "vitest";

// Lazily loaded in beforeAll rather than as top-level imports — see registry.test.ts
// for why (same ./index cold-import cost, same fix).
let mod: typeof import("./index");
let durableMod: typeof import("./durable");
let mastra: ReturnType<typeof import("./index").getMastra>;

describe("agent workflow bindings (Studio + chat discovery)", () => {
  beforeAll(async () => {
    mod = await import("./index");
    durableMod = await import("./durable");
    mastra = mod.getMastra();
  }, 15_000);

  async function workflowIds(agent: { listWorkflows: () => Promise<Record<string, unknown>> }) {
    agent.__registerMastra?.(mastra);
    return Object.keys(await agent.listWorkflows());
  }

  it("production-planner (durable wrapper) exposes shoot-wizard", async () => {
    expect(await workflowIds(durableMod.durablePlanner)).toEqual(["shoot-wizard"]);
  });

  it("creative-director (durable wrapper) exposes no domain workflows", async () => {
    expect(await workflowIds(durableMod.durableCreativeDirector)).toEqual([]);
  });

  it("brand-intelligence agent exposes brand-intelligence workflow", async () => {
    expect(await workflowIds(mod.agents["brand-intelligence"])).toEqual(["brand-intelligence"]);
  });

  it("visual-identity agent exposes no domain workflows (worker agent, not workflow owner)", async () => {
    expect(await workflowIds(mod.agents["visual-identity"])).toEqual([]);
  });

  it("social-discovery agent exposes no domain workflows (worker agent, not workflow owner)", async () => {
    expect(await workflowIds(mod.agents["social-discovery"])).toEqual([]);
  });

  it("Mastra registry resolves domain workflows without duplicate registration", () => {
    const shootWizard = mastra.getWorkflow("shoot-wizard");
    const brandIntelligence = mastra.getWorkflow("brand-intelligence");
    expect(shootWizard.id).toBe("shoot-wizard");
    expect(brandIntelligence.id).toBe("brand-intelligence");
    expect(shootWizard).not.toBe(brandIntelligence);
  });
});
