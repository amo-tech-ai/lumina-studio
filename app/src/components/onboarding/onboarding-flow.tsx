"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnalysisProgressScreen } from "@/components/onboarding/analysis-progress-screen";
import { BrandDnaPayoffScreen } from "@/components/onboarding/brand-dna-payoff-screen";
import { FlowFooter } from "@/components/onboarding/flow-footer";
import { MarketingScreen } from "@/components/onboarding/marketing/marketing-screen";
import { BrandDetailsQuestion } from "@/components/onboarding/questions/brand-details-question";
import { BuildTypeQuestion } from "@/components/onboarding/questions/build-type-question";
import { GrowthPreferenceQuestion } from "@/components/onboarding/questions/growth-preference-question";
import { SalesChannelsQuestion } from "@/components/onboarding/questions/sales-channels-question";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { toUserFacingOnboardingError } from "@/lib/onboarding/onboarding-errors";
import {
  ANALYSIS_SCREEN,
  EMPTY_ANSWERS,
  FIRST_SCREEN,
  LAST_SCREEN,
  type OnboardingAnswers,
  ctaDisabled,
  ctaLabel,
  nextScreen,
  previousScreen,
} from "@/lib/onboarding/navigation";
import { useScreenHistory } from "@/lib/onboarding/use-screen-history";

/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * the 13-screen onboarding flow.
 *
 * Persistence (IPI-835 · B1 / IPI-903) is optional via callbacks so unit tests stay offline.
 * Production mounts this through `OnboardingSessionGate`.
 *
 * `initialScreen` / `initialAnswers` / `initialBrandId` exist so tests (and resume) can mount
 * any screen without walking twelve clicks.
 */
export function OnboardingFlow({
  initialScreen = FIRST_SCREEN,
  initialAnswers = EMPTY_ANSWERS,
  initialBrandId = null,
  onDraftChange,
  onCommitAnalysis,
}: {
  initialScreen?: number;
  initialAnswers?: OnboardingAnswers;
  /** Resume: brand already materialized on the session. */
  initialBrandId?: string | null;
  onDraftChange?: (screen: number, answers: OnboardingAnswers) => void;
  /** Called once when entering screen 12 — must return materialized org+brand ids. */
  onCommitAnalysis?: (
    answers: OnboardingAnswers,
  ) => Promise<{ orgId: string; brandId: string }>;
}) {
  const router = useRouter();
  const { screen, goToScreen, replaceScreen, goBack } = useScreenHistory(initialScreen);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [brandId, setBrandId] = useState<string | null>(initialBrandId);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const draftRef = useRef(onDraftChange);
  draftRef.current = onDraftChange;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const screenRegionRef = useRef<HTMLDivElement>(null);
  const previousScreenRef = useRef(screen);

  // Move focus only when the screen value actually changes. Tracking the prior
  // value avoids focusing on initial mount and during StrictMode's repeated
  // effect invocation while preserving the screen-reader transition cue.
  useEffect(() => {
    if (previousScreenRef.current === screen) return;
    previousScreenRef.current = screen;

    const heading = screenRegionRef.current?.querySelector<HTMLElement>("h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [screen]);

  // Autosave whenever screen or answers change (gate no-ops when unset).
  useEffect(() => {
    draftRef.current?.(screen, answers);
  }, [screen, answers]);

  // IPI-903: deep link to analysis/payoff without a materialized brand must not run
  // the timer or DNA payoff. Bounce to the pre-analysis screen until Continue materializes.
  useEffect(() => {
    if (brandId) return;
    if (screen < ANALYSIS_SCREEN) return;
    replaceScreen(previousScreen(ANALYSIS_SCREEN));
  }, [brandId, screen, replaceScreen]);

  const update = useCallback(
    <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
      setAnswers((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const toggleChannel = useCallback((id: string) => {
    setAnswers((current) => {
      const listed = { ...current.listed };
      if (listed[id]) {
        delete listed[id];
      } else {
        listed[id] = true;
      }
      return { ...current, listed };
    });
  }, []);

  const goNext = useCallback(async () => {
    if (screen === LAST_SCREEN) {
      router.push("/app");
      return;
    }
    const target = nextScreen(screen);
    if (target === ANALYSIS_SCREEN && onCommitAnalysis) {
      const startedFrom = screen;
      setCommitting(true);
      setCommitError(null);
      try {
        const created = await onCommitAnalysis(answers);
        // User backed out (or navigated) while the request was in flight — drop the transition.
        if (screenRef.current !== startedFrom) return;
        // Without a brand id the deep-link gate would bounce 12→11 in a loop.
        if (!created?.brandId) {
          setCommitError(toUserFacingOnboardingError(new Error("missing brand"), "setup"));
          return;
        }
        setBrandId(created.brandId);
        goToScreen(ANALYSIS_SCREEN);
      } catch (err) {
        if (screenRef.current !== startedFrom) return;
        setCommitError(toUserFacingOnboardingError(err, "setup"));
      } finally {
        setCommitting(false);
      }
      return;
    }
    goToScreen(target);
  }, [answers, goToScreen, onCommitAnalysis, router, screen]);

  const skipCurrentScreen = useCallback(() => {
    if (committing) return;
    setAnswers((current) => {
      switch (screen) {
        case 4:
          return { ...current, brandName: "", websiteUrl: "" };
        case 5:
          return { ...current, listed: {} };
        case 7:
          return { ...current, grow: null };
        default:
          return current;
      }
    });
    void goNext();
  }, [committing, goNext, screen]);

  const renderScreen = () => {
    switch (screen) {
      case 2:
        return (
          <BuildTypeQuestion value={answers.build} onChange={(v) => update("build", v)} />
        );
      case 4:
        return (
          <BrandDetailsQuestion
            brandName={answers.brandName}
            websiteUrl={answers.websiteUrl}
            onBrandNameChange={(v) => update("brandName", v)}
            onWebsiteUrlChange={(v) => update("websiteUrl", v)}
          />
        );
      case 5:
        return <SalesChannelsQuestion selected={answers.listed} onToggle={toggleChannel} />;
      case 7:
        return (
          <GrowthPreferenceQuestion value={answers.grow} onChange={(v) => update("grow", v)} />
        );
      case ANALYSIS_SCREEN:
        // replace, not push: the loader must not stay in history, or Back from
        // the payoff screen restarts analysis and bounces the user forward again.
        return (
          <AnalysisProgressScreen
            brandId={brandId}
            answers={answers}
            onComplete={() => replaceScreen(LAST_SCREEN)}
          />
        );
      case LAST_SCREEN:
        return <BrandDnaPayoffScreen />;
      default:
        return <MarketingScreen screen={screen} />;
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-between gap-6 px-4 py-8">
      <StepIndicator screen={screen} />

      <div
        ref={screenRegionRef}
        key={screen}
        data-testid={`onboarding-screen-${screen}`}
        className="flex w-full flex-1 items-center justify-center"
      >
        {renderScreen()}
      </div>

      {commitError ? (
        <p className="font-sans text-sm text-destructive" role="alert">
          {commitError}
        </p>
      ) : null}

      {screen === ANALYSIS_SCREEN ? (
        // No footer while setup runs — there is nothing useful to press, and a
        // Back button here would strand the flow mid-run.
        <div className="h-12" />
      ) : (
        <FlowFooter
          screen={screen}
          continueDisabled={
            committing ||
            ctaDisabled(screen, answers) ||
            // Skip on screen 4 can clear the name; block commit until it's filled.
            (Boolean(onCommitAnalysis) &&
              nextScreen(screen) === ANALYSIS_SCREEN &&
              answers.brandName.trim() === "")
          }
          continueLabel={committing ? "Starting…" : ctaLabel(screen)}
          navigationDisabled={committing}
          onBack={goBack}
          onSkip={skipCurrentScreen}
          onContinue={() => {
            void goNext();
          }}
        />
      )}
    </div>
  );
}
