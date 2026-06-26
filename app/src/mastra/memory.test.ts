import { describe, expect, it } from "vitest";
import { makeThreadId } from "./memory";

describe("memory", () => {
  it("makeThreadId produces correct format", () => {
    expect(makeThreadId("org_abc", "shoot", "brand_xyz")).toBe(
      "org_abc/shoot/brand_xyz",
    );
    expect(makeThreadId("org_abc", "brand-intake", "draft_1")).toBe(
      "org_abc/brand-intake/draft_1",
    );
  });
});
