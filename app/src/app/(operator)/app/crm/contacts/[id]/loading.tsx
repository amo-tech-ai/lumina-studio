import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/crm/crm-detail-shell.module.css";

/** Route-level loading.tsx — shown while getContactDetail's fetch is in
 *  flight. Shape mirrors the real header (avatar/name/tabs) + row list.
 *  3 tabs (Overview/Deals/Activity) — matches SCR-29's own tab count,
 *  not Company Detail's 4. */
export default function ContactDetailLoading() {
  return (
    <div className={styles.loadingRoot}>
      <div className={styles.loadingHeaderRow}>
        <Skeleton className={styles.loadingAvatar} />
        <Skeleton className={styles.loadingName} />
      </div>
      <div className={styles.loadingTabs}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={styles.loadingTab} />
        ))}
      </div>
      <div className={styles.loadingRows}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={styles.loadingRow} />
        ))}
      </div>
    </div>
  );
}
