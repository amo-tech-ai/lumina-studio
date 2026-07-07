import { Skeleton } from "@/components/ui/skeleton";
import styles from "./crm-list-loading.module.css";

/** Route-level loading.tsx skeleton for both CRM list screens — shown while
 *  the RSC org/list fetch is in flight (CLAUDE.md UX principle: never a blank
 *  spinner). Row height/gap mirror EntityList's own internal skeleton. */
export function CrmListLoading() {
  return (
    <div className={styles.root}>
      <Skeleton className={styles.title} />
      <Skeleton className={styles.count} />
      <Skeleton className={styles.search} />
      <div className={styles.rows}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className={styles.row} />
        ))}
      </div>
    </div>
  );
}
