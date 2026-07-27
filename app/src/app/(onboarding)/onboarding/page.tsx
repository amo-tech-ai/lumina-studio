import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

/**
 * IPI-833 · ONB2-UI-001 — /onboarding
 *
 * No data fetching, no Supabase, no AI. Everything is local state; IPI-835 wires
 * this to the real session, the crawl and the approval path, and retires
 * /app/onboarding at that point. The existing route stays live until then.
 *
 * Auth is enforced in src/middleware.ts, which gates /onboarding exactly like
 * /app/*. That is UI protection only — data authorization stays with RLS.
 */
export default function OnboardingPage() {
  return <OnboardingFlow />;
}
