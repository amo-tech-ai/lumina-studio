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
const INVALID_URL = "Enter a valid URL starting with http:// or https://";

export const validateUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return "Website URL is required";

  // Checked before parsing, because the two URL parsers disagree about
  // whitespace and the browser is the lenient one:
  //
  //   new URL("https://exa mple.com")
  //     Node   -> throws ERR_INVALID_URL
  //     Chrome -> parses, host becomes "exa%20mple.com"
  //
  // Relying on the constructor to throw therefore passes in Vitest and fails in
  // front of a real user, who ends up with a hostname that can never resolve and
  // a crawl that fails later with nobody watching. Spaces in the path or query
  // are accepted by BOTH parsers and percent-encoded the same way.
  //
  // A brand's website address never legitimately contains whitespace, so reject
  // it outright rather than guessing which half the user meant.
  if (/\s/.test(trimmed)) return INVALID_URL;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return INVALID_URL;
    }
    return null;
  } catch {
    return "Enter a valid URL starting with http:// or https://";
  }
};
