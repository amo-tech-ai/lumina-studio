// IPI-526 — empty-portfolio vs. no-match copy (correction #6). Derived from
// the single listPlannerInstances call's own inputs (hasActiveFilters) —
// never a second unfiltered query. Neither state renders a "New Plan" CTA
// (out of scope — no authoritative role/mutation contract exists yet).

import Link from "next/link";
import { CalendarRange, Search } from "lucide-react";

import { buildHubUrl } from "./hub-params";
import styles from "./hub-workspace.module.css";

export function HubEmptyState() {
  return (
    <div className={styles.emptyState} data-testid="hub-empty">
      <CalendarRange size={28} aria-hidden />
      <h2 className={styles.emptyTitle}>No plans yet</h2>
      <p className={styles.emptyCopy}>Plans you can access will appear here once one exists.</p>
    </div>
  );
}

export function HubNoMatchState() {
  return (
    <div className={styles.emptyState} data-testid="hub-no-match">
      <Search size={28} aria-hidden />
      <h2 className={styles.emptyTitle}>No plans match these filters</h2>
      <p className={styles.emptyCopy}>Try a different search or clear your filters.</p>
      <Link href={buildHubUrl({})} className={styles.clearLink}>
        Clear filters
      </Link>
    </div>
  );
}
