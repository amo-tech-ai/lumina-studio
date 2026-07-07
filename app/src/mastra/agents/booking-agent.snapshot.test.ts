import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/memory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mastra/memory")>();
  return { ...actual, getMastraMemory: () => ({}), getPlannerMemory: () => ({}) };
});
import { bookingAgent } from "./booking-agent";

const AGENT_SRC = readFileSync(
  resolve(fileURLToPath(new URL(".", import.meta.url)), "booking-agent.ts"),
  "utf8",
);

describe("booking-agent snapshot (IPI-397 AC-G)", () => {
  it("instructions enforce draft-only behavior", () => {
    const block = AGENT_SRC.match(
      /instructions: `([\s\S]*?)`/,
    )?.[1];

    expect(block).toBeDefined();
    expect(block).toContain("NEVER confirm or approve a booking");
    expect(block).toContain("operatorConfirmed");
    expect(block).toContain("no confirm_booking tool exists");
    expect(block).not.toContain("transition_booking");
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
