import type { BrandScoreRow } from "@/types/brand-intelligence";
import {
  SCORE_LABELS,
  SCORE_DESCRIPTIONS,
  scoreColor,
  scoreLabel,
  computeDnaScore,
  filterScores,
  isBaseScoreType,
} from "@/lib/brand-scores";

function EvidenceTooltip({ evidence }: { evidence?: string[] }) {
  if (!evidence || evidence.length === 0) return null;
  return (
    <div className="relative group">
      <button
        type="button"
        aria-label="Show evidence"
        className="text-xs text-muted-foreground cursor-help underline decoration-dotted ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        ⓘ
      </button>
      <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-lg bg-popover border shadow-lg text-xs text-popover-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
        <ul className="list-disc list-inside space-y-1">
          {evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreBar({ score_type, score, details }: BrandScoreRow) {
  const color = scoreColor(score);
  const label = SCORE_LABELS[score_type] ?? score_type;
  const description = SCORE_DESCRIPTIONS[score_type];
  const confidence = details?.confidence;
  const evidence = details?.evidence;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm items-center">
        <div className="flex items-center gap-1.5">
          <span className="font-outfit capitalize">{label}</span>
          {typeof confidence === "number" && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: scoreColor(confidence) + "22",
                color: scoreColor(confidence),
              }}
            >
              {confidence}%
            </span>
          )}
          <EvidenceTooltip evidence={evidence} />
        </div>
        <span className="text-muted-foreground">{score}</span>
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground/60 leading-tight">{description}</p>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DnaBadge({ dnaScore }: { dnaScore: number | null }) {
  if (dnaScore === null) return null;
  const color = scoreColor(dnaScore);
  return (
    <div className="flex items-center gap-3 pb-3 border-b mb-3">
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {dnaScore}
      </div>
      <div>
        <div className="font-serif text-base">Brand DNA</div>
        <div className="text-xs text-muted-foreground">
          {scoreLabel(dnaScore)} — avg of 4 base dimensions
        </div>
      </div>
    </div>
  );
}

type Props = {
  scores: BrandScoreRow[];
  productionReadiness?: number;
};

export function BrandScorePanel({ scores, productionReadiness }: Props) {
  const cleanScores = filterScores(scores);
  const baseScores = cleanScores.filter((s) => isBaseScoreType(s.score_type));
  const extendedScores = cleanScores.filter((s) => !isBaseScoreType(s.score_type));
  const dnaScore = computeDnaScore(cleanScores);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="font-serif text-lg">Brand Scores</h3>

      <DnaBadge dnaScore={dnaScore} />

      {baseScores.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Core</p>
          <div className="space-y-3">
            {baseScores.map((s) => (
              <ScoreBar key={s.score_type} {...s} />
            ))}
          </div>
        </div>
      )}

      {extendedScores.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Extended</p>
          <div className="space-y-3">
            {extendedScores.map((s) => (
              <ScoreBar key={s.score_type} {...s} />
            ))}
          </div>
        </div>
      )}

      {typeof productionReadiness === "number" && (
        <div className="border-t pt-3">
          <ScoreBar
            id="production"
            score_type="production_readiness"
            score={productionReadiness}
          />
        </div>
      )}
    </div>
  );
}
