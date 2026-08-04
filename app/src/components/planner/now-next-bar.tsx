"use client";

// IPI-588 · PLN-S1G — Now & Next priority bar (SCR-32 lines ~120–142).
// Mounted once in PlannerWorkspaceShell; uses the shared getInstanceDetail
// task payload + pure selectCurrentTaskForViewer. No supabase.from here.
//
// IPI-483 — "Your next approval" uses listInstanceGates (reachable only).

import { CircleCheck, Clock } from "lucide-react";
import { useMemo } from "react";

import { formatPlanDateShort, parsePlanDate } from "@/lib/planner/planner-date-utils";
import { selectCurrentTaskForViewer } from "@/lib/planner/select-current-task";
import type { InstanceGate, PlannerTask } from "@/lib/planner/types";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./now-next-bar.module.css";

export type NowNextBarProps = {
  tasks: PlannerTask[];
  viewerId: string;
  /** phaseId → display name from listWorkflowPhases (already loaded by the page). */
  phaseNames: Record<string, string>;
  /** YYYY-MM-DD — same UTC-today string the Timeline model uses. */
  today: string;
  /** IPI-483 — from listInstanceGates; first reachable drives next-approval. */
  gates?: InstanceGate[];
};

function formatTaskSub(
  task: PlannerTask,
  phaseNames: Record<string, string>,
): string {
  const parts: string[] = ["In progress"];
  if (task.phaseId) {
    const phaseName = phaseNames[task.phaseId];
    if (phaseName) parts.push(phaseName);
  }

  const start = parsePlanDate(task.startDate);
  const end = parsePlanDate(task.endDate);
  if (start && end) {
    parts.push(`${formatPlanDateShort(start)} – ${formatPlanDateShort(end)}`);
  } else if (start) {
    parts.push(`from ${formatPlanDateShort(start)}`);
  } else if (end) {
    parts.push(`due ${formatPlanDateShort(end)}`);
  }

  return parts.join(" · ");
}

function firstReachableGate(gates: InstanceGate[] | undefined): InstanceGate | null {
  if (!gates?.length) return null;
  return gates.find((g) => g.status === "reachable") ?? null;
}

export function NowNextBar({ tasks, viewerId, phaseNames, today, gates }: NowNextBarProps) {
  const { setSelection } = usePlannerSelection();

  const current = useMemo(
    () => selectCurrentTaskForViewer(tasks, viewerId, today),
    [tasks, viewerId, today],
  );

  const nextGate = useMemo(() => firstReachableGate(gates), [gates]);

  return (
    <div className={styles.bar} data-testid="planner-now-next-bar">
      <div className={styles.card} data-testid="planner-now-card">
        <div className={styles.iconWrap} aria-hidden="true">
          <Clock style={{ width: 15, height: 15 }} />
        </div>
        <div className={styles.body}>
          <div className={styles.eyebrow}>Happening now</div>
          {current ? (
            <>
              <div className={styles.title}>{current.title}</div>
              <div className={styles.sub}>{formatTaskSub(current, phaseNames)}</div>
            </>
          ) : (
            <>
              <div className={styles.title}>Nothing assigned to you right now</div>
              <div className={styles.sub}>
                No in-progress task on this plan is assigned to you.
              </div>
            </>
          )}
        </div>
        {current ? (
          <button
            type="button"
            className={styles.viewButton}
            data-testid="planner-now-view"
            onClick={() => setSelection({ type: "task", id: current.id })}
          >
            View
          </button>
        ) : null}
      </div>

      <div
        className={nextGate ? `${styles.card} ${styles.cardApproval}` : styles.card}
        data-testid="planner-next-approval-card"
      >
        <div
          className={nextGate ? styles.iconWrapApproval : styles.iconWrapDone}
          aria-hidden="true"
        >
          <CircleCheck style={{ width: 15, height: 15 }} />
        </div>
        <div className={styles.body}>
          <div className={styles.eyebrow}>Your next approval</div>
          {nextGate ? (
            <>
              <div className={styles.title}>{nextGate.phaseName}</div>
              <div className={styles.subApproval}>
                Ready for approval
                {nextGate.requiredRole ? ` · Requires ${nextGate.requiredRole}` : ""}
              </div>
            </>
          ) : (
            <>
              <div className={styles.title}>No approvals waiting</div>
              <div className={styles.sub}>
                When a production gate is ready, it will show up here.
              </div>
            </>
          )}
        </div>
        {nextGate ? (
          <button
            type="button"
            className={styles.reviewButton}
            data-testid="planner-next-approval-review"
            onClick={() => setSelection({ type: "phase", id: nextGate.phaseId })}
          >
            Review
          </button>
        ) : null}
      </div>
    </div>
  );
}
