import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

// Stub only the DB-dependent getters; importOriginal preserves real schema + makeThreadId
// so schema tests validate production code, not a duplicate definition.
vi.mock("@/mastra/memory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mastra/memory")>();
  return { ...actual, getMastraMemory: () => ({}), getPlannerMemory: () => ({}) };
});
import {
  PlannerWorkingMemory,
  creativeDirectorAgent,
  productionPlannerAgent,
  modelMatchAgent,
  bookingAgent,
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

  it("model-match id matches Mastra registry key (IPI-308)", () => {
    expect(modelMatchAgent.id).toBe("model-match");
  });

  it("model-match carries exactly its 3 own tools, not the full shoot tool registry", async () => {
    const tools = await modelMatchAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames.sort()).toEqual(
      ["computeTalentMatchScore", "manageShortlist", "searchTalentByFilters"].sort(),
    );
  });

  it("booking id matches Mastra registry key (IPI-348)", () => {
    expect(bookingAgent.id).toBe("booking");
  });

  it("booking carries exactly its 3 own tools, not confirm_booking", async () => {
    const tools = await bookingAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames.sort()).toEqual(
      ["checkTalentAvailability", "createBookingDraft", "draftBookingQuote"].sort(),
    );
    expect(toolNames).not.toContain("confirmBooking");
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
