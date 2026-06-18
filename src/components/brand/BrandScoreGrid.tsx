import { Progress } from "@/components/ui/progress";
import {
  BRAND_SCORE_LABELS,
  type BrandScoreRow,
  type BrandScoreType,
} from "@/types/brand-intelligence";

function scoreLabel(scoreType: string): string {
  if (scoreType in BRAND_SCORE_LABELS) {
    return BRAND_SCORE_LABELS[scoreType as BrandScoreType];
  }
  return scoreType.replace(/_/g, " ");
}

type BrandScoreGridProps = {
  scores: BrandScoreRow[];
};

export function BrandScoreGrid({ scores }: BrandScoreGridProps) {
  if (scores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-sans">No readiness scores yet.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {scores.map((row) => (
        <div key={row.id} className="space-y-2">
          <div className="flex items-center justify-between text-sm font-sans">
            <span className="font-medium">{scoreLabel(row.score_type)}</span>
            <span className="tabular-nums text-muted-foreground">{row.score}/100</span>
          </div>
          <Progress value={row.score} className="h-2" aria-label={`${scoreLabel(row.score_type)} score`} />
        </div>
      ))}
    </div>
  );
}
