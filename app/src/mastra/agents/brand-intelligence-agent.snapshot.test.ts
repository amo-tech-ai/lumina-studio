import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/memory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mastra/memory")>();
  return { ...actual, getMastraMemory: () => ({}), getPlannerMemory: () => ({}) };
});
import { brandIntelligenceAgent } from "./brand-intelligence-agent";

describe("brand-intelligence-agent snapshot (AGENT-DNA-001)", () => {
  it("instructions require explainPillar for score-why questions", async () => {
    const instructions = await brandIntelligenceAgent.getInstructions();

    expect(instructions).toBeDefined();
    expect(instructions).toMatch(/MUST call explainPillar/);
    expect(instructions).toMatch(/EvidenceBlock-shaped/);
    expect(instructions).toMatch(/why/);
    expect(instructions).toMatch(/evidence/);
    expect(instructions).toMatch(/confidence/);
    expect(instructions).toMatch(/one suggestion/);
  });

  it("instructions forbid inventing evidence or confidence", async () => {
    const instructions = await brandIntelligenceAgent.getInstructions();

    expect(instructions).toMatch(/Never invent evidence/);
    expect(instructions).toMatch(/never fabricate signals/);
    expect(instructions).toMatch(/never invent a confidence number/);
  });

  it("instructions route overall-score questions via getBrandScores, not explainPillar", async () => {
    const instructions = await brandIntelligenceAgent.getInstructions();

    expect(instructions).toMatch(/overall DNA breakdown/);
    expect(instructions).toMatch(/call getBrandScores/);
    expect(instructions).toMatch(/weakest pillar/);
    expect(instructions).toMatch(/Do not pass "overall" to explainPillar/);
  });

  it("instructions forbid silent approveDraft", async () => {
    const instructions = await brandIntelligenceAgent.getInstructions();

    expect(instructions).toMatch(/Never silently approve or reject/);
    expect(instructions).toMatch(/explicit operator confirmation/);
    expect(instructions).toMatch(/do NOT call approveDraft unless the operator explicitly confirms/);
  });

  it("tools list includes explainPillar", async () => {
    const tools = await brandIntelligenceAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames).toContain("explainPillar");
  });
});
