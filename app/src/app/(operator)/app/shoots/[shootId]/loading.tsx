import { Skeleton } from "@/components/ui/skeleton";

import styles from "@/components/shoot/shoot-detail.module.css";

/** Matches Shoot Detail.v2.image-first.dc.html `wsLoading` shape:
 *  label → 24:9 hero → title → 3 pills → 3-col stat grid. */
const ShootDetailLoading = () => (
  <div className={styles.loadingRoot}>
    <div className={styles.loadingInner}>
      <Skeleton className={styles.loadingLabel} />
      <Skeleton className={styles.loadingHero} />
      <Skeleton className={styles.loadingTitle} />
      <div className={styles.loadingPillRow}>
        <Skeleton className={styles.loadingPill} />
        <Skeleton className={styles.loadingPill} />
        <Skeleton className={styles.loadingPill} />
      </div>
      <div className={styles.loadingStatGrid}>
        <Skeleton className={styles.loadingStat} />
        <Skeleton className={styles.loadingStat} />
        <Skeleton className={styles.loadingStat} />
      </div>
    </div>
  </div>
);

export default ShootDetailLoading;
