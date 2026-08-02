"use client";

// IPI-580 · PLN-S1C — read-only List (SCR-32-Planner-Workspace.dc.html).
// Same normalized task rows as Kanban. Row click selects the task's phase
// (or the task itself when Unassigned). No Actions / mutation menu.

import type { PlannerTaskView, TaskStatusTone } from "@/lib/planner/planner-view-model";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./planner-list.module.css";

const CHIP_TONE: Record<TaskStatusTone, string> = {
  todo: styles.chipTodo,
  in_progress: styles.chipInProgress,
  blocked: styles.chipBlocked,
  done: styles.chipDone,
  cancelled: styles.chipCancelled,
  neutral: styles.chipNeutral,
};

export function PlannerList({ rows }: { rows: PlannerTaskView[] }) {
  const { selection, setSelection } = usePlannerSelection();

  if (rows.length === 0) {
    return (
      <div className={styles.empty} data-testid="planner-list-empty">
        No tasks yet — once the plan has tasks they will appear here.
      </div>
    );
  }

  const selectRow = (row: PlannerTaskView) => {
    if (row.phaseId) {
      setSelection({ type: "phase", id: row.phaseId });
      return;
    }
    setSelection({ type: "task", id: row.task.id });
  };

  const isSelected = (row: PlannerTaskView) => {
    if (!selection) return false;
    if (row.phaseId) {
      return selection.type === "phase" && selection.id === row.phaseId;
    }
    return selection.type === "task" && selection.id === row.task.id;
  };

  return (
    <div className={styles.wrap} data-testid="planner-list">
      <div className={styles.table} aria-label="Planner tasks">
        <div className={styles.header}>
          <span>Task</span>
          <span>Step</span>
          <span>Owner</span>
          <span>Dates</span>
          <span>Dur</span>
          <span>Priority</span>
          <span>Status</span>
        </div>
        {rows.map((row) => {
          const selected = isSelected(row);
          return (
            <button
              key={row.task.id}
              type="button"
              className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
              aria-label={`Select ${row.task.title}`}
              aria-pressed={selected}
              onClick={() => selectRow(row)}
              data-testid="planner-list-row"
            >
              <span className={styles.title}>{row.task.title}</span>
              <span className={styles.phase}>{row.phaseName}</span>
              <span>
                <span className={styles.avatar} aria-hidden="true">
                  {row.ownerLabel}
                </span>
              </span>
              <span className={styles.mono}>{row.datesLabel}</span>
              <span className={styles.mono}>{row.durationLabel}</span>
              <span className={styles.priority}>{row.priorityLabel}</span>
              <span>
                <span className={`${styles.chip} ${CHIP_TONE[row.status.tone]}`}>
                  <span className={styles.chipDot} aria-hidden="true" />
                  {row.status.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
