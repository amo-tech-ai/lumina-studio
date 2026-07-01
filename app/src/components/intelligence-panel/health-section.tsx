import type { EvidenceBlockProps } from "@/components/evidence-block/types";
import type { IntelligenceHealthPillar } from "@/lib/intelligence/panel-contract";

import { EvidenceDialog } from "./evidence-dialog";
import styles from "./intelligence-panel.module.css";

type Props = {
  dna: number;
  pillars: IntelligenceHealthPillar[];
  dnaEvidence?: Omit<EvidenceBlockProps, "className" | "loading">;
};

export function HealthSection({ dna, pillars, dnaEvidence }: Props) {
  return (
    <section className={styles.section} aria-label="Brand health scores">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Health</h3>
        {dnaEvidence ? (
          <EvidenceDialog
            triggerLabel="Explain DNA"
            evidence={dnaEvidence}
            triggerClassName={styles.textButton}
          />
        ) : null}
      </div>

      <div className={styles.dnaHero}>
        <div className={styles.dnaHeroRow}>
          <span className={styles.dnaHeroLabel}>DNA score</span>
          <span className={styles.dnaHeroValue}>{dna.toFixed(0)}</span>
        </div>
        <div className={styles.scoreTrack} aria-hidden>
          <div className={styles.scoreFill} style={{ width: `${dna}%` }} />
        </div>
      </div>

      <ul className={styles.pillarList}>
        {pillars.map((pillar) => (
          <li key={pillar.key} className={styles.pillarItem}>
            <div className={styles.pillarRow}>
              <span className={styles.pillarLabel}>{pillar.label}</span>
              <span className={styles.pillarScoreRow}>
                {pillar.trendDelta != null && pillar.trendDelta !== 0 ? (
                  <span
                    className={
                      pillar.trendDelta > 0 ? styles.trendUp : styles.trendDown
                    }
                  >
                    {pillar.trendDelta > 0 ? "+" : ""}
                    {pillar.trendDelta}
                  </span>
                ) : null}
                <span className={styles.pillarScore}>{pillar.score}</span>
              </span>
            </div>
            <div className={styles.scoreTrackThin} aria-hidden>
              <div
                className={styles.scoreFillThin}
                style={{ width: `${pillar.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
