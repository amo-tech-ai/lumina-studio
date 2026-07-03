import type { ShootDetailActivity } from "@/lib/shoot/get-shoot-detail";
import { relativeTime } from "@/lib/shoot/shoot-detail-format";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = { activity: ShootDetailActivity[] };

function activityText(entry: ShootDetailActivity): string {
  const agent = entry.agent_name.replace(/-/g, " ");
  return `${agent} ran for this shoot`;
}

export function ShootDetailActivityTab({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <ShootDetailEmpty message="No agent activity logged for this shoot yet." />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle}>
        Activity{" "}
        <span className={styles.sectionTitleMuted}>· {activity.length}</span>
      </h3>
      <div>
        {activity.map((entry, i) => (
          <div key={entry.id} className={styles.activityRow}>
            <div className={styles.activityDotCol}>
              <span className={styles.activityDot} />
              {i < activity.length - 1 ? <span className={styles.activityLine} /> : null}
            </div>
            <div className={styles.activityText}>
              <div>{activityText(entry)}</div>
              <div className={styles.activityTime}>{relativeTime(entry.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
