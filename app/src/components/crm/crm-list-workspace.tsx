"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { EntityList } from "@/components/ui/entity-list";
import styles from "./crm-list-workspace.module.css";

/** Empty-state "add" CTA shared by CompaniesWorkspace + ContactsWorkspace — both
 *  were byte-identical apart from the label (CodeRabbit nitpick on PR #270). */
export function ComingSoonButton({ label }: { label: string }) {
  return (
    <button type="button" disabled title="Coming soon" className={styles.newBtn}>
      <Plus size={15} aria-hidden />
      {label}
    </button>
  );
}

/** Shared chrome for CompaniesWorkspace + ContactsWorkspace (RF-03) — header,
 *  filter row, search state, and the EntityList wrapper are identical across
 *  both screens; only row rendering and the search predicate differ. */
export function CrmListWorkspace<T extends { id: string }>({
  title,
  countLabel,
  newLabel,
  filterLabels,
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
  newLabel: string;
  filterLabels: string[];
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
            <p className={styles.count}>{countLabel(items.length)}</p>
          </div>
          <ComingSoonButton label={newLabel} />
        </div>
        <div className={styles.filterRow}>
          {filterLabels.map((label) => (
            <button key={label} type="button" disabled title="Coming soon" className={styles.filterBtn}>
              {label}
            </button>
          ))}
        </div>
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
