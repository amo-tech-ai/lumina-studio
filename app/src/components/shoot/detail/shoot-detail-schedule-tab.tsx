import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import { formatDateRange } from "@/lib/shoot/shoot-detail-format";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = { data: ShootDetailPayload };

export function ShootDetailScheduleTab({ data }: Props) {
  const { shoot } = data;
  const dateLabel = formatDateRange(shoot.start_date, shoot.end_date);
  const hasSchedule = Boolean(dateLabel || shoot.location);

  if (!hasSchedule) {
    return (
      <ShootDetailEmpty message="No schedule yet. Set shoot dates and location when planning production. Day-of call/wrap timeline blocks are not available until schedule blocks ship in a future migration." />
    );
  }

  const blocks: { title: string; detail: string | null }[] = [];

  if (dateLabel) {
    blocks.push({
      title: "Shoot dates",
      detail: dateLabel,
    });
  }

  if (shoot.location) {
    blocks.push({
      title: "Location",
      detail: shoot.location,
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.875rem",
        }}
      >
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
          Shoot schedule
        </h3>
        {dateLabel ? (
          <span
            className="font-mono"
            style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}
          >
            {dateLabel}
          </span>
        ) : null}
      </div>
      <div>
        {blocks.map((block, i) => (
          <div key={block.title} className={styles.scheduleBlock}>
            <div className={styles.scheduleRail}>
              <span className={styles.scheduleTime}>{String(i + 1).padStart(2, "0")}</span>
              {i < blocks.length - 1 ? <span className={styles.scheduleLine} /> : null}
            </div>
            <div className={styles.scheduleCard}>
              <div className={styles.scheduleCardInner}>
                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)" }}>
                  {block.title}
                </div>
                {block.detail ? (
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                      marginTop: "0.125rem",
                    }}
                  >
                    {block.detail}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
