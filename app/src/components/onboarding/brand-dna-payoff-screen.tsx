"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
const SAFE_LOAD_ERROR = "We couldn’t load your Brand DNA. Please try again.";
/** Fail-open bound — never leave screen 13 on Loading forever (IPI-836). */
const DNA_LOAD_TIMEOUT_MS = 45_000;

/** Dedup Strict Mode double-mount so both effects share one server-action flight. */
const dnaEnsureInflight = new Map<
  string,
  ReturnType<typeof ensureOnboardingIntakeDraft>
>();

function loadOnboardingDnaDraft(brandId: string, bust = false) {
  if (bust) dnaEnsureInflight.delete(brandId);
  let pending = dnaEnsureInflight.get(brandId);
  if (!pending) {
    pending = ensureOnboardingIntakeDraft(brandId).finally(() => {
      dnaEnsureInflight.delete(brandId);
    });
    dnaEnsureInflight.set(brandId, pending);
  }
  return pending;
}

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
  const brandIdRef = useRef(brandId);
  brandIdRef.current = brandId;

  const [pillars, setPillars] = useState<OnboardingDnaPillar[] | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [durableReady, setDurableReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const { intakeStatus } = useBrandAnalysisProgress({
    brandId,
    initialStatus: "draft_ready",
    quietGapMs: 0,
  });

  useEffect(() => {
    const requestedId = brandId;
    setLoading(true);
    setLoadError(null);

    // No `cancelled` flag — Strict Mode cleanup used to drop the only settled
    // server-action result and leave Loading forever. Share one in-flight call.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled || brandIdRef.current !== requestedId) return;
      settled = true;
      setLoadError(SAFE_LOAD_ERROR);
      setLoading(false);
    }, DNA_LOAD_TIMEOUT_MS);

    void loadOnboardingDnaDraft(requestedId, loadAttempt > 0)
      .then((result) => {
        if (brandIdRef.current !== requestedId) return;
        settled = true;
        clearTimeout(timer);
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
      })
      .catch(() => {
        if (brandIdRef.current !== requestedId) return;
        settled = true;
        clearTimeout(timer);
        setLoadError(SAFE_LOAD_ERROR);
        setLoading(false);
      });

    return () => {
      clearTimeout(timer);
    };
  }, [brandId, loadAttempt]);

  // Realtime (or poll) truth — never treat client success alone as ready.
  useEffect(() => {
    if (!isDurableIntakeReady(intakeStatus)) return;
    setDurableReady(true);
    onReadyChangeRef.current?.(true);
  }, [intakeStatus]);

  // Keep footer Open iPix in lockstep with the card (approve/realtime races).
  useEffect(() => {
    if (!durableReady) return;
    onReadyChangeRef.current?.(true);
  }, [durableReady]);

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
      // Server only returns ok after promote committed ready (or already ready).
      // Do not gate the card on a second ensure/realtime hop — that left Approve
      // stuck with no dna-ready when re-read lagged.
      setDurableReady(true);
      onReadyChangeRef.current?.(true);
      void ensureOnboardingIntakeDraft(brandId).then((confirm) => {
        if (!confirm.ok || brandIdRef.current !== brandId) return;
        setPillars(confirm.pillars);
        setBrandName(confirm.brandName);
      });
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
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            data-testid="dna-load-retry"
            onClick={() => {
              setLoadAttempt((n) => n + 1);
            }}
            className="rounded-full bg-[var(--onboarding-cta)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-card)]"
          >
            Retry
          </button>
          <Link
            href="/app/brand"
            data-testid="dna-return-brand-hub"
            className="inline-flex items-center justify-center rounded-full border border-[var(--onboarding-hair)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-card)] no-underline"
          >
            Return to Brand Hub
          </Link>
        </div>
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
