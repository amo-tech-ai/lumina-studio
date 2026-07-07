import { Camera, Plus } from "lucide-react";

import type { ShootDetailShot } from "@/lib/shoot/get-shoot-detail";
import { SHOT_STATUS_LABEL, shotStatusDot } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  shots: ShootDetailShot[];
};

/** Phase 1 is layout-parity only — Add shot / per-row edit are Phase 2 write
 *  actions (IPI-217 respin), so the buttons render but stay disabled. */
export function ShotsTab({ shots }: Props) {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          Shot list <span className={`${styles.mono} ${styles.sectionTitleCount}`}>· {shots.length}</span>
        </h3>
        <button type="button" className={styles.secondaryBtn} disabled title="Coming soon">
          <Plus size={15} aria-hidden />
          Add shot
        </button>
      </div>
      <div className={styles.shotList}>
        {shots.map((t) => (
          <div key={t.id} className={styles.shotRow}>
            <span className={`${styles.mono} ${styles.shotNum}`}>{t.shot_number}</span>
            <span className={styles.shotIcon} aria-hidden>
              <Camera size={20} />
            </span>
            <div className={styles.rowMain}>
              <div className={styles.shotDesc}>{t.description}</div>
              {t.style_notes ? <div className={styles.rowSub}>{t.style_notes}</div> : null}
            </div>
            <span
              className={styles.heroBadge}
              style={{ color: "var(--color-text-secondary)", background: "var(--color-bg-muted)" }}
            >
              <span className={styles.heroBadgeDot} style={{ background: shotStatusDot(t.status) }} />
              {SHOT_STATUS_LABEL[t.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
