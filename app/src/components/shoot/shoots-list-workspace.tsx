"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { ShootCard, type ShootRow } from "@/components/shoot/ShootCard";
import { ShootsListHeader } from "@/components/shoot/shoots-list-header";
import { useShootsListIntelDetail } from "@/components/shoot/shoots-list-intel-detail";
import {
  ShootsListEmptyState,
  ShootsListErrorState,
  ShootsListNoMatchState,
} from "@/components/shoot/shoots-list-states";
import {
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredShoots = useMemo(() => {
    const q = normalizeSearch(query);
    return shoots.filter((shoot) => {
      if (!matchesShootListFilter(filter, shoot.status)) return false;
      if (!q) return true;
      return `${shoot.name} ${shoot.type}`.toLowerCase().includes(q);
    });
  }, [shoots, filter, query]);

  // Selected row must survive filtering; drops to prompt when filtered out.
  const selected = useMemo(
    () => filteredShoots.find((s) => s.id === selectedId) ?? null,
    [filteredShoots, selectedId],
  );

  // Preview only publishes in the populated state; empty/error/unauth keep the panel default.
  const populated = isAuthenticated && !fetchError && shoots.length > 0;
  useShootsListIntelDetail(selected, populated);

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
    <ShootsListHeader
      countLabel={shootListCountLabel(shoots)}
      query={query}
      onQueryChange={setQuery}
      filter={filter}
      onFilterChange={setFilter}
      showControls={!fetchError && shoots.length > 0}
    />
  );

  if (fetchError) {
    return (
      <WorkspaceFrame>
        {header}
        <div className={styles.workspaceBody}>
          <ShootsListErrorState message={fetchError} />
        </div>
      </WorkspaceFrame>
    );
  }

  if (shoots.length === 0) {
    return (
      <WorkspaceFrame>
        {header}
        <div className={styles.workspaceBody}>
          <ShootsListEmptyState />
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
          <ShootsListNoMatchState query={query} />
        ) : (
          <div className={styles.grid} data-testid="shoots-list-grid">
            {filteredShoots.map((shoot) => (
              <ShootCard
                key={shoot.id}
                shoot={shoot}
                selected={shoot.id === selectedId}
                onSelect={setSelectedId}
              />
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
