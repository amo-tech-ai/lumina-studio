// IPI-526 — Planner Hub workspace. Pure presentation over an already-fetched
// page: page.tsx owns auth/query/error handling, this composes the filter
// bar, page-scoped attention band, card grid, states, and pagination.

import type { EligibleEntity, PlannerInstanceSummary, WorkflowTemplate } from "@/lib/planner/queries";

import { HubAttentionBand } from "./hub-attention-band";
import { HubCard } from "./hub-card";
import { HubFilterBar } from "./hub-filters";
import { hasActiveFilters, type HubFilters } from "./hub-params";
import { HubPagination } from "./hub-pagination";
import { HubEmptyState, HubNoMatchState } from "./hub-states";
import styles from "./hub-workspace.module.css";
import { NewPlanDialog } from "./new-plan-dialog";

type Props = {
  filters: HubFilters;
  items: PlannerInstanceSummary[];
  nextCursor: string | null;
  // IPI-650 — orgId is null when the caller has no organization yet
  // (getCurrentOrgId returned null in page.tsx); the CTA still renders (never
  // pre-filtered client-side — the RPC is the authorization gate), the dialog
  // just explains there's nothing to attach a plan to yet.
  orgId: string | null;
  eligibleEntities: EligibleEntity[];
  workflowTemplates: WorkflowTemplate[];
};

export function PlannerHubWorkspace({
  filters,
  items,
  nextCursor,
  orgId,
  eligibleEntities,
  workflowTemplates,
}: Props) {
  // A cursor means this page isn't the portfolio's true first page — an empty
  // result here (e.g. a since-deleted last item, or a stale/expired cursor)
  // is "nothing more past this point", not "you have no plans" or "no
  // filters match" (correction #6 only distinguishes those two for page 1).
  const isPastFirstPage = Boolean(filters.cursor);
  const filtersActive = hasActiveFilters(filters);
  const atRiskItems = items.filter((item) => item.atRisk);
  const countLabel = `Showing ${items.length} ${items.length === 1 ? "plan" : "plans"} on this page`;

  return (
    <div className={styles.workspace} data-testid="planner-hub-workspace">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Planner</h1>
          <p role="status" aria-live="polite" aria-atomic="true" className={styles.liveRegion}>
            {countLabel}
          </p>
        </div>
        <NewPlanDialog
          variant="header"
          orgId={orgId}
          eligibleEntities={eligibleEntities}
          workflowTemplates={workflowTemplates}
        />
      </header>

      <HubFilterBar filters={filters} />

      {items.length === 0 ? (
        <>
          {filtersActive ? (
            <HubNoMatchState />
          ) : isPastFirstPage ? null : (
            // Past the first page with no filters active, an empty result is
            // "nothing more past this point" — HubPagination's own "Start
            // over" link below is the correct affordance, not a misleading
            // "no plans match these filters" message with nothing to clear.
            <HubEmptyState orgId={orgId} eligibleEntities={eligibleEntities} workflowTemplates={workflowTemplates} />
          )}
          {isPastFirstPage ? <HubPagination filters={filters} nextCursor={null} /> : null}
        </>
      ) : (
        <>
          <HubAttentionBand atRiskItems={atRiskItems} />
          <div className={styles.grid} data-testid="hub-grid">
            {items.map((item) => (
              <HubCard key={item.id} item={item} />
            ))}
          </div>
          <HubPagination filters={filters} nextCursor={nextCursor} />
        </>
      )}
    </div>
  );
}
