import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AgentState,
  creativeDirectorAgent,
  productionPlannerAgent,
} from "./index";

const AGENTS_SRC = readFileSync(
  resolve(fileURLToPath(new URL(".", import.meta.url)), "index.ts"),
  "utf8",
);

describe("operator agents — structure (IPI2-121)", () => {
  it("production-planner id matches Mastra registry key", () => {
    expect(productionPlannerAgent.id).toBe("production-planner");
  });

  it("creative-director is a distinct agent", () => {
    expect(creativeDirectorAgent.id).toBe("creative-director");
    expect(creativeDirectorAgent).not.toBe(productionPlannerAgent);
  });

  it("production-planner wires the shared agent tool registry at construction", () => {
    expect(AGENTS_SRC).toMatch(
      /export const productionPlannerAgent = new Agent\(\{[\s\S]*tools:\s*agentTools/,
    );
  });

  it("creative-director carries no tools (brief-only agent)", () => {
    expect(AGENTS_SRC).toMatch(
      /export const creativeDirectorAgent = new Agent\(\{[\s\S]*?instructions:/,
    );
    const creativeBlock = AGENTS_SRC.match(
      /export const creativeDirectorAgent = new Agent\(\{([\s\S]*?}\);)/,
    )?.[1];
    expect(creativeBlock).toBeDefined();
    expect(creativeBlock).not.toMatch(/\btools:/);
  });
});

describe("AgentState — working memory schema", () => {
  it("defaults proverbs to an empty array", () => {
    expect(AgentState.parse({}).proverbs).toEqual([]);
  });

  it("accepts string proverbs", () => {
    expect(AgentState.parse({ proverbs: ["a", "b"] }).proverbs).toEqual([
      "a",
      "b",
    ]);
  });

  it("rejects non-string proverbs entries", () => {
    expect(() => AgentState.parse({ proverbs: [1] })).toThrow();
  });
});
