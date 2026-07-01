import type { IntelligenceInsight } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

type Props = {
  insights: IntelligenceInsight[];
};

export function AiInsightsSection({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <section className={styles.section} aria-label="AI insights">
      <h3 className={styles.sectionTitle}>AI insights</h3>
      <ul className={styles.insightList}>
        {insights.map((item) => (
          <li key={item.id} className={styles.insightCard}>
            <p className={styles.insightLabel}>{item.label}</p>
            <p className={styles.insightValue}>{item.value}</p>
            {item.confidence != null ? (
              <p className={styles.insightMeta}>{item.confidence}% confidence</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
