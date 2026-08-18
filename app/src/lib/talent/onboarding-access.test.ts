import { describe, expect, it } from "vitest";
import { canAccessTalentOnboarding } from "./onboarding-access";

describe("canAccessTalentOnboarding", () => {
  it("allows talent self-serve model role", () => {
    expect(canAccessTalentOnboarding({ profileRole: "model", orgRoles: [] })).toBe(true);
  });

  it("allows agency owner/editor org roles", () => {
    expect(canAccessTalentOnboarding({ profileRole: "designer", orgRoles: ["editor"] })).toBe(true);
    expect(canAccessTalentOnboarding({ profileRole: "studio_admin", orgRoles: ["owner"] })).toBe(true);
  });

  it("denies brand-side roles without an agency editor seat", () => {
    expect(canAccessTalentOnboarding({ profileRole: "designer", orgRoles: ["viewer"] })).toBe(false);
    expect(canAccessTalentOnboarding({ profileRole: "attendee", orgRoles: [] })).toBe(false);
  });
});
