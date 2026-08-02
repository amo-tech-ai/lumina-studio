/** Thrown when materialize is attempted without a usable brand name. */
export const ONBOARDING_BRAND_NAME_REQUIRED = "ONBOARDING_BRAND_NAME_REQUIRED";

const SAFE_SETUP_FAILURE =
  "We couldn’t start brand setup. Please try again.";

const SAFE_SESSION_FAILURE =
  "We couldn’t load your setup session. Please try again.";

/**
 * Map internal/RPC failures to copy safe for the operator UI.
 * Technical detail stays in the console during development.
 */
export function toUserFacingOnboardingError(
  err: unknown,
  kind: "session" | "setup" = "setup",
): string {
  if (process.env.NODE_ENV === "development") {
    console.error("[onboarding]", err);
  }
  if (err instanceof Error && err.message === ONBOARDING_BRAND_NAME_REQUIRED) {
    return "Enter a brand name before continuing.";
  }
  return kind === "session" ? SAFE_SESSION_FAILURE : SAFE_SETUP_FAILURE;
}
