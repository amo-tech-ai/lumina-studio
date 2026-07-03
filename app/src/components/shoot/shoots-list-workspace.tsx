"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Search, SlidersHorizontal, WifiOff } from "lucide-react";

import {
  SHOOT_LIST_FILTER_LABELS,
  SHOOT_LIST_FILTERS,
  matchesShootListFilter,
  shootListCountLabel,
  type ShootListFilter,
} from "@/lib/shoot/shoot-list-filters";
import { ShootCard, type ShootListItem } from "@/components/shoot/ShootCard";
import { useShootsListIntelDetail } from "@/components/shoot/shoots-list-intel-detail";
import { usePublishShootsListUi } from "@/context/shoots-list-ui-context";

import styles from "./shoots-list.module.css";

type SortKey = "date" | "brand";

type Props = {
  shoots: ShootListItem[];
  isAuthenticated: boolean;
  fetchError?: string | null;
  primaryBrandName?: string | null;
  onRetry?: () => void;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function WorkspaceFrame({
  children,
  testId = "shoots-list-workspace",
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className={styles.workspace} data-testid={testId}>
      <div className={styles.workspaceInner}>{children}</div>
    </div>
  );
}

export function ShootsListWorkspace({
  shoots,
  isAuthenticated,
  fetchError,
  onRetry,
}: Props) {
  const handleRetry = onRetry ?? (() => window.location.reload());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShootListFilter>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredShoots = useMemo(() => {
    const q = normalizeSearch(query);
    let list = shoots.filter((shoot) => matchesShootListFilter(filter, shoot.status));

    if (q) {
      list = list.filter((shoot) => {
        const haystack = `${shoot.name} ${shoot.brandName ?? ""} ${shoot.status}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    list = [...list];
    if (sort === "brand") {
      list.sort((a, b) => (a.brandName ?? "").localeCompare(b.brandName ?? ""));
    } else {
      list.sort((a, b) => {
        const aDate = a.start_date ?? a.updated_at;
        const bDate = b.start_date ?? b.updated_at;
        return bDate.localeCompare(aDate);
      });
    }

    return list;
  }, [shoots, filter, query, sort]);

  const selectedShoot = useMemo(
    () => shoots.find((shoot) => shoot.id === selectedId) ?? null,
    [shoots, selectedId],
  );

  useEffect(() => {
    if (selectedId && !shoots.some((shoot) => shoot.id === selectedId)) {
      setSelectedId(null);
    }
  }, [shoots, selectedId]);

  useShootsListIntelDetail(isAuthenticated && !fetchError ? selectedShoot : null);

  const inProductionCount = useMemo(
    () => shoots.filter((shoot) => shoot.status === "active").length,
    [shoots],
  );

  const shootsListUi = useMemo(() => {
    if (!isAuthenticated || fetchError) return null;
    return {
      total: shoots.length,
      inProduction: inProductionCount,
      selected: selectedShoot
        ? {
            id: selectedShoot.id,
            name: selectedShoot.name,
            brandName: selectedShoot.brandName ?? null,
          }
        : null,
    };
  }, [
    isAuthenticated,
    fetchError,
    shoots.length,
    inProductionCount,
    selectedShoot?.id,
    selectedShoot?.name,
    selectedShoot?.brandName,
  ]);

  usePublishShootsListUi(shootsListUi);

  if (!isAuthenticated) {
    return (
      <WorkspaceFrame>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Shoots</h1>
              <p className={styles.unauthCopy}>Sign in to view and manage your shoots.</p>
            </div>
            <Link href="/login?redirect=/app/shoots" className={styles.primaryBtn}>
              Sign in
            </Link>
          </header>
        </div>
      </WorkspaceFrame>
    );
  }

  const countLabel = shootListCountLabel(shoots);
  const showNoMatch = !fetchError && filteredShoots.length === 0 && shoots.length > 0;
  const trimmedQuery = query.trim();

  return (
    <WorkspaceFrame>
      <div className={styles.workspaceHeader}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Shoots</h1>
            <p className={styles.subtitle}>{countLabel}</p>
          </div>
          <Link href="/app/shoots/new" className={styles.primaryBtn}>
            <Plus size={16} aria-hidden />
            New shoot
          </Link>
        </header>

        {!fetchError ? (
          <>
            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <Search size={16} aria-hidden className="text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shoots…"
                  className={styles.searchInput}
                  aria-label="Search shoots"
                />
              </div>
              <button
                type="button"
                className={styles.sortBtn}
                aria-pressed={sort === "brand"}
                onClick={() => setSort((prev) => (prev === "date" ? "brand" : "date"))}
              >
                <SlidersHorizontal size={15} aria-hidden />
                Brand · Date
              </button>
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
          </>
        ) : null}
      </div>

      <div className={styles.workspaceBody}>
        {fetchError ? (
          <div className={styles.errorState} data-testid="shoots-list-error">
            <WifiOff size={28} aria-hidden className="text-[var(--color-text-muted)]" />
            <p className={styles.errorTitle}>Couldn&apos;t load shoots</p>
            <p className={styles.errorCopy}>Check your connection and try again.</p>
            <button type="button" className={styles.retryBtn} onClick={handleRetry}>
              Try again
            </button>
          </div>
        ) : showNoMatch ? (
          <div className={styles.noMatchState} data-testid="shoots-list-no-match">
            <Search size={30} aria-hidden className={styles.noMatchIcon} />
            <h2 className={styles.noMatchTitle}>
              {trimmedQuery
                ? `No matches for “${trimmedQuery}”`
                : "No matches for this filter"}
            </h2>
            <p className={styles.noMatchCopy}>Try a different name, brand, or status.</p>
          </div>
        ) : (
          <div className={styles.grid} data-testid="shoots-list-grid">
            {filteredShoots.map((shoot) => (
              <ShootCard
                key={shoot.id}
                shoot={shoot}
                selected={selectedId === shoot.id}
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
    <div
      className={styles.workspace}
      aria-busy="true"
      aria-label="Loading shoots"
      data-testid="shoots-list-loading"
    >
      <div className={styles.workspaceInner}>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineSm} style={{ marginTop: "0.5rem" }} />
            </div>
          </header>
        </div>
        <div className={styles.workspaceBody}>
          <div className={styles.skeletonGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
