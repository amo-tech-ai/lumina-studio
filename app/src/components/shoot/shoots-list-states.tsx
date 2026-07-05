import Link from "next/link";
import { Plus, Search } from "lucide-react";

import styles from "./shoots-list.module.css";

export function ShootsListErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState} data-testid="shoots-list-error">
      <h2 className={styles.emptyTitle}>Couldn&apos;t load shoots</h2>
      <p className={styles.errorCopy}>{message}</p>
      <Link href="/app/shoots" className={styles.retryBtn}>
        Retry
      </Link>
    </div>
  );
}

export function ShootsListEmptyState() {
  return (
    <div className={styles.emptyState} data-testid="shoots-list-empty">
      <h2 className={styles.emptyTitle}>No shoots yet</h2>
      <p className={styles.emptyCopy}>Create your first shoot and start planning production.</p>
      <Link href="/app/shoots/new" className={styles.primaryBtn}>
        <Plus size={16} aria-hidden />
        New shoot
      </Link>
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
