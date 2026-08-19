import { describe, expect, it } from "vitest";

import { shootWizardWorkflow } from "./shoot-wizard";

const requiredWithoutCategory = {
  brand_id: "00000000-0000-0000-0000-000000000202",
  shoot_name: "SS26 lookbook",
  brief: "Studio daylight, cropped denim",
  channels: ["instagram_feed"],
};

describe("shootWizardWorkflow inputSchema (Mastra 1.59 step chaining)", () => {
  it("omitted product_category parses as clothing", () => {
    const parsed = shootWizardWorkflow.inputSchema.parse(requiredWithoutCategory);
    expect(parsed.product_category).toBe("clothing");
  });

  it("rejects an invalid product_category enum", () => {
    expect(() =>
      shootWizardWorkflow.inputSchema.parse({
        ...requiredWithoutCategory,
        product_category: "not-a-category",
      }),
    ).toThrow(/product_category|Invalid enum/i);
  });
});
