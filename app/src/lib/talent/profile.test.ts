import { describe, expect, it } from "vitest";
import { getTalentHandle, storedTag, type TalentProfileDetail } from "./profile";

function profile(ai_tags: Record<string, unknown> = {}): TalentProfileDetail {
  return {
    id: "t1",
    display_name: "Kara",
    bio: null,
    measurements: {},
    rates: {},
    languages: [],
    travel_ready: false,
    verification_status: "pending",
    is_agency_represented: false,
    avatar_public_id: null,
    avatarUrl: null,
    created_at: "2026-08-18T00:00:00Z",
    ai_tags,
  };
}

describe("stored talent identity fields", () => {
  it("only returns handle/niche/location when they were persisted", () => {
    expect(getTalentHandle(profile())).toBe("—");
    expect(storedTag(profile(), "niche")).toBeNull();
    expect(getTalentHandle(profile({ handle: "@kara", niche: "Running", location: "London, UK" }))).toBe("@kara");
    expect(storedTag(profile({ niche: "Running" }), "niche")).toBe("Running");
  });
});
