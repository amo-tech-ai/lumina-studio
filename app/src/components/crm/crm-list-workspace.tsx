"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { EntityList } from "@/components/ui/entity-list";
import styles from "./crm-list-workspace.module.css";

/** Shared chrome for CompaniesWorkspace + ContactsWorkspace (RF-03) — header,
 *  filter row, search state, and the EntityList wrapper are identical across
 *  both screens; only row rendering and the search predicate differ. */
export function CrmListWorkspace<T extends { id: string }>({
  title,
  countLabel,
  headerCount,
  newAction,
  filters,
  items,
  searchPlaceholder,
  filterItems,
  emptyLabel,
  emptyBody,
  emptyAction,
  fetchError,
  renderRow,
}: {
  title: string;
  countLabel: (count: number) => string;
  /** Unfiltered org total for the header count (chip filters shrink `items`). */
  headerCount?: number;
  newAction: ReactNode;
  filters: ReactNode;
  items: T[];
  searchPlaceholder: string;
  filterItems: (items: T[], term: string) => T[];
  emptyLabel: string;
  emptyBody: string;
  emptyAction?: ReactNode;
  fetchError: string | null;
  renderRow: (item: T) => ReactNode;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return filterItems(items, term);
  }, [items, search, filterItems]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.count}>{countLabel(headerCount ?? items.length)}</p>
          </div>
          {newAction}
        </div>
        <div className={styles.filterRow}>{filters}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.listCard}>
          <EntityList
            items={filtered}
            emptyLabel={emptyLabel}
            emptyBody={emptyBody}
            emptyAction={emptyAction}
            searchPlaceholder={searchPlaceholder}
            searchValue={search}
            onSearchChange={setSearch}
            error={fetchError}
            onRetry={() => router.refresh()}
            renderRow={renderRow}
          />
        </div>
      </div>
    </div>
  );
}

/** Client-side chip that cycles All → each option → All. Options come from
 *  already-loaded rows (IPI-562 Phase 2 — no new list API). */
export function CrmFilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (next: string | null) => void;
}) {
  const active = value !== null;
  const display = active ? (options.find((o) => o.value === value)?.label ?? value) : label;

  function cycle() {
    if (options.length === 0) return;
    if (value === null) {
      onChange(options[0].value);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    if (idx < 0 || idx >= options.length - 1) onChange(null);
    else onChange(options[idx + 1].value);
  }

  return (
    <button
      type="button"
      className={active ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
      aria-pressed={active}
      onClick={cycle}
      disabled={options.length === 0}
      title={options.length === 0 ? "No values to filter" : `Filter by ${label}`}
    >
      {display}
    </button>
  );
}
