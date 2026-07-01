import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2 } from "lucide-react";

import styles from "./command-center.module.css";

type Props = {
  heroBrandId: string;
  pendingApprovalCount: number;
};

export function QuickActionChips({ heroBrandId, pendingApprovalCount }: Props) {
  return (
    <div className={styles.quickActions}>
      <Link href="/app/shoots/new" className={styles.quickPrimary}>
        Generate deliverables
        <ArrowRight className={styles.quickIcon} aria-hidden />
      </Link>
      {pendingApprovalCount > 0 ? (
        <Link href={`/app/brand/${heroBrandId}`} className={styles.quickSecondary}>
          <CheckCircle2 className={styles.quickIcon} aria-hidden />
          Review approvals
        </Link>
      ) : (
        <Link href="/app/brand" className={styles.quickSecondary}>
          Open brands
        </Link>
      )}
      <Link href="/app/shoots/new" className={styles.quickSecondary}>
        <Camera className={styles.quickIcon} aria-hidden />
        Plan a shoot
      </Link>
    </div>
  );
}
