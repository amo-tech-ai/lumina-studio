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
type BaseProps<T> = {
  items: T[];
  renderRow: (item: T) => ReactNode;
  /** EmptyState heading when there is genuinely no data. */
  emptyLabel: string;
  emptyBody?: string;
  /** Heading when a search yields no results. Default: `No matches for "<query>"`. */
  noMatchLabel?: (query: string) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

/** The search row is controlled by the caller (it owns filtering) — all three
 *  props are required together so it's impossible to render a search box that
 *  silently does nothing because a caller forgot `onSearchChange`. */
type SearchProps =
  | { searchPlaceholder?: undefined; searchValue?: undefined; onSearchChange?: undefined }
  | { searchPlaceholder: string; searchValue: string; onSearchChange: (value: string) => void };

export type Props<T> = BaseProps<T> & SearchProps;

const SKELETON_ROWS = 5;

const defaultNoMatchLabel = (query: string) => `No matches for “${query}”`;

export function EntityList<T extends { id: string }>({
  items,
  renderRow,
  emptyLabel,
  emptyBody,
  noMatchLabel = defaultNoMatchLabel,
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

  const trimmedSearch = (searchValue ?? "").trim();
  const searching = trimmedSearch.length > 0;

  let body: ReactNode;
  if (loading) {
    // The status span is a SIBLING of the aria-hidden skeleton container, not
    // nested inside it — aria-hidden suppresses the whole subtree regardless of
    // a descendant's own role, so nesting it there would silence the announcement.
    body = (
      <>
        <span className="sr-only" role="status">
          Loading…
        </span>
        <div className={styles.list} aria-hidden data-testid="entity-list-loading">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <Skeleton key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </>
    );
  } else if (items.length === 0) {
    body = searching ? (
      <EmptyState heading={noMatchLabel(trimmedSearch)} icon={<Search />} />
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
