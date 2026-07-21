import { describe, expect, it } from "vitest";
import { crmDealStageDotToken } from "./status-tokens";

/** IPI-571 · CRM-UX-007 — SCR-30 stage dots must be visually distinct. */
describe("crmDealStageDotToken (SCR-30)", () => {
  it("maps each stage to a distinct semantic token", () => {
    expect(crmDealStageDotToken("lead")).toBe("var(--color-crm-lead)");
    expect(crmDealStageDotToken("qualified")).toBe("var(--color-info)");
    expect(crmDealStageDotToken("proposal")).toBe("var(--color-published)");
    expect(crmDealStageDotToken("negotiation")).toBe("var(--color-warning-text)");
    expect(crmDealStageDotToken("won")).toBe("var(--color-approved)");
    expect(crmDealStageDotToken("lost")).toBe("var(--color-crm-lost)");
  });

  it("keeps Proposal purple distinct from Qualified blue", () => {
    expect(crmDealStageDotToken("proposal")).not.toBe(crmDealStageDotToken("qualified"));
  });
});
