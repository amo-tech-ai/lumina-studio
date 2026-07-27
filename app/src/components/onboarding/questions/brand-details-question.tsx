"use client";

import { useId } from "react";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { validateUrl } from "@/lib/onboarding/validate-url";

/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * screen 4. Brand name is required and website is optional.
 *
 * The design comp renders a fabricated crawl summary under the URL field:
 *
 *   urlPreview = u + ' · 47 pages found · Apparel'      (DC line 582)
 *
 * "47 pages found" is hardcoded, before any crawl exists. It is NOT ported —
 * showing an invented result is exactly the failure the project's UX rules
 * forbid. The URL is echoed back and nothing more; real page counts arrive with
 * IPI-835 · ONB2-INT-001 — Real Session, Crawl, Realtime Progress, and Approval
 * Integration With Recovery.
 */
export function BrandDetailsQuestion({
  brandName,
  websiteUrl,
  onBrandNameChange,
  onWebsiteUrlChange,
}: {
  brandName: string;
  websiteUrl: string;
  onBrandNameChange: (next: string) => void;
  onWebsiteUrlChange: (next: string) => void;
}) {
  const nameId = useId();
  const urlId = useId();
  const urlErrorId = `${urlId}-error`;

  // Only complain once they have typed something — validating an untouched
  // optional field would be scolding them for nothing.
  const urlError = websiteUrl.trim() === "" ? null : validateUrl(websiteUrl);
  const host = websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        Tell us about your brand
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        We use this to find your brand online.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor={nameId} className="text-xs font-semibold text-[var(--onboarding-sub)]">
            Brand name
          </label>
          <input
            id={nameId}
            name="brandName"
            value={brandName}
            onChange={(event) => onBrandNameChange(event.target.value)}
            autoComplete="organization"
            placeholder="Maison Noir"
            className="rounded-[var(--radius-md)] border border-[var(--onboarding-hair)] px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--onboarding-accent)]"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={urlId} className="text-xs font-semibold text-[var(--onboarding-sub)]">
            Website <span className="font-normal text-[var(--onboarding-muted)]">(optional)</span>
          </label>
          <input
            id={urlId}
            name="websiteUrl"
            value={websiteUrl}
            onChange={(event) => onWebsiteUrlChange(event.target.value)}
            inputMode="url"
            autoComplete="url"
            placeholder="https://maisonnoir.com"
            aria-invalid={urlError ? true : undefined}
            aria-describedby={urlError ? urlErrorId : undefined}
            className="rounded-[var(--radius-md)] border border-[var(--onboarding-hair)] px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--onboarding-accent)]"
          />
          {urlError ? (
            <p id={urlErrorId} className="text-xs text-[var(--onboarding-weak)]">
              {urlError}
            </p>
          ) : null}
          {!urlError && host ? (
            // Echo only. No page count, no category, nothing we have not measured.
            <p className="text-xs text-[var(--onboarding-muted)]" data-testid="url-echo">
              We&rsquo;ll analyse {host}
            </p>
          ) : null}
        </div>
      </div>
    </OnboardingCard>
  );
}
