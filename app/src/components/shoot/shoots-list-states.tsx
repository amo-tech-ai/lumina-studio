import Link from "next/link";
import { Plus, Search, WifiOff } from "lucide-react";

import { shootsListEmptyPreviewUrls } from "@/lib/command-center/sample-images";

import styles from "./shoots-list.module.css";

export function ShootsListErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState} data-testid="shoots-list-error">
      <WifiOff size={28} strokeWidth={1.7} aria-hidden />
      <p className={styles.errorTitle}>Couldn&apos;t load shoots</p>
      <p className={styles.errorCopy}>{message}</p>
      <Link href="/app/shoots" className={styles.retryBtn}>
        Try again
      </Link>
    </div>
  );
}

export function ShootsListEmptyState() {
  const [photoA, photoB] = shootsListEmptyPreviewUrls();
  return (
    <div className={styles.emptyState} data-testid="shoots-list-empty">
      <div className={styles.emptyArt} aria-hidden>
        <div
          className={styles.emptyPhoto}
          style={{ backgroundImage: `url(${photoA})`, transform: "rotate(-4deg)" }}
        />
        <div
          className={styles.emptyPhoto}
          style={{ backgroundImage: `url(${photoB})`, transform: "rotate(4deg)" }}
        />
      </div>
      <h2 className={styles.emptyTitle}>No shoots yet</h2>
      <p className={styles.emptyCopy}>
        Plan your first shoot and I&apos;ll build the shot list, deliverables, and schedule from
        your brand DNA.
      </p>
      <Link href="/app/shoots/new" className={styles.emptyCta}>
        <Plus size={16} aria-hidden />
        Plan shoot
      </Link>
      <p className={styles.emptyHint}>
        Production Planner can turn a brief into a shot list, deliverables, and schedule.
      </p>
    </div>
  );
}

export function ShootsListNoMatchState({ query }: { query: string }) {
  return (
    <div className={styles.noMatchState} data-testid="shoots-list-no-match">
      <Search size={30} aria-hidden />
      <h2 className={styles.noMatchTitle}>
        {query.trim() ? `No matches for "${query.trim()}"` : "No matches for this filter"}
      </h2>
      <p className={styles.noMatchCopy}>Try a different shoot name or status.</p>
    </div>
  );
}
