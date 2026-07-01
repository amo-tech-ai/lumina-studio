import Link from "next/link";

import type { IntelligenceRecommendedAction } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

type Props = {
  actions: IntelligenceRecommendedAction[];
};

export function RecommendedActionsSection({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Recommended actions">
      <h3 className={styles.sectionTitle}>Recommended actions</h3>
      <ul className={styles.actionPills}>
        {actions.map((action) => (
          <li key={action.id}>
            {action.href ? (
              <Link href={action.href} className={styles.actionPill}>
                {action.label}
              </Link>
            ) : (
              <span className={styles.actionPill}>{action.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
