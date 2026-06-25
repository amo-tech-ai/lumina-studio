import type { BrandScoreDetail } from "@/lib/brand-hub";
import { normalizeDisplayScore, parseScoreDetails } from "@/lib/brand-hub";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

type Props = {
  scores: BrandScoreDetail[];
};

const EvidenceHint = ({ evidence }: { evidence: string[] }) => (
  <details className="mt-1">
    <summary className="cursor-pointer font-sans text-[10px] text-[#E87C4D] hover:underline">
      Evidence ({evidence.length})
    </summary>
    <ul className="mt-1 list-inside list-disc space-y-0.5 font-sans text-[10px] text-[#64748B]">
      {evidence.map((line, index) => (
        <li key={`${line}-${index}`}>{line}</li>
      ))}
    </ul>
  </details>
);

export const ScoresTab = ({ scores }: Props) => {
  if (scores.length === 0) {
    return (
      <p className="font-sans text-sm text-[#94A3B8]">
        No scores yet. Run Re-analyze to generate brand scores.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {scores.map((s) => {
        const details = parseScoreDetails(s.details);
        const displayScore = normalizeDisplayScore(s.score);
        const pct = displayScore;

        return (
          <div
            key={s.score_type}
            className="rounded-xl border border-[#E8E0D8] bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-sm font-medium text-[#1E293B]">
                  {scoreLabel(s.score_type)}
                </p>
                {details?.confidence !== undefined && (
                  <p className="font-sans text-[10px] text-[#94A3B8]">
                    Confidence {Math.round(details.confidence * 100)}%
                  </p>
                )}
              </div>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-semibold text-white"
                style={{ background: scoreColor(displayScore) }}
              >
                {displayScore}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F1EDE8]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: scoreColor(displayScore) }}
              />
            </div>
            {details?.evidence && details.evidence.length > 0 && (
              <EvidenceHint evidence={details.evidence} />
            )}
          </div>
        );
      })}
    </div>
  );
};
