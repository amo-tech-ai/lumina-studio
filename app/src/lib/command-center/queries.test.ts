import { describe, expect, it } from "vitest";

import { countPendingApprovalBrands } from "./queries";

describe("countPendingApprovalBrands", () => {
  it("counts unique brand ids across pending drafts and draft_ready brands", () => {
    const count = countPendingApprovalBrands(
      [
        { brand_id: "a" },
        { brand_id: "b" },
        { brand_id: "a" },
      ],
      [{ id: "b" }, { id: "c" }],
    );
    expect(count).toBe(3);
  });

  it("returns zero when both sources are empty", () => {
    expect(countPendingApprovalBrands([], [])).toBe(0);
  });
});
