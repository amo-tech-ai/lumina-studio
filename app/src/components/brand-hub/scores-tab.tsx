import type { BrandScoreDetail } from "@/lib/brand-hub";
import { normalizeDisplayScore, parseScoreDetails } from "@/lib/brand-hub";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

// AC3 — extended scores coming soon
const EXTENDED_SCORE_LABELS = ["Fashion DNA", "Runway Readiness", "Sponsor Fit", "Sustainability"];

// AC2 — citations block: source URLs from AiProfile.evidenceSources
// Only http/https URLs are linked — non-URL strings (page titles, javascript: etc.) render as plain text.
const CitationsBlock = ({ sources }: { sources: string[] }) => {
  const safeUrls = sources.filter((u) => u.startsWith("https://") || u.startsWith("http://"));
  const plainText = sources.filter((u) => !u.startsWith("https://") && !u.startsWith("http://"));
  const hasContent = safeUrls.length > 0 || plainText.length > 0;
  if (!hasContent) return null;
  return (
    <details className="mt-4 rounded-xl border border-[#E8E0D8] p-3">
      <summary className="cursor-pointer font-sans text-xs font-medium text-[#64748B] hover:text-[#1E293B]">
        Sources ({sources.length})
      </summary>
      <ul className="mt-2 space-y-1">
        {safeUrls.map((url, i) => (
          <li key={`url-${i}`}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-sans text-[11px] text-[#E87C4D] hover:underline"
            >
              {url}
            </a>
          </li>
        ))}
        {plainText.map((text, i) => (
          <li key={`text-${i}`} className="font-sans text-[11px] text-[#64748B]">
            {text}
          </li>
        ))}
      </ul>
    </details>
  );
};

type Props = {
  scores: BrandScoreDetail[];
  citations?: string[];
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

export const ScoresTab = ({ scores, citations }: Props) => {
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

      {/* AC3 — extended scores coming soon */}
      <div className="rounded-xl border border-dashed border-[#E8E0D8] p-4">
        <p className="mb-2 font-sans text-xs font-medium text-[#94A3B8]">More dimensions coming soon</p>
        <div className="flex flex-wrap gap-2">
          {EXTENDED_SCORE_LABELS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[#E8E0D8] px-3 py-1 font-sans text-xs text-[#CBD5E1]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* AC2 — citations */}
      {citations && citations.length > 0 && <CitationsBlock sources={citations} />}
    </div>
  );
};
