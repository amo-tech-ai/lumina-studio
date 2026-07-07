import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import type { ShootDetailApproval } from "@/lib/shoot/get-shoot-detail";
import { formatShootDate } from "../shoot-detail-format";
import styles from "../shoot-detail.module.css";

type Props = {
  approvals: ShootDetailApproval[];
};

// shoot_intake_drafts_status_check: pending | approved | rejected.
const APPROVAL_DOT: Record<string, string> = {
  pending: "var(--color-warning-text)",
  approved: "var(--color-approved)",
  rejected: "var(--color-blocked)",
};

function approvalDot(status: string): string {
  return APPROVAL_DOT[status] ?? "var(--color-text-muted)";
}

/** shoot_intake_drafts rows have no title/thumb/confidence column — DC's
 *  ApprovalCard mock includes those, but only status + timestamps are real. */
export function ApprovalsTab({ approvals }: Props) {
  if (approvals.length === 0) {
    return (
      <EmptyState
        heading="No approvals yet"
        body="AI-drafted shoot changes awaiting your review will appear here."
        icon={<ClipboardCheck />}
      />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle} style={{ marginBottom: 14 }}>
        Approvals
      </h3>
      <div className={styles.approvalGrid}>
        {approvals.map((a) => (
          <div key={a.id} className={styles.approvalCard}>
            <StatusChip dot={approvalDot(a.status)} label={a.status} />
            <div className={styles.rowSub}>Submitted {formatShootDate(a.created_at)}</div>
            {a.approved_at ? <div className={styles.rowSub}>Approved {formatShootDate(a.approved_at)}</div> : null}
            {a.rejected_at ? <div className={styles.rowSub}>Rejected {formatShootDate(a.rejected_at)}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
