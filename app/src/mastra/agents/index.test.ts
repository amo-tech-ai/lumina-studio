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
import { brandIntelligenceAgent } from "./brand-intelligence-agent";

describe("operator agents — structure (IPI2-121)", () => {
  it("production-planner id matches Mastra registry key", () => {
    expect(productionPlannerAgent.id).toBe("production-planner");
  });

  it("production-planner teaches shoot-wizard navigation (IPI-731)", () => {
    const instructions = String(productionPlannerAgent.getInstructions?.() ?? productionPlannerAgent.instructions ?? "");
    expect(instructions).toMatch(/shoot-wizard/);
    expect(instructions).toMatch(/\/app\/shoots\/new/);
    expect(instructions).toMatch(/Do not send operators to the shoots list when they asked for the wizard/);
  });

  it("brand-intelligence teaches shoot-wizard vs shoots list (IPI-731)", () => {
    const instructions = String(
      brandIntelligenceAgent.getInstructions?.() ?? brandIntelligenceAgent.instructions ?? "",
    );
    expect(instructions).toMatch(/shoot-wizard/);
    expect(instructions).toMatch(/\/app\/shoots\/new/);
    expect(instructions).toMatch(/Plan a shoot/);
    // List intents stay on shoots — must not collapse "plan a shoot" into the list section.
    expect(instructions).toMatch(/shoots list.*navigateTo\(\{\s*section:\s*"shoots"/s);
    expect(instructions).toMatch(
      /Plan a shoot[\s\S]*navigateTo\(\{\s*section:\s*"shoot-wizard"/,
    );
  });

  it("creative-director is a distinct agent", () => {
    expect(creativeDirectorAgent.id).toBe("creative-director");
    expect(creativeDirectorAgent).not.toBe(productionPlannerAgent);
  });

  it("production-planner wires the shared agent tool registry, minus other agents' booking tools", async () => {
    const tools = await productionPlannerAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    // Broad shoot-planning access (still "smoke-level" pending IPI2-114) —
    // but never the booking agent's durable write/read tools, which its own
    // instructions never mention and shouldn't be reachable from a
    // shoot-planning chat.
    expect(toolNames).toContain("recommendShootType");
    expect(toolNames).toContain("planDeliverables");
    expect(toolNames).not.toContain("checkTalentAvailability");
    expect(toolNames).not.toContain("draftBookingQuote");
    expect(toolNames).not.toContain("createBookingDraft");
  });

  it("production-planner does NOT inherit creative-director's asset-intelligence tools (IPI-261 bot-review finding)", async () => {
    const tools = await productionPlannerAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    // getAssetDnaEvidence/suggestAssetRetakes/draftBulkAssetApproval live in the shared
    // agentTools registry for creative-director's /app/assets flow — production-planner's
    // instructions and tests don't cover that domain, so it must not inherit them just
    // because they're in the shared registry (mirrors the booking-tool exclusion above).
    expect(toolNames).not.toContain("getAssetDnaEvidence");
    expect(toolNames).not.toContain("suggestAssetRetakes");
    expect(toolNames).not.toContain("draftBulkAssetApproval");
  });

  it("production-planner does NOT inherit crm-assistant tools (IPI-369 review)", async () => {
    const tools = await productionPlannerAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames).not.toContain("searchCompanies");
    expect(toolNames).not.toContain("searchContacts");
    expect(toolNames).not.toContain("logActivity");
    expect(toolNames).not.toContain("moveDealStage");
    expect(toolNames).not.toContain("scoreDealHealth");
    expect(toolNames).not.toContain("summarizeRelationship");
    expect(toolNames).not.toContain("draftFollowUp");
  });

  it("creative-director carries exactly its 3 asset-intelligence tools (IPI-261), not the full registry", async () => {
    const tools = await creativeDirectorAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames.sort()).toEqual(
      ["draftBulkAssetApproval", "getAssetDnaEvidence", "suggestAssetRetakes"].sort(),
    );
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
