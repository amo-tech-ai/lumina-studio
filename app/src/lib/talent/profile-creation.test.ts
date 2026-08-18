import { describe, expect, it } from "vitest";
import { parseHalfDayRate, toCreateTalentProfileRpcArgs } from "./profile-creation";

describe("parseHalfDayRate", () => {
  it("normalizes currency-formatted day rates to the matching half_day number", () => {
    expect(parseHalfDayRate("£1,200")).toBe(1200);
    expect(parseHalfDayRate("$500")).toBe(500);
    expect(parseHalfDayRate("not a rate")).toBeNull();
    expect(parseHalfDayRate(undefined)).toBeNull();
  });
});

describe("toCreateTalentProfileRpcArgs", () => {
  it("writes handle/niche/location and numeric half_day for the public RPC", () => {
    const args = toCreateTalentProfileRpcArgs({
      displayName: "Kara",
      bio: "Runner",
      handle: "@kara",
      niche: "Running",
      location: "London, UK",
      dayRate: "£1,200",
      sourceUrl: "https://instagram.com/kara",
      analyzedFields: [
        { key: "handle", confidence: 99 },
        { key: "rate", confidence: 71 },
      ],
    });

    expect(args.p_handle).toBe("@kara");
    expect(args.p_niche).toBe("Running");
    expect(args.p_location).toBe("London, UK");
    expect(args.p_half_day).toBe(1200);
    expect(args.p_sources).toEqual([
      { field_name: "handle", confidence: 99 },
      { field_name: "rate", confidence: 71 },
    ]);
  });
});
