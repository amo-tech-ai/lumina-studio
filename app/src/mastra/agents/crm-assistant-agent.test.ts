import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("@/mastra/memory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mastra/memory")>();
  return { ...actual, getMastraMemory: () => ({}) };
});

import { crmAssistantAgent } from "./crm-assistant-agent";
import { REQUIRED_AGENT_IDS } from "@/mastra/index";

describe("crm-assistant agent (IPI-368)", () => {
  it("uses id crm-assistant", () => {
    expect(crmAssistantAgent.id).toBe("crm-assistant");
  });

  it("is not a REQUIRED_AGENT_IDS alias (CopilotKit default trio unchanged)", () => {
    expect(REQUIRED_AGENT_IDS).not.toContain("crm-assistant");
  });

  it("wires wave-1 CRM tools plus scoreDealHealth (IPI-369 Phase A)", async () => {
    const tools = await crmAssistantAgent.listTools();
    expect(Object.keys(tools ?? {}).sort()).toEqual(
      [
        "logActivity",
        "moveDealStage",
        "scoreDealHealth",
        "searchCompanies",
        "searchContacts",
      ].sort(),
    );
  });
});
