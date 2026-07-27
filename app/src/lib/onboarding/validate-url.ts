/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * the one URL rule, on its own.
 *
 * Extracted from lib/onboarding.ts so that importing it does not drag in that
 * module's Supabase client work, orchestration helpers and edge-function
 * invocations. `ctaDisabled` in navigation.ts needs exactly this function and
 * nothing else, and Worker script budget is the scarcest resource in this
 * deployment.
 *
 * lib/onboarding.ts re-exports this, so every existing caller is unchanged and
 * the native URL parser remains the single validation implementation.
 */
export const validateUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return "Website URL is required";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Enter a valid URL starting with http:// or https://";
    }
    return null;
  } catch {
    return "Enter a valid URL starting with http:// or https://";
  }
};
