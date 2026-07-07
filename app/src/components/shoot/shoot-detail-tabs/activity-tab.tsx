import { Activity as ActivityIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import type { ShootDetailActivityEvent } from "@/lib/shoot/get-shoot-detail";
import { formatShootDate } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  activity: ShootDetailActivityEvent[];
};

export function ActivityTab({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <EmptyState heading="No activity yet" body="AI agent runs on this shoot will appear here." icon={<ActivityIcon />} />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle} style={{ marginBottom: 14 }}>
        Activity <span className={`${styles.mono} ${styles.sectionTitleCount}`}>· {activity.length}</span>
      </h3>
      <div className={styles.timeline}>
        {activity.map((e, i) => (
          <div key={e.id} className={styles.activityRow}>
            <div className={styles.activityDotCol}>
              <span className={styles.activityDot} />
              {i < activity.length - 1 ? <span className={styles.activityLine} /> : null}
            </div>
            <div className={styles.activityBody}>
              <div className={styles.activityText}>
                {e.agent_name}
                {e.model ? ` · ${e.model}` : ""}
              </div>
              <div className={styles.activityTime}>{formatShootDate(e.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
