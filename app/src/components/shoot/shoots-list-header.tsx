"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";

import {
  SHOOT_LIST_FILTERS,
  SHOOT_LIST_FILTER_LABELS,
  type ShootListFilter,
} from "@/lib/shoot-list-filters";

import styles from "./shoots-list.module.css";

type Props = {
  countLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  filter: ShootListFilter;
  onFilterChange: (filter: ShootListFilter) => void;
  /** DC parity: search + filter chips only show in populated state (showControls in dc.html). */
  showControls: boolean;
};

export function ShootsListHeader({
  countLabel,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  showControls,
}: Props) {
  return (
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

      {showControls ? (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
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
                  onClick={() => onFilterChange(chip)}
                >
                  {SHOOT_LIST_FILTER_LABELS[chip]}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
