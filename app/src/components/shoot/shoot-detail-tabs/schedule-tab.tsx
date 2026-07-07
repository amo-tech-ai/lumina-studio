import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import { formatShootDate } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  shoot: ShootDetailPayload["shoot"];
};

/** shoot.shoots only has start_date/end_date/location — no per-block itinerary
 *  table exists. DC's mock shows 5 sample call-sheet blocks; those are
 *  illustrative content, not real data, so this renders only real facts
 *  (fewer entries than the mock) in the same timeline layout. */
export function ScheduleTab({ shoot }: Props) {
  const entries: { label: string; detail: string }[] = [];
  if (shoot.start_date) {
    entries.push({ label: formatShootDate(shoot.start_date), detail: "Shoot day" });
  }
  if (shoot.location) {
    entries.push({ label: "Location", detail: shoot.location });
  }
  if (shoot.end_date && shoot.end_date !== shoot.start_date) {
    entries.push({ label: formatShootDate(shoot.end_date), detail: "Wrap" });
  }

  if (entries.length === 0) {
    return (
      <EmptyState heading="No schedule set yet" body="Shoot dates and location will appear here." icon={<CalendarClock />} />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle} style={{ marginBottom: 14 }}>
        Schedule
      </h3>
      <div className={styles.timeline}>
        {entries.map((e, i) => (
          <div key={i} className={styles.timelineRow}>
            <div className={styles.timelineTime}>
              <span className={`${styles.mono} ${styles.timelineTimeLabel}`}>{e.label}</span>
              {i < entries.length - 1 ? <span className={styles.timelineLine} /> : null}
            </div>
            <div className={styles.timelineBody}>
              <div className={styles.timelineCard}>
                <div className={styles.timelineTitle}>{e.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
