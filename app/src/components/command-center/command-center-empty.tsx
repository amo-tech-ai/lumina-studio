import Link from "next/link";

import styles from "./command-center.module.css";

export function CommandCenterEmpty() {
  return (
    <div className={styles.emptyCard}>
      <div className={styles.emptyHeroPlaceholder} aria-hidden />
      <h2 className={styles.emptyTitle}>Welcome to iPix</h2>
      <p className={styles.emptyCopy}>
        Add your first brand and we&apos;ll crawl your site to build Brand DNA — palette,
        voice, and imagery — in minutes. You review before anything goes live.
      </p>
      <Link href="/app/onboarding" className={styles.emptyCta}>
        Set up brand
      </Link>
      <p className={styles.emptyHint}>
        Production Planner can import from your site, Shopify, or a moodboard.
      </p>
    </div>
  );
}
