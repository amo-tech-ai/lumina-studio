import { Progress } from "@/components/ui/progress";
import type { BrandScoreRow } from "@/types/brand-intelligence";

const SCORE_LABELS: Record<string, string> = {
  visual: "Visual clarity",
  audience: "Audience clarity",
  consistency: "Brand consistency",
  commerce_readiness: "Commerce readiness",
};

const SCORE_ORDER = ["visual", "audience", "consistency", "commerce_readiness"];

type BrandScoreBarsProps = {
  scores: BrandScoreRow[];
};

export function BrandScoreBars({ scores }: BrandScoreBarsProps) {
  const byType = new Map(scores.map((s) => [s.score_type, s.score]));
  const ordered = SCORE_ORDER.filter((t) => byType.has(t)).map((t) => ({
    type: t,
    label: SCORE_LABELS[t] ?? t,
    score: byType.get(t) ?? 0,
  }));

  const extras = scores.filter((s) => !SCORE_ORDER.includes(s.score_type));

  return (
    <div className="space-y-4">
      {[...ordered, ...extras.map((s) => ({ type: s.score_type, label: SCORE_LABELS[s.score_type] ?? s.score_type, score: s.score }))].map(
        ({ type, label, score }) => (
          <div key={type}>
            <div className="mb-1.5 flex items-center justify-between font-sans text-sm">
              <span>{label}</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(score)}</span>
            </div>
            <Progress value={score} className="h-2" aria-label={`${label}: ${Math.round(score)} out of 100`} />
          </div>
        ),
      )}
    </div>
  );
}
