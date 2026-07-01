"use client";

import Link from "next/link";
import { toast } from "sonner";

import type { IntelligencePanelData } from "@/lib/intelligence/panel-contract";

import { EvidenceDialog } from "./evidence-dialog";
import styles from "./intelligence-panel.module.css";

type Props = {
  approvals: IntelligencePanelData["approvals"];
};

function confidenceClass(confidence: number): string {
  if (confidence >= 85) return styles.confHigh;
  if (confidence >= 70) return styles.confMid;
  return styles.confLow;
}

export function IntelApprovalQueueSection({ approvals }: Props) {
  if (approvals.pendingCount === 0) {
    return (
      <section className={styles.section} aria-label="Approval queue">
        <h3 className={styles.sectionTitle}>Approvals</h3>
        <p className={styles.mutedCopyInline}>No pending brand drafts.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Approval queue">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Approvals</h3>
        <span className={styles.pendingBadge}>{approvals.pendingCount}</span>
      </div>

      <ul className={styles.approvalList}>
        {approvals.items.map((item) => (
          <li key={item.id} className={styles.approvalCard}>
            {item.thumbnailUrl ? (
              <div className={styles.approvalThumb}>
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  width={48}
                  height={60}
                  className={styles.approvalThumbImg}
                />
              </div>
            ) : null}
            <div className={styles.approvalBody}>
              <div className={styles.approvalTitleRow}>
                <Link href={item.href} className={styles.approvalTitle}>
                  {item.label}
                </Link>
                {item.confidence != null ? (
                  <span className={confidenceClass(item.confidence)}>
                    {item.confidence}%
                  </span>
                ) : null}
              </div>
              {item.explanation ? (
                <p className={styles.approvalExplain}>{item.explanation}</p>
              ) : null}
              <div className={styles.approvalActions}>
                {item.evidence ? (
                  <EvidenceDialog
                    triggerLabel="Explain"
                    evidence={item.evidence}
                    triggerClassName={styles.approvalGhostBtn}
                  />
                ) : null}
                <button
                  type="button"
                  className={styles.approvalGhostBtn}
                  onClick={() => toast.success(`Approved: ${item.label} (fixture)`)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={styles.approvalGhostBtn}
                  onClick={() => toast.message(`Edit: ${item.label} (fixture)`)}
                >
                  Edit
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
