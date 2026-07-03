import type { ShootDetailApproval } from "@/lib/shoot/get-shoot-detail";
import { relativeTime } from "@/lib/shoot/shoot-detail-format";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = { approvals: ShootDetailApproval[] };

function approvalTitle(status: string): string {
  if (status === "pending") return "Pending approval";
  if (status === "approved") return "Approved draft";
  if (status === "rejected") return "Rejected draft";
  return status;
}

export function ShootDetailApprovalsTab({ approvals }: Props) {
  if (approvals.length === 0) {
    return (
      <ShootDetailEmpty message="No intake drafts for this shoot. Wizard HITL approvals appear here when submitted." />
    );
  }

  return (
    <div>
      <h3 className={styles.sectionTitle}>Approvals</h3>
      <div className={styles.approvalGrid}>
        {approvals.map((item) => (
          <div key={item.id} className={styles.approvalCard}>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              {approvalTitle(item.status)}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Submitted {relativeTime(item.created_at)}
            </div>
            {item.agent_run_id ? (
              <div
                className="font-mono"
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                  marginTop: "0.375rem",
                }}
              >
                Run {item.agent_run_id.slice(0, 8)}…
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
