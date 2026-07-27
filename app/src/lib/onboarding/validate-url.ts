/**
 * IPI-833 — the one URL rule, on its own.
 *
 * Extracted from lib/onboarding.ts so that importing it does not drag in that
 * module's Supabase client work, orchestration helpers and edge-function
 * invocations. `ctaDisabled` in navigation.ts needs exactly this function and
 * nothing else, and Worker script budget is the scarcest resource in this
 * deployment.
 *
 * lib/onboarding.ts re-exports this, so every existing caller is unchanged and
 * there is still only one regex.
 */
export const validateUrl = (url: string): string | null => {
  if (!url.trim()) return "Website URL is required";
  if (!/^https?:\/\/.+\..+/.test(url.trim()))
    return "Enter a valid URL starting with http:// or https://";
  return null;
};
