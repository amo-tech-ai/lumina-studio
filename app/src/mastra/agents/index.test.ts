import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

// getMastraMemory() requires DATABASE_URL — mock it since these tests don't test memory
vi.mock("@/mastra/memory", () => ({ getMastraMemory: () => ({}) }));
import {
  PlannerWorkingMemory,
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

describe("PlannerWorkingMemory — working memory schema", () => {
  it("defaults arrays to empty", () => {
    const state = PlannerWorkingMemory.parse({});
    expect(state.approvedConcepts).toEqual([]);
    expect(state.pendingDecisions).toEqual([]);
  });

  it("accepts valid planner state", () => {
    const state = PlannerWorkingMemory.parse({
      brandName: "Lumina",
      shootType: "editorial",
      approvedConcepts: ["concept-a"],
      pendingDecisions: ["budget sign-off"],
    });
    expect(state.brandName).toBe("Lumina");
    expect(state.approvedConcepts).toEqual(["concept-a"]);
  });

  it("rejects non-string concept entries", () => {
    expect(() =>
      PlannerWorkingMemory.parse({ approvedConcepts: [1] }),
    ).toThrow();
  });
});
