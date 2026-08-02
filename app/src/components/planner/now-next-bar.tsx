"use client";

// IPI-588 · PLN-S1G — Now & Next priority bar (SCR-32 lines ~120–142).
// Mounted once in PlannerWorkspaceShell; uses the shared getInstanceDetail
// task payload + pure selectCurrentTaskForViewer. No supabase.from here.
//
// "Your next approval" stays honestly empty until IPI-483 — no fabricated
// gates. View opens AdaptivePanel via ?selection=task:<uuid>.

import { CircleCheck, Clock } from "lucide-react";
import { useMemo } from "react";

import { formatPlanDateShort, parsePlanDate } from "@/lib/planner/planner-date-utils";
import { selectCurrentTaskForViewer } from "@/lib/planner/select-current-task";
import type { PlannerTask } from "@/lib/planner/types";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./now-next-bar.module.css";

export type NowNextBarProps = {
  tasks: PlannerTask[];
  viewerId: string;
  /** phaseId → display name from listWorkflowPhases (already loaded by the page). */
  phaseNames: Record<string, string>;
  /** YYYY-MM-DD — same UTC-today string the Timeline model uses. */
  today: string;
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

export function NowNextBar({ tasks, viewerId, phaseNames, today }: NowNextBarProps) {
  const { setSelection } = usePlannerSelection();

  const current = useMemo(
    () => selectCurrentTaskForViewer(tasks, viewerId, today),
    [tasks, viewerId, today],
  );

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

      {/* Phase 1: honest empty until IPI-483 — never invent an approval. */}
      <div className={styles.card} data-testid="planner-next-approval-card">
        <div className={styles.iconWrapDone} aria-hidden="true">
          <CircleCheck style={{ width: 15, height: 15 }} />
        </div>
        <div className={styles.body}>
          <div className={styles.eyebrow}>Your next approval</div>
          <div className={styles.title}>Approvals unavailable</div>
          <div className={styles.sub}>
            Approval gates are not wired yet — they ship with the workflow engine
            (IPI-483).
          </div>
        </div>
      </div>
    </div>
  );
}
