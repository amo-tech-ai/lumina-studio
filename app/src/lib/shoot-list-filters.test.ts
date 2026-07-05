import { describe, expect, it } from "vitest";
import {
  SHOOT_LIST_FILTERS,
  matchesShootListFilter,
  shootListCountLabel,
  shootStatusDotToken,
  shootStatusLabel,
} from "./shoot-list-filters";

describe("shoot-list-filters", () => {
  it("labels every real shoot_status enum value", () => {
    expect(shootStatusLabel("planning")).toBe("Planning");
    expect(shootStatusLabel("active")).toBe("Active");
    expect(shootStatusLabel("post_production")).toBe("Post-Production");
    expect(shootStatusLabel("complete")).toBe("Complete");
    expect(shootStatusLabel("archived")).toBe("Archived");
  });

  it("falls back to 'planning' for an unknown status", () => {
    expect(shootStatusLabel("weird")).toBe("Planning");
    expect(shootStatusLabel(null)).toBe("Planning");
  });

  it("maps every known status to a token reference", () => {
    for (const status of SHOOT_LIST_FILTERS.filter((f) => f !== "all")) {
      expect(shootStatusDotToken(status)).toMatch(/^var\(--status-/);
    }
  });

  it("matches 'all' filter against any status", () => {
    expect(matchesShootListFilter("all", "archived")).toBe(true);
  });

  it("matches a specific filter only against its own status", () => {
    expect(matchesShootListFilter("active", "active")).toBe(true);
    expect(matchesShootListFilter("active", "planning")).toBe(false);
  });

  it("formats the count label for 0, 1, and many shoots", () => {
    expect(shootListCountLabel([])).toBe("No shoots planned");
    expect(shootListCountLabel([{ status: "active" }])).toBe("1 shoot");
    expect(shootListCountLabel([{ status: "active" }, { status: "planning" }])).toBe("2 shoots");
  });
});
