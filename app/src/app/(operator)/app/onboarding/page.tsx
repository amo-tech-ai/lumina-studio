import { redirect } from "next/navigation";

/**
 * IPI-945 · ONB2-ROUTE-001 — Slice E cutover.
 *
 * Legacy 3-step wizard lived here under the operator shell (sidebar + Copilot).
 * Zeely v2 is the standalone `/onboarding` route (IPI-833). Bookmarks and old
 * CTAs that still hit `/app/onboarding` must not resurrect the dual UI.
 */
export default function LegacyAppOnboardingRedirect() {
  redirect("/onboarding");
}
