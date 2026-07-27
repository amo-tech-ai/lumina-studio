import { Progress } from "@/components/ui/progress";
import { LAST_SCREEN, PROGRESS_SEGMENTS, segmentPercent } from "@/lib/onboarding/navigation";

/**
 * IPI-833 — three-segment progress bar plus "N / 13".
 *
 * The design comp hand-rolls this (`seg(1,3)`, `seg(4,7)`, `seg(8,13)`, line
 * 594). COMPONENTS.md claims WizardStep is "used on Onboarding", but the comp
 * imports nothing and WizardStep has different anatomy, so that mapping is
 * aspirational. The shared `Progress` primitive supplies the actual bar — no
 * third progress implementation is introduced.
 *
 * The count is announced politely so a screen-reader user learns they advanced
 * without the announcement interrupting the new screen's heading.
 */
export function StepIndicator({ screen }: { screen: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[var(--onboarding-card-width)] items-center gap-3">
      <div className="flex flex-1 items-center gap-2" aria-hidden="true">
        {PROGRESS_SEGMENTS.map((segment) => (
          <Progress
            key={`${segment.from}-${segment.to}`}
            value={segmentPercent(screen, segment.from, segment.to)}
            className="h-1 flex-1 bg-[var(--onboarding-hair)]/25"
          />
        ))}
      </div>
      <p
        aria-live="polite"
        className="min-w-14 text-right text-xs font-medium tabular-nums text-[var(--onboarding-card)]/70"
      >
        <span className="sr-only">Step </span>
        {screen} / {LAST_SCREEN}
      </p>
    </div>
  );
}
