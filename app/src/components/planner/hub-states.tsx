// IPI-526 — empty-portfolio vs. no-match copy (correction #6). Derived from
// the single listPlannerInstances call's own inputs (hasActiveFilters) —
// never a second unfiltered query.
//
// IPI-650 — HubEmptyState now renders the "New plan" CTA (SCR-35's empty
// state shows the same button as its header, both wired to one flow) — the
// authoritative mutation contract and permission source IPI-526 was waiting
// on now exist (planner_create_instance RPC, IPI-653). HubNoMatchState still
// doesn't get one: it's about clearing filters on an otherwise non-empty
// portfolio, not "nothing exists yet".

import Link from "next/link";
import { CalendarRange, Search } from "lucide-react";

import type { EligibleEntity, WorkflowTemplate } from "@/lib/planner/queries";

import { buildHubUrl } from "./hub-params";
import styles from "./hub-workspace.module.css";
import { NewPlanDialog } from "./new-plan-dialog";

type EmptyStateProps = {
  orgId: string | null;
  eligibleEntities: EligibleEntity[];
  workflowTemplates: WorkflowTemplate[];
};

export function HubEmptyState({ orgId, eligibleEntities, workflowTemplates }: EmptyStateProps) {
  return (
    <div className={styles.emptyState} data-testid="hub-empty">
      <CalendarRange size={28} aria-hidden />
      <h2 className={styles.emptyTitle}>No plans yet</h2>
      <p className={styles.emptyCopy}>Plans you can access will appear here once one exists.</p>
      <NewPlanDialog
        variant="empty"
        orgId={orgId}
        eligibleEntities={eligibleEntities}
        workflowTemplates={workflowTemplates}
      />
    </div>
  );
}

export function HubNoMatchState() {
  return (
    <div className={styles.emptyState} data-testid="hub-no-match">
      <Search size={28} aria-hidden />
      <h2 className={styles.emptyTitle}>No plans match these filters</h2>
      <p className={styles.emptyCopy}>Try a different search or clear your filters.</p>
      <Link href={buildHubUrl({})} className={styles.clearLink}>
        Clear filters
      </Link>
    </div>
  );
}
