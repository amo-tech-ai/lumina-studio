import { describe, expect, it } from "vitest";
import {
  budgetUsedPct,
  formatDateRange,
  formatMoney,
  formatRoleLabel,
  roleInitials,
} from "./shoot-detail-format";

describe("shoot-detail-format", () => {
  it("formats money", () => {
    expect(formatMoney(15000, "USD")).toMatch(/\$15,000/);
    expect(formatMoney(null, "USD")).toBeNull();
  });

  it("computes budget pct", () => {
    expect(budgetUsedPct(9300, 15000)).toBe(62);
    expect(budgetUsedPct(null, 15000)).toBeNull();
  });

  it("formats role labels", () => {
    expect(formatRoleLabel("lead_photographer")).toBe("Lead Photographer");
    expect(roleInitials("lead_photographer")).toBe("LP");
  });

  it("formats date range", () => {
    expect(formatDateRange("2026-07-10", "2026-07-12")).toContain("2026");
    expect(formatDateRange(null, null)).toBeNull();
  });
});
