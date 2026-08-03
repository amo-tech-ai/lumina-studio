import type { Metadata } from "next";

import "../onboarding.css";
import { OnboardingFlowLoader } from "./onboarding-flow-loader";

/**
 * IPI-833 · ONB2-UI-001 — /onboarding
 *
 * `(onboarding)` is a SIBLING route group of `(operator)`, not a child. A nested
 * layout always renders inside its parent, so the only way to get a full-bleed
 * surface with no operator chrome is a separate group. The root layout at
 * app/layout.tsx still owns <html> and <body>.
 *
 * The group deliberately has NO layout.tsx. A single-page group does not need
 * one, and every extra route module costs Cloudflare Worker script budget —
 * which this deployment has almost none of (see onboarding-flow-loader.tsx).
 *
 * Fonts come from the root layout's next/font variables, scoped by the
 * `onboarding` class (see onboarding.css). Nothing is loaded twice.
 *
 * IPI-835 · B1+C: real onboarding_sessions draft + screen 12 Realtime crawl progress.
 * Approval (Slice D) comes next. Legacy /app/onboarding stays until Slice E after IPI-836.
 *
 * Auth is enforced in src/middleware.ts, which gates /onboarding exactly like
 * /app/*. That is UI protection only — data authorization stays with RLS.
 *
 * Design source: Universal-design-prompt-4/Pages/Onboarding.v2.zeely.dc.html
 * (line 30 — `position:fixed; inset:0` over `--onb-bg`).
 */

export const metadata: Metadata = {
  title: "Set up your brand",
  description: "Tell us about your brand and we will build your Brand DNA.",
};

export default function OnboardingPage() {
  return (
    <div
      data-testid="onboarding-shell"
      className="onboarding fixed inset-0 overflow-y-auto bg-[var(--onboarding-bg)]"
    >
      <OnboardingFlowLoader />
    </div>
  );
}
