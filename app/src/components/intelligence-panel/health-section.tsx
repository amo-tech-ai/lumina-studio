import type { EvidenceBlockProps } from "@/components/evidence-block/types";
import type { IntelligenceHealthPillar } from "@/lib/intelligence/panel-contract";
import { ChevronRight } from "lucide-react";

import styles from "./intelligence-panel.module.css";

type Props = {
  dna: number;
  pillars: IntelligenceHealthPillar[];
  dnaEvidence?: Omit<EvidenceBlockProps, "className" | "loading">;
  variant?: "command" | "detail";
};

function pillarBarColor(score: number): string {
  if (score >= 80) return "var(--dna-bar-high, #059669)";
  if (score >= 60) return "var(--dna-bar-mid, #d97706)";
  return "var(--dna-bar-low, #dc2626)";
}

function dnaBarColor(score: number): string {
  if (score >= 80) return "var(--dna-bar-high, #059669)";
  if (score >= 60) return "var(--dna-bar-mid, #d97706)";
  return "var(--dna-bar-low, #dc2626)";
}

/** DC populated panel — command center uses 3 pillars; brand detail uses four. */
function displayPillars(
  pillars: IntelligenceHealthPillar[],
  variant: "command" | "detail",
): IntelligenceHealthPillar[] {
  if (variant === "detail") {
    const labels: Record<string, string> = {
      visual: "Visual",
      voice: "Voice",
      consistency: "Consistency",
      commerce: "Commerce",
    };
    const mapped = pillars
      .filter((pillar) => pillar.key !== "brand")
      .map((pillar) => ({
        ...pillar,
        label: labels[pillar.key] ?? pillar.label,
      }));
    if (mapped.length >= 4) return mapped.slice(0, 4);
    return mapped.length > 0 ? mapped : pillars.slice(0, 4);
  }

  const preferred = pillars.filter((pillar) =>
    ["brand", "visual", "voice"].includes(pillar.key),
  );
  return (preferred.length > 0 ? preferred : pillars).slice(0, 3);
}

export function HealthSection({ dna, pillars, variant = "command" }: Props) {
  const displayPillarsList = displayPillars(pillars, variant);
  const displayDna = Math.round(dna);

  return (
    <section className={styles.healthBlock} aria-label="Brand health scores">
      <div className={styles.dnaHeroRow}>
        <span className={styles.dnaHeroLabel}>DNA Score</span>
        <span className={styles.dnaHeroValue}>{displayDna}</span>
      </div>
      <div className={styles.scoreTrack} aria-hidden>
        <div
          className={styles.scoreFill}
          style={{ width: `${displayDna}%`, background: dnaBarColor(displayDna) }}
        />
      </div>

      <ul className={styles.pillarList}>
        {displayPillarsList.map((pillar) => {
          const score = Math.round(pillar.score);
          const weak = score > 0 && score < 80;
          return (
            <li key={pillar.key} className={styles.pillarItem}>
              <div className={styles.pillarRow}>
                <span className={styles.pillarLabel}>
                  {weak ? <span className={styles.pillarWeakDot} aria-hidden /> : null}
                  {pillar.label}
                </span>
                <span className={styles.pillarScoreRow}>
                  <span className={styles.pillarScore}>{score}</span>
                  {variant === "detail" ? (
                    <ChevronRight className={styles.pillarChevron} aria-hidden />
                  ) : null}
                </span>
              </div>
              <div className={styles.scoreTrackThin} aria-hidden>
                <div
                  className={styles.scoreFillThin}
                  style={{
                    width: `${score}%`,
                    background: pillarBarColor(score),
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
