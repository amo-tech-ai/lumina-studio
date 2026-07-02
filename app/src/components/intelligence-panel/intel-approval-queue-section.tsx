import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";

import { IntelApprovalCard } from "./intel-approval-card";
import styles from "./intelligence-panel.module.css";

type Props = {
  approvals: IntelligencePanelData["approvals"];
  /** Hide empty copy on Command Center populated overview (DC pads with placeholders). */
  hideEmpty?: boolean;
  onApproved?: () => void;
};

export function IntelApprovalQueueSection({
  approvals,
  hideEmpty = false,
  onApproved,
}: Props) {
  const displayCount = approvals.pendingCount;
  const hasItems = approvals.items.length > 0;

  if (!hasItems) {
    if (hideEmpty) return null;
    return (
      <section className={styles.approvalSection} aria-label="Approval queue">
        <div className={styles.sectionHeader}>
          <h3 className={styles.panelSectionTitle}>Approvals</h3>
        </div>
        <p className={styles.mutedCopyInline}>No pending brand drafts.</p>
      </section>
    );
  }

  return (
    <section className={styles.approvalSection} aria-label="Approval queue">
      <div className={styles.sectionHeader}>
        <h3 className={styles.panelSectionTitle}>Approvals</h3>
        <span className={styles.pendingBadge}>{displayCount}</span>
      </div>

      <ul className={styles.approvalList}>
        {approvals.items.map((item) => (
          <li key={item.id}>
            <IntelApprovalCard item={item} onApproved={onApproved} />
          </li>
        ))}
      </ul>
    </section>
  );
}
