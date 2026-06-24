import type { BrandScoreRow } from "@/types/brand-intelligence";

const SCORE_LABELS: Record<string, string> = {
  visual: "Visual Identity",
  audience: "Audience Clarity",
  consistency: "Brand Consistency",
  commerce_readiness: "Commerce Readiness",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function ScoreBar({ score_type, score }: BrandScoreRow) {
  const color = scoreColor(score);
  const label = SCORE_LABELS[score_type] ?? score_type;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-outfit capitalize">{label}</span>
        <span className="text-muted-foreground">{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

type Props = {
  scores: BrandScoreRow[];
  productionReadiness?: number;
};

export function BrandScorePanel({ scores, productionReadiness }: Props) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="font-serif text-lg">Brand Scores</h3>
      <div className="space-y-3">
        {scores.map((s) => (
          <ScoreBar key={s.score_type} {...s} />
        ))}
        {typeof productionReadiness === "number" && (
          <>
            <div className="border-t pt-3">
              <ScoreBar
                id="production"
                score_type="production_readiness"
                score={productionReadiness}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
