"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";

import { ShootCard, type ShootRow } from "@/components/shoot/ShootCard";
import {
  SHOOT_LIST_FILTERS,
  SHOOT_LIST_FILTER_LABELS,
  matchesShootListFilter,
  shootListCountLabel,
  type ShootListFilter,
} from "@/lib/shoot-list-filters";

import styles from "./shoots-list.module.css";

type Props = {
  shoots: ShootRow[];
  isAuthenticated: boolean;
  fetchError?: string | null;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function WorkspaceFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.workspace} data-testid="shoots-list-workspace">
      <div className={styles.workspaceInner}>{children}</div>
    </div>
  );
}

export function ShootsListWorkspace({ shoots, isAuthenticated, fetchError }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShootListFilter>("all");

  const filteredShoots = useMemo(() => {
    const q = normalizeSearch(query);
    return shoots.filter((shoot) => {
      if (!matchesShootListFilter(filter, shoot.status)) return false;
      if (!q) return true;
      return `${shoot.name} ${shoot.type}`.toLowerCase().includes(q);
    });
  }, [shoots, filter, query]);

  if (!isAuthenticated) {
    return (
      <WorkspaceFrame>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Shoots</h1>
              <p className={styles.subtitle}>Sign in to view and manage your shoots.</p>
            </div>
            <Link href="/login?redirect=/app/shoots" className={styles.primaryBtn}>
              Sign in
            </Link>
          </header>
        </div>
      </WorkspaceFrame>
    );
  }

  const header = (
    <div className={styles.workspaceHeader}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shoots</h1>
          <p className={styles.subtitle}>{shootListCountLabel(shoots)}</p>
        </div>
        <Link href="/app/shoots/new" className={styles.primaryBtn}>
          <Plus size={16} aria-hidden />
          New shoot
        </Link>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden className={styles.searchInput} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shoots…"
            className={styles.searchInput}
            aria-label="Search shoots"
          />
        </div>
      </div>

      <div className={styles.filterRow} role="group" aria-label="Filter shoots">
        {SHOOT_LIST_FILTERS.map((chip) => {
          const active = filter === chip;
          return (
            <button
              key={chip}
              type="button"
              className={active ? styles.filterChipActive : styles.filterChip}
              aria-pressed={active}
              onClick={() => setFilter(chip)}
            >
              {SHOOT_LIST_FILTER_LABELS[chip]}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (fetchError) {
    return (
      <WorkspaceFrame>
        {header}
        <div className={styles.workspaceBody}>
          <div className={styles.errorState} data-testid="shoots-list-error">
            <h2 className={styles.emptyTitle}>Couldn&apos;t load shoots</h2>
            <p className={styles.errorCopy}>{fetchError}</p>
            <Link href="/app/shoots" className={styles.retryBtn}>
              Retry
            </Link>
          </div>
        </div>
      </WorkspaceFrame>
    );
  }

  if (shoots.length === 0) {
    return (
      <WorkspaceFrame>
        {header}
        <div className={styles.workspaceBody}>
          <div className={styles.emptyState} data-testid="shoots-list-empty">
            <h2 className={styles.emptyTitle}>No shoots yet</h2>
            <p className={styles.emptyCopy}>
              Create your first shoot and start planning production.
            </p>
            <Link href="/app/shoots/new" className={styles.primaryBtn}>
              <Plus size={16} aria-hidden />
              New shoot
            </Link>
          </div>
        </div>
      </WorkspaceFrame>
    );
  }

  const showNoMatch = filteredShoots.length === 0;

  return (
    <WorkspaceFrame>
      {header}
      <div className={styles.workspaceBody}>
        {showNoMatch ? (
          <div className={styles.noMatchState} data-testid="shoots-list-no-match">
            <Search size={30} aria-hidden />
            <h2 className={styles.noMatchTitle}>
              {query.trim() ? `No matches for "${query.trim()}"` : "No matches for this filter"}
            </h2>
            <p className={styles.noMatchCopy}>Try a different shoot name or status.</p>
          </div>
        ) : (
          <div className={styles.grid} data-testid="shoots-list-grid">
            {filteredShoots.map((shoot) => (
              <ShootCard key={shoot.id} shoot={shoot} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}

export function ShootsListSkeleton() {
  return (
    <div className={styles.workspace} aria-busy="true" aria-label="Loading shoots">
      <div className={styles.workspaceInner}>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <div className={styles.skeletonLine} style={{ width: "8rem" }} />
              <div className={styles.skeletonLineSm} />
            </div>
          </header>
        </div>
        <div className={styles.workspaceBody}>
          <div className={styles.skeletonGrid}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineSm} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
