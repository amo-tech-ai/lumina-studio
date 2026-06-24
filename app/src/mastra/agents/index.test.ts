import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { agentTools } from "@/mastra/tools";
import {
  creativeDirectorAgent,
  productionPlannerAgent,
} from "./index";

const AGENTS_SRC = readFileSync(
  fileURLToPath(new URL("./index.ts", import.meta.url)),
  "utf8",
);

// Contract tests for operator agent definitions (IPI2-121 / IPI2-84).
// Registry keys in mastra/index.ts and frontend useAgent({ agentId }) must
// match these ids exactly — a rename here is a runtime-only failure.
describe("operator agent definitions (IPI2-121)", () => {
  it("production-planner id matches the registry key and frontend agentId", () => {
    expect(productionPlannerAgent.id).toBe("production-planner");
    expect(productionPlannerAgent.name).toBe("Production Planner");
  });

  it("creative-director id matches the registry key", () => {
    expect(creativeDirectorAgent.id).toBe("creative-director");
    expect(creativeDirectorAgent.name).toBe("Creative Director");
  });

  it("production-planner wires the auditable agentTools registry at construction", () => {
    // Mastra Agent does not expose tools on a public getter — lock the wiring in source.
    expect(AGENTS_SRC).toMatch(/tools:\s*agentTools/);
    expect(Object.keys(agentTools)).toContain("weatherTool");
  });

  it("creative-director has no tools (distinct capability surface from planner)", () => {
    const tools = creativeDirectorAgent.tools;
    expect(tools === undefined || Object.keys(tools).length === 0).toBe(true);
    expect(AGENTS_SRC).not.toMatch(/creativeDirectorAgent[\s\S]*tools:/);
  });

  it("agents are distinct instances (no accidental alias)", () => {
    expect(creativeDirectorAgent).not.toBe(productionPlannerAgent);
    expect(creativeDirectorAgent.id).not.toBe(productionPlannerAgent.id);
  });
});
