import { describe, expect, it } from "vitest";

import { getPrimaryEntry } from "./jsonb-contact-fields";

describe("getPrimaryEntry", () => {
  it("returns the primary entry, falling back to first", () => {
    expect(
      getPrimaryEntry([
        { value: "a", primary: false },
        { value: "b", primary: true },
      ]),
    ).toEqual({ value: "b", primary: true });
    expect(getPrimaryEntry([{ value: "a" }])).toEqual({ value: "a" });
    expect(getPrimaryEntry([])).toBeNull();
  });
});
