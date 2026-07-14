import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/crm/crm-detail-shell.module.css";

/** Route-level loading.tsx — shown while getCompanyDetail's fetch is in
 *  flight. Shape mirrors the real header (avatar/name/tabs) + row list. */
export default function CompanyDetailLoading() {
  return (
    <div className={styles.loadingRoot}>
      <div className={styles.loadingHeaderRow}>
        <Skeleton className={styles.loadingAvatar} />
        <Skeleton className={styles.loadingName} />
      </div>
      <div className={styles.loadingTabs}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className={styles.loadingTab} />
        ))}
      </div>
      <div className={styles.loadingRows}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className={styles.loadingRow} />
        ))}
      </div>
    </div>
  );
}
