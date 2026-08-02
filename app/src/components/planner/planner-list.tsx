"use client";

// IPI-580 · PLN-S1C — read-only List (SCR-32-Planner-Workspace.dc.html).
// Same normalized task rows as Kanban. Row click selects the task's phase
// (or the task itself when Unassigned). No Actions / mutation menu.

import type { KeyboardEvent } from "react";

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

function activateRowKey(event: KeyboardEvent, activate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activate();
  }
}

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
      <div className={styles.table} role="table" aria-label="Planner tasks">
        <div className={styles.header} role="row">
          <span role="columnheader">Task</span>
          <span role="columnheader">Step</span>
          <span role="columnheader">Owner</span>
          <span role="columnheader">Dates</span>
          <span role="columnheader">Dur</span>
          <span role="columnheader">Priority</span>
          <span role="columnheader">Status</span>
        </div>
        {rows.map((row) => {
          const selected = isSelected(row);
          const activate = () => selectRow(row);
          return (
            <div
              key={row.task.id}
              role="row"
              tabIndex={0}
              className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
              aria-selected={selected}
              onClick={activate}
              onKeyDown={(event) => activateRowKey(event, activate)}
              data-testid="planner-list-row"
            >
              <span role="cell" className={styles.title}>
                {row.task.title}
              </span>
              <span role="cell" className={styles.phase}>
                {row.phaseName}
              </span>
              <span role="cell">
                <span className={styles.avatar}>{row.ownerLabel}</span>
              </span>
              <span role="cell" className={styles.mono}>
                {row.datesLabel}
              </span>
              <span role="cell" className={styles.mono}>
                {row.durationLabel}
              </span>
              <span role="cell" className={styles.priority}>
                {row.priorityLabel}
              </span>
              <span role="cell">
                <span className={`${styles.chip} ${CHIP_TONE[row.status.tone]}`}>
                  <span className={styles.chipDot} aria-hidden="true" />
                  {row.status.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
