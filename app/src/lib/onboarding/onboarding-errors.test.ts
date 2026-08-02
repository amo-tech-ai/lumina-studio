import { describe, expect, it } from "vitest";
import {
  ONBOARDING_BRAND_NAME_REQUIRED,
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
});
