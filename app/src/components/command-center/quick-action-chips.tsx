import Link from "next/link";

import styles from "./command-center.module.css";

type Props = {
  heroBrandId: string;
  pendingApprovalCount: number;
};

export function QuickActionChips({ heroBrandId, pendingApprovalCount }: Props) {
  return (
    <div className={styles.quickActions}>
      <Link href={`/app/assets?brand=${heroBrandId}`} className={styles.quickPrimary}>
        Generate deliverables
      </Link>
      <Link
        href={pendingApprovalCount > 0 ? `/app/brand/${heroBrandId}` : "/app/brand"}
        className={styles.quickSecondary}
      >
        Review approvals
      </Link>
      <Link href="/app/shoots/new" className={styles.quickSecondary}>
        Plan a shoot
      </Link>
    </div>
  );
}
