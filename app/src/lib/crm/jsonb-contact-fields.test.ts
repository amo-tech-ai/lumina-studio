import { describe, expect, it } from "vitest";

import { getPrimaryEntry, normalizeContactFields } from "./jsonb-contact-fields";

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

describe("normalizeContactFields", () => {
  it("accepts plain strings — the shape real seed data actually uses (IPI-392 found this)", () => {
    expect(normalizeContactFields(["maria.lopez@zara.com"])).toEqual([{ value: "maria.lopez@zara.com" }]);
  });

  it("accepts {value,type,primary} objects — the column comment's stated contract", () => {
    expect(normalizeContactFields([{ value: "a@b.com", type: "work", primary: true }])).toEqual([
      { value: "a@b.com", type: "work", primary: true },
    ]);
  });

  it("accepts a mix of both shapes in the same array", () => {
    expect(normalizeContactFields(["+34-91-123-4567", { value: "+1 555 0100", type: "mobile" }])).toEqual([
      { value: "+34-91-123-4567" },
      { value: "+1 555 0100", type: "mobile" },
    ]);
  });

  it("drops empty strings and unparseable entries rather than rendering a blank row", () => {
    expect(normalizeContactFields(["", "  ", null, 42, {}, { value: "" }])).toEqual([]);
  });

  it("returns [] for non-array input", () => {
    expect(normalizeContactFields(null)).toEqual([]);
    expect(normalizeContactFields(undefined)).toEqual([]);
  });
});
