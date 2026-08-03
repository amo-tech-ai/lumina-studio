import {
  ONBOARDING_AUTH_REQUIRED,
  ONBOARDING_AUTH_TRANSIENT,
} from "./resolve-onboarding-auth-user";

/** Thrown when materialize is attempted without a usable brand name. */
export const ONBOARDING_BRAND_NAME_REQUIRED = "ONBOARDING_BRAND_NAME_REQUIRED";

export { ONBOARDING_AUTH_REQUIRED, ONBOARDING_AUTH_TRANSIENT };

const SAFE_SETUP_FAILURE =
  "We couldn’t start brand setup. Please try again.";

const SAFE_SESSION_FAILURE =
  "We couldn’t load your setup session. Please try again.";

const SAFE_AUTH_FAILURE =
  "Sign in to continue setting up your brand.";

/**
 * Map internal/RPC failures to copy safe for the operator UI.
 * Technical detail stays in the console during development.
 */
export function toUserFacingOnboardingError(
  err: unknown,
  kind: "session" | "setup" = "setup",
): string {
  // Expected signed-out path — don't spam the console as if bootstrap crashed.
  if (
    !isOnboardingAuthError(err) &&
    !isOnboardingAuthTransient(err) &&
    process.env.NODE_ENV === "development"
  ) {
    console.error("[onboarding]", err);
  }
  if (err instanceof Error && err.message === ONBOARDING_BRAND_NAME_REQUIRED) {
    return "Enter a brand name before continuing.";
  }
  if (isOnboardingAuthError(err)) {
    return SAFE_AUTH_FAILURE;
  }
  if (isOnboardingAuthTransient(err)) {
    return SAFE_SESSION_FAILURE;
  }
  return kind === "session" ? SAFE_SESSION_FAILURE : SAFE_SETUP_FAILURE;
}

/** True when the operator should be sent to login rather than retrying RPC. */
export function isOnboardingAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message === ONBOARDING_AUTH_REQUIRED ||
    /auth session missing/i.test(err.message) ||
    /not authenticated/i.test(err.message)
  );
}

/** True when auth refresh failed transiently — show Retry, not Sign in. */
export function isOnboardingAuthTransient(err: unknown): boolean {
  return err instanceof Error && err.message === ONBOARDING_AUTH_TRANSIENT;
}
