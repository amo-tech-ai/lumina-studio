import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/memory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mastra/memory")>();
  return { ...actual, getMastraMemory: () => ({}), getPlannerMemory: () => ({}) };
});
import { bookingAgent } from "./booking-agent";

describe("booking-agent snapshot (IPI-397 AC-G)", () => {
  it("instructions enforce draft-only behavior", async () => {
    const instructions = await bookingAgent.getInstructions();

    expect(instructions).toBeDefined();
    expect(instructions).toContain("NEVER confirm or approve a booking");
    expect(instructions).toContain("operatorConfirmed");
    expect(instructions).toContain("no confirm_booking tool exists");
    expect(instructions).not.toContain("transition_booking");
  });

  it("tools list matches expected set", async () => {
    const tools = await bookingAgent.listTools();
    const toolNames = Object.keys(tools ?? {}).sort();
    expect(toolNames).toEqual(
      ["checkTalentAvailability", "createBookingDraft", "draftBookingQuote"].sort(),
    );
  });

  it("no confirm_booking tool registered", async () => {
    const tools = await bookingAgent.listTools();
    const toolNames = Object.keys(tools ?? {});
    expect(toolNames).not.toContain("confirm_booking");
    expect(toolNames).not.toContain("transition_booking");
  });
});
