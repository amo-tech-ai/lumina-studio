// IPI-526 — Planner Hub filter bar. Pure server-rendered markup: type chips
// are plain links, search/status/archived submit through one native GET
// form. No client JS required (correction #5's "explicit Search submit
// button", not auto-search on keystroke).

import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

import { getInstanceUiTreatment } from "@/lib/planner/status-transitions";
import type { EntityType } from "@/lib/planner/types";

import { buildHubUrl, PLANNER_INSTANCE_STATUSES, type HubFilters } from "./hub-params";
import styles from "./hub-workspace.module.css";

const TYPE_CHIPS: { value?: EntityType; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "shoot", label: "Shoot" },
  { value: "campaign", label: "Campaign" },
  { value: "crm_deal", label: "CRM Deal" },
];

type Props = { filters: HubFilters };

export function HubFilterBar({ filters }: Props) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.typeChips} role="group" aria-label="Plan type">
        {TYPE_CHIPS.map((chip) => {
          const active = filters.entityType === chip.value;
          return (
            <Link
              key={chip.label}
              href={buildHubUrl({ ...filters, entityType: chip.value, cursor: undefined })}
              className={active ? styles.chipActive : styles.chip}
              aria-current={active ? "true" : undefined}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <form method="get" action="/app/planner" className={styles.searchForm}>
        {/* Type/limit aren't part of this form's own fields — carry them
            through unchanged, otherwise submitting search silently resets
            a non-default `?limit=` back to the default. */}
        <input type="hidden" name="entityType" value={filters.entityType ?? ""} />
        <input type="hidden" name="limit" value={filters.limit} />
        <fieldset className={styles.fieldset}>
          <legend className="sr-only">Search and filter plans</legend>

          <label htmlFor="hub-search" className="sr-only">
            Search plans
          </label>
          <div className={styles.searchWrap}>
            <SearchIcon size={14} aria-hidden />
            <input
              id="hub-search"
              type="search"
              name="search"
              defaultValue={filters.search}
              maxLength={200}
              placeholder="Search plans"
              className={styles.searchInput}
            />
          </div>

          <label htmlFor="hub-status" className="sr-only">
            Status
          </label>
          <select
            id="hub-status"
            name="status"
            defaultValue={filters.status ?? ""}
            className={styles.statusSelect}
          >
            <option value="">All statuses</option>
            {PLANNER_INSTANCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getInstanceUiTreatment(status).label}
              </option>
            ))}
          </select>

          <label className={styles.archivedLabel}>
            <input type="checkbox" name="includeArchived" value="true" defaultChecked={filters.includeArchived} />
            Include archived
          </label>

          <button type="submit" className={styles.searchBtn}>
            Search
          </button>
        </fieldset>
      </form>

      {filters.search ? (
        <Link href={buildHubUrl({ ...filters, search: undefined, cursor: undefined })} className={styles.clearLink}>
          Clear search
        </Link>
      ) : null}
    </div>
  );
}
