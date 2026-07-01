import styles from "./command-center.module.css";

export function CommandCenterSkeleton() {
  return (
    <div className={styles.skeletonLayout} aria-busy="true" aria-label="Loading Command Center">
      <div className={`${styles.skeletonBlock} ${styles.skeletonStrip}`} />
      <div className={styles.skeletonHeroRow}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonHeroThumb}`} />
        <div className={styles.skeletonHeroCopy}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonLineShort}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonLineLong}`} />
        </div>
      </div>
      <div className={`${styles.skeletonBlock} ${styles.skeletonRow}`} />
    </div>
  );
}
