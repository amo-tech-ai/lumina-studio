import { FileText } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { ShootDetailDeliverable } from "@/lib/shoot/get-shoot-detail";
import { deliverableDot } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  deliverables: ShootDetailDeliverable[];
};

/** shoot.shoot_deliverables has no linked-asset column — DC's cover-photo card
 *  is swapped for a neutral icon box rather than a fabricated preview. */
export function DeliverablesTab({ deliverables }: Props) {
  const ready = deliverables.filter((d) => d.status === "delivered" || d.status === "ready").length;

  if (deliverables.length === 0) {
    return (
      <EmptyState heading="No deliverables defined yet" body="Planned deliverables for this shoot will appear here." icon={<FileText />} />
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          Deliverables{" "}
          <span className={`${styles.mono} ${styles.sectionTitleCount}`}>
            · {ready}/{deliverables.length} ready
          </span>
        </h3>
        <button type="button" className={styles.secondaryBtn} disabled title="Coming soon">
          Call sheet
        </button>
      </div>
      <div className={styles.delivGrid}>
        {deliverables.map((d) => (
          <div key={d.id} className={styles.delivCard}>
            <div
              className={styles.masonryItem}
              style={{ aspectRatio: "4/3", margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-hidden
            >
              <FileText size={22} color="var(--color-text-muted)" />
            </div>
            <div className={styles.delivBody}>
              <div className={styles.delivLabel}>{d.channel}</div>
              <div className={`${styles.mono} ${styles.delivSpec}`}>
                {d.format ?? "—"} · {d.quantity}
              </div>
              <div className={styles.delivChip}>
                <StatusChip dot={deliverableDot(d.status)} label={d.status ?? "Unknown"} bare />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
