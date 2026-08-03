import { describe, expect, it } from "vitest";
import {
  ONBOARDING_AUTH_REQUIRED,
  ONBOARDING_BRAND_NAME_REQUIRED,
  isOnboardingAuthError,
  toUserFacingOnboardingError,
} from "./onboarding-errors";

describe("toUserFacingOnboardingError", () => {
  it("never surfaces raw postgres text", () => {
    const msg = toUserFacingOnboardingError(
      new Error('duplicate key value violates unique constraint "onboarding_sessions_user_key"'),
      "setup",
    );
    expect(msg).not.toMatch(/duplicate key|constraint|onboarding_sessions/i);
    expect(msg).toMatch(/try again/i);
  });

  it("maps missing brand name to a clear prompt", () => {
    expect(toUserFacingOnboardingError(new Error(ONBOARDING_BRAND_NAME_REQUIRED))).toMatch(
      /brand name/i,
    );
  });

  it("maps Auth session missing to a sign-in prompt", () => {
    expect(toUserFacingOnboardingError(new Error("Auth session missing!"), "session")).toMatch(
      /sign in/i,
    );
    expect(isOnboardingAuthError(new Error(ONBOARDING_AUTH_REQUIRED))).toBe(true);
  });
});
