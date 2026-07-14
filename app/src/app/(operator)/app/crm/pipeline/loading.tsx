import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/components/crm/pipeline-workspace.module.css";

/** Route-level loading.tsx — shown while the pipeline's deals fetch is in
 *  flight. Shape mirrors the real board (title/total + 6 columns). */
export default function PipelineLoading() {
  return (
    <div className={styles.loadingRoot}>
      <Skeleton className={styles.loadingTitle} />
      <Skeleton className={styles.loadingTotal} />
      <div className={styles.loadingBoard}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className={styles.loadingColumn} />
        ))}
      </div>
    </div>
  );
}
