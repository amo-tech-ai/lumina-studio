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
import {
  ANALYSIS_SCREEN,
  EMPTY_ANSWERS,
  FIRST_SCREEN,
  LAST_SCREEN,
  type OnboardingAnswers,
  ctaDisabled,
  nextScreen,
  previousScreen,
} from "@/lib/onboarding/navigation";
import { useScreenHistory } from "@/lib/onboarding/use-screen-history";

/**
 * IPI-833 · ONB2-UI-001 — the 13-screen onboarding flow.
 *
 * Local state only: no network, no Supabase, no AI, no persistence. IPI-835
 * replaces the answer store with a real onboarding session and the screen-12
 * placeholder with live crawl progress.
 *
 * `initialScreen` exists so tests can mount any screen directly without walking
 * twelve clicks to reach it.
 */
export function OnboardingFlow({
  initialScreen = FIRST_SCREEN,
}: {
  initialScreen?: number;
}) {
  const router = useRouter();
  const { screen, goToScreen, replaceScreen } = useScreenHistory(initialScreen);
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ANSWERS);

  const screenRegionRef = useRef<HTMLDivElement>(null);
  const hasRendered = useRef(false);

  // Move focus to the new screen's heading. Without this a screen-reader user
  // stays parked on the Continue button they just pressed while the entire page
  // changes underneath them.
  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      return;
    }
    const heading = screenRegionRef.current?.querySelector<HTMLElement>("h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [screen]);

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

  const goNext = useCallback(() => {
    if (screen === LAST_SCREEN) {
      router.push("/app");
      return;
    }
    goToScreen(nextScreen(screen));
  }, [goToScreen, router, screen]);

  const goBack = useCallback(() => goToScreen(previousScreen(screen)), [goToScreen, screen]);

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
        // the payoff screen restarts the timer and bounces the user forward again.
        return <AnalysisProgressScreen onComplete={() => replaceScreen(LAST_SCREEN)} />;
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

      {screen === ANALYSIS_SCREEN ? (
        // No footer while setup runs — there is nothing useful to press, and a
        // Back button here would strand the flow mid-run.
        <div className="h-12" />
      ) : (
        <FlowFooter
          screen={screen}
          continueDisabled={ctaDisabled(screen, answers)}
          continueLabel={screen === LAST_SCREEN ? "Open FashionOS" : "Continue"}
          onBack={goBack}
          onSkip={goNext}
          onContinue={goNext}
        />
      )}
    </div>
  );
}
