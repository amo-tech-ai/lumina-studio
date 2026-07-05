import { describe, expect, it } from "vitest";
import { NON_TERMINAL_DEAL_STAGES } from "./_shared";

describe("moveDealStage — terminal stage guard (IPI-368)", () => {
  it("NON_TERMINAL_DEAL_STAGES excludes won and lost", () => {
    expect(NON_TERMINAL_DEAL_STAGES).not.toContain("won");
    expect(NON_TERMINAL_DEAL_STAGES).not.toContain("lost");
    expect(NON_TERMINAL_DEAL_STAGES).toEqual(["lead", "qualified", "proposal", "negotiation"]);
  });
});
