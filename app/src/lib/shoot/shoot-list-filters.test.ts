import { describe, expect, it } from "vitest";

import {
  matchesShootListFilter,
  shootListCountLabel,
  shootStatusDisplay,
} from "./shoot-list-filters";

describe("shoot-list-filters", () => {
  it("maps DB status to DC labels", () => {
    expect(shootStatusDisplay("planning").label).toBe("Draft");
    expect(shootStatusDisplay("active").label).toBe("In Production");
    expect(shootStatusDisplay("complete").label).toBe("Complete");
  });

  it("counts in-production shoots", () => {
    expect(
      shootListCountLabel([
        { status: "active" },
        { status: "active" },
        { status: "planning" },
      ]),
    ).toBe("3 shoots • 2 in production");
  });

  it("hides archived from All filter", () => {
    expect(matchesShootListFilter("all", "archived")).toBe(false);
    expect(matchesShootListFilter("all", "active")).toBe(true);
  });
});
