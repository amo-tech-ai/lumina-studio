"use client";

import { useEffect, useRef, useState } from "react";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { approveWorkflowDraft } from "@/app/(operator)/app/brand/[id]/actions";
import { isDurableIntakeReady } from "@/lib/brand-list-filters";
import { useBrandAnalysisProgress } from "@/lib/brand-hub/use-brand-analysis-progress";
import {
  ensureOnboardingIntakeDraft,
  type OnboardingDnaPillar,
} from "@/lib/onboarding/ensure-onboarding-intake-draft";
export type BrandDnaPayoffScreenProps = {
  brandId: string | null;
  /** Fired when durable intake is ready / scores_complete (or already was). */
  onReadyChange?: (ready: boolean) => void;
};

const SAFE_APPROVE_ERROR = "We couldn’t approve your Brand DNA. Please try again.";

/**
 * IPI-835 · D — screen 13: load generated Brand DNA, approve via existing
 * workflow approve path, advance UI only after durable ready|scores_complete.
 */
export function BrandDnaPayoffScreen({ brandId, onReadyChange }: BrandDnaPayoffScreenProps) {
  if (!brandId) {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Your Brand DNA
        </h1>
        <p
          role="alert"
          data-testid="dna-status"
          className="mt-2.5 text-sm leading-snug text-destructive"
        >
          Brand is not ready yet. Go back and continue again.
        </p>
      </OnboardingCard>
    );
  }

  return <BrandDnaPayoffLive brandId={brandId} onReadyChange={onReadyChange} />;
}

function BrandDnaPayoffLive({
  brandId,
  onReadyChange,
}: {
  brandId: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  const [pillars, setPillars] = useState<OnboardingDnaPillar[] | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [durableReady, setDurableReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const { intakeStatus } = useBrandAnalysisProgress({
    brandId,
    initialStatus: "draft_ready",
    quietGapMs: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void ensureOnboardingIntakeDraft(brandId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        setLoading(false);
        return;
      }
      setPillars(result.pillars);
      setBrandName(result.brandName);
      setRunId(result.runId);
      if (isDurableIntakeReady(result.intakeStatus)) {
        setDurableReady(true);
        onReadyChangeRef.current?.(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // Realtime (or poll) truth — never treat client success alone as ready.
  useEffect(() => {
    if (!isDurableIntakeReady(intakeStatus)) return;
    setDurableReady(true);
    onReadyChangeRef.current?.(true);
  }, [intakeStatus]);

  const handleApprove = async () => {
    if (!runId || approving || durableReady) return;
    setApproving(true);
    setApproveError(null);
    try {
      const result = await approveWorkflowDraft(brandId, runId);
      if (!result.ok) {
        if (result.error === "already_processed") {
          // Refresh draft/status — idempotent path may already be ready.
          const again = await ensureOnboardingIntakeDraft(brandId);
          if (again.ok && isDurableIntakeReady(again.intakeStatus)) {
            setDurableReady(true);
            onReadyChangeRef.current?.(true);
            return;
          }
        }
        setApproveError(
          result.error === "Forbidden" || result.error === "Not signed in"
            ? result.error
            : SAFE_APPROVE_ERROR,
        );
        return;
      }
      // Promote ran server-side — wait for Realtime/re-read before enabling Open iPix.
      const confirm = await ensureOnboardingIntakeDraft(brandId);
      if (confirm.ok && isDurableIntakeReady(confirm.intakeStatus)) {
        setDurableReady(true);
        onReadyChangeRef.current?.(true);
      }
    } catch {
      setApproveError(SAFE_APPROVE_ERROR);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Your Brand DNA
        </h1>
        <p
          data-testid="dna-status"
          aria-live="polite"
          className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]"
        >
          Loading your Brand DNA…
        </p>
      </OnboardingCard>
    );
  }

  if (loadError) {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Your Brand DNA
        </h1>
        <p
          role="alert"
          data-testid="dna-status"
          className="mt-2.5 text-sm leading-snug text-destructive"
        >
          {loadError}
        </p>
      </OnboardingCard>
    );
  }

  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        {durableReady ? "Your Brand DNA is ready" : "Review your Brand DNA"}
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        {durableReady
          ? "Approved and saved. Open iPix to start planning."
          : brandName
            ? `Here’s what we found for ${brandName}. Approve to save it to your brand.`
            : "Here’s what we found from your site. Approve to save it to your brand."}
      </p>

      <ul className="mt-6 grid list-none grid-cols-2 gap-2.5 p-0">
        {(pillars ?? []).map((pillar) => (
          <li
            key={pillar.title}
            data-testid={`pillar-${pillar.title.toLowerCase()}`}
            className="onb-slide rounded-[var(--radius-lg)] border border-[var(--onboarding-hair)] p-3"
          >
            <p className="m-0 text-sm font-bold">{pillar.title}</p>
            <p className="m-0 mt-1 text-xs text-[var(--onboarding-muted)]">{pillar.hint}</p>
            <p className="m-0 mt-2 text-xs leading-snug text-[var(--onboarding-card)]">
              {pillar.value}
            </p>
          </li>
        ))}
      </ul>

      {!durableReady ? (
        <button
          type="button"
          data-testid="approve-brand-dna"
          disabled={approving || !runId}
          onClick={() => {
            void handleApprove();
          }}
          className="mt-6 w-full rounded-full bg-[var(--onboarding-cta)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-card)] disabled:opacity-50"
        >
          {approving ? "Approving…" : "Approve Brand DNA"}
        </button>
      ) : (
        <p
          data-testid="dna-ready"
          aria-live="polite"
          className="mt-6 text-sm font-medium text-[var(--onboarding-card)]"
        >
          Brand DNA approved
        </p>
      )}

      {approveError ? (
        <p role="alert" data-testid="dna-approve-error" className="mt-3 text-sm text-destructive">
          {approveError}
        </p>
      ) : null}
    </OnboardingCard>
  );
}
