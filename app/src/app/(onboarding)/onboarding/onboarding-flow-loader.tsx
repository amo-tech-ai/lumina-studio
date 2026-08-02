"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * IPI-833 — keeps the onboarding flow out of the Cloudflare Worker bundle.
 *
 * The whole flow is client state: no data fetching, no cookies, no auth branch
 * to render, and it sits behind the middleware gate so it has no SEO value.
 * Server-rendering it buys nothing and costs Worker script budget, which is the
 * scarcest resource in this deployment — `main` already sits at 8.963 MiB gzip
 * against a 9.0 MiB CI gate and Cloudflare's 10 MB hard limit.
 *
 * `ssr: false` cannot be set from a Server Component, which is why this thin
 * client wrapper exists rather than the dynamic() call living in page.tsx.
 */
const OnboardingSessionGate = dynamic(
  () =>
    import("@/components/onboarding/onboarding-session-gate").then(
      (m) => m.OnboardingSessionGate,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-full items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-[var(--onboarding-card-width)] rounded-[var(--onboarding-card-radius)]" />
      </div>
    ),
  },
);

export function OnboardingFlowLoader() {
  return <OnboardingSessionGate />;
}
