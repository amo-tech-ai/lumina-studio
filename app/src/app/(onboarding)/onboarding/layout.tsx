import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../onboarding.css";

/**
 * IPI-833 · ONB2-UI-001 — standalone onboarding shell.
 *
 * `(onboarding)` is a SIBLING of `(operator)`, not a child. A nested layout
 * always renders inside its parent, so there is no way to opt out of the
 * operator shell from within it — the only way to get a full-bleed surface is a
 * separate route group. The root layout at app/layout.tsx still owns <html> and
 * <body>, so this adds no second root and carries no full-reload penalty.
 *
 * The `onboarding` class scopes the brand fonts (see onboarding.css). Without it
 * the flow inherits Arial from globals.css, which AGENTS.md forbids.
 *
 * Design source: Universal-design-prompt-4/Pages/Onboarding.v2.zeely.dc.html
 * (line 30 — `position:fixed; inset:0` over `--onb-bg`).
 */

export const metadata: Metadata = {
  title: "Set up your brand",
  description: "Tell us about your brand and we will build your Brand DNA.",
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="onboarding-shell"
      className="onboarding fixed inset-0 overflow-y-auto bg-[var(--onboarding-bg)]"
    >
      {children}
    </div>
  );
}
