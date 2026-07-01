import type { IntelligenceActivityGroup } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

type Props = {
  groups: IntelligenceActivityGroup[];
};

export function RecentActivitySection({ groups }: Props) {
  if (groups.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Recent activity">
      <h3 className={styles.sectionTitle}>Recent activity</h3>
      {groups.map((group) => (
        <div key={group.period} className={styles.activityGroup}>
          <h4 className={styles.activityPeriod}>{group.title}</h4>
          <ul className={styles.activityList}>
            {group.items.map((item) => (
              <li key={item.id} className={styles.activityItem}>
                <span className={styles.activityLabel}>{item.label}</span>
                {item.detail ? (
                  <span className={styles.activityDetail}>{item.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
