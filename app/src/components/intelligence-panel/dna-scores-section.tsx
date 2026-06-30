import { BASE_SCORE_TYPES } from "@/lib/brand-scores";
import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";

const PILLAR_LABELS: Record<(typeof BASE_SCORE_TYPES)[number], string> = {
  visual: "Visual",
  audience: "Audience",
  consistency: "Consistency",
  commerce_readiness: "Commerce",
};

type Props = {
  scores: NonNullable<IntelligencePanelData["scores"]>;
};

export function DnaScoresSection({ scores }: Props) {
  return (
    <section aria-label="Brand DNA scores" className="px-4 pb-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-sans text-[11px] font-medium text-[#6B7280]">DNA score</p>
        <p className="font-sans text-lg font-semibold tabular-nums text-[#111]">
          {scores.dna.toFixed(1)}
        </p>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-1.5">
        {BASE_SCORE_TYPES.map((key) => {
          const value = scores.pillars[key];
          return (
            <li
              key={key}
              className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5"
            >
              <p className="font-sans text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                {PILLAR_LABELS[key]}
              </p>
              <p className="font-sans text-sm font-medium tabular-nums text-[#374151]">
                {value == null ? "—" : value.toFixed(0)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
