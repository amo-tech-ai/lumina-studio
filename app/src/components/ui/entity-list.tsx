"use client";

import type { ReactNode } from "react";
import { Inbox, Search } from "lucide-react";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { Skeleton } from "./skeleton";
import styles from "./entity-list.module.css";

/** Config-driven list template (RF-02). Composes the shared atoms — Skeleton
 *  (loading), EmptyState (no data / no match), ErrorState (retry) — around a
 *  caller-rendered row. Domain-free: no filtering, sorting, or entity knowledge
 *  lives here; the consumer passes already-resolved `items` + `renderRow`.
 *  First consumer is CRM Companies/Contacts — do not add Brand/Shoots options. */
type Props<T> = {
  items: T[];
  renderRow: (item: T) => ReactNode;
  /** EmptyState heading when there is genuinely no data. */
  emptyLabel: string;
  emptyBody?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Render the search row when set. Controlled by the caller (it owns filtering). */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

const SKELETON_ROWS = 5;

export function EntityList<T extends { id: string }>({
  items,
  renderRow,
  emptyLabel,
  emptyBody,
  loading = false,
  error = null,
  onRetry,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: Props<T>) {
  // A real failure replaces the whole surface (search included).
  if (error) {
    return (
      <div className={styles.root} data-testid="entity-list">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  const searching = (searchValue ?? "").trim().length > 0;

  let body: ReactNode;
  if (loading) {
    body = (
      <div className={styles.list} aria-hidden data-testid="entity-list-loading">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <Skeleton key={i} className={styles.skeletonRow} />
        ))}
      </div>
    );
  } else if (items.length === 0) {
    body = searching ? (
      <EmptyState heading={`No matches for “${searchValue!.trim()}”`} icon={<Search />} />
    ) : (
      <EmptyState heading={emptyLabel} body={emptyBody} icon={<Inbox />} />
    );
  } else {
    body = (
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>{renderRow(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className={styles.root} data-testid="entity-list">
      {searchPlaceholder !== undefined ? (
        <div className={styles.search}>
          <Search size={16} strokeWidth={1.9} aria-hidden className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
      ) : null}
      {body}
    </div>
  );
}
