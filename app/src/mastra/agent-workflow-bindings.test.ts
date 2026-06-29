import { describe, expect, it } from "vitest";
import { agents, getMastra } from "./index";
import { durableCreativeDirector, durablePlanner } from "./durable";

describe("agent workflow bindings (Studio + chat discovery)", () => {
  const mastra = getMastra();

  async function workflowIds(agent: { listWorkflows: () => Promise<Record<string, unknown>> }) {
    agent.__registerMastra?.(mastra);
    return Object.keys(await agent.listWorkflows());
  }

  it("production-planner (durable wrapper) exposes shoot-wizard", async () => {
    expect(await workflowIds(durablePlanner)).toEqual(["shoot-wizard"]);
  });

  it("creative-director (durable wrapper) exposes no domain workflows", async () => {
    expect(await workflowIds(durableCreativeDirector)).toEqual([]);
  });

  it("brand-intelligence agent exposes brand-intelligence workflow", async () => {
    expect(await workflowIds(agents["brand-intelligence"])).toEqual(["brand-intelligence"]);
  });

  it("visual-identity agent exposes no domain workflows (worker agent, not workflow owner)", async () => {
    expect(await workflowIds(agents["visual-identity"])).toEqual([]);
  });

  it("social-discovery agent exposes no domain workflows (worker agent, not workflow owner)", async () => {
    expect(await workflowIds(agents["social-discovery"])).toEqual([]);
  });

  it("Mastra registry resolves domain workflows without duplicate registration", () => {
    const shootWizard = mastra.getWorkflow("shoot-wizard");
    const brandIntelligence = mastra.getWorkflow("brand-intelligence");
    expect(shootWizard.id).toBe("shoot-wizard");
    expect(brandIntelligence.id).toBe("brand-intelligence");
    expect(shootWizard).not.toBe(brandIntelligence);
  });
});
