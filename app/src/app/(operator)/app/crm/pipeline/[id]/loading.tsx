import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/crm/deal-detail-workspace.module.css";

export default function DealDetailLoading() {
  return (
    <div className={styles.loadingRoot}>
      <Skeleton className={styles.loadingTitle} />
      <Skeleton className={styles.loadingSubtitle} />
      <div className={styles.loadingGrid}>
        <Skeleton className={styles.loadingField} />
        <Skeleton className={styles.loadingField} />
        <Skeleton className={styles.loadingField} />
      </div>
      <div className={styles.loadingRows}>
        <Skeleton className={styles.loadingRow} />
        <Skeleton className={styles.loadingRow} />
        <Skeleton className={styles.loadingRow} />
      </div>
    </div>
  );
}
