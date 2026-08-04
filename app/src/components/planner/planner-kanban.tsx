"use client";

// IPI-580 · PLN-S1C — read-only Kanban (SCR-32-Planner-Workspace.dc.html).
// Columns = workflow phases (not task status). Cards show status as a chip.
// Selection reuses AdaptivePanel via usePlannerSelection: phase columns select
// the phase; Unassigned cards select the task. No DnD, no mutation menus.

import { Lock } from "lucide-react";

import type { PhaseTimelineStatus } from "@/lib/planner/planner-view-model";
import {
  resolveOwnerInitials,
  resolveTaskStatusChip,
  type KanbanColumn,
  type KanbanModel,
  type TaskStatusTone,
  UNASSIGNED_COLUMN_KEY,
} from "@/lib/planner/planner-view-model";
import type { PlannerTask } from "@/lib/planner/types";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./planner-kanban.module.css";

const COLUMN_DOT: Record<PhaseTimelineStatus, string> = {
  done: styles.dotDone,
  in_progress: styles.dotInProgress,
  blocked: styles.dotBlocked,
  at_risk: styles.dotAtRisk,
  todo: styles.dotTodo,
};

const CHIP_TONE: Record<TaskStatusTone, string> = {
  todo: styles.chipTodo,
  in_progress: styles.chipInProgress,
  blocked: styles.chipBlocked,
  done: styles.chipDone,
  cancelled: styles.chipCancelled,
  neutral: styles.chipNeutral,
};

function columnGated(col: KanbanColumn): boolean {
  return col.gate === "ready" || col.gate === "locked" || col.gate === "discarded";
}

/** Match Timeline phaseRowAccessibleName gate phrasing. */
export function kanbanColumnAccessibleName(col: KanbanColumn): string {
  const parts = [`${col.label}`, `${col.tasks.length} tasks`];
  if (col.gate === "ready") parts.push("gate ready for approval");
  else if (col.gate === "locked") parts.push("gate locked");
  else if (col.gate === "approved") parts.push("gate approved");
  else if (col.gate === "discarded") parts.push("gate discarded");
  return parts.join(", ");
}

export function PlannerKanban({ model }: { model: KanbanModel }) {
  const { selection, setSelection } = usePlannerSelection();

  if (model.columns.length === 0) {
    return (
      <div className={styles.empty} data-testid="planner-kanban-empty">
        No steps yet — add a workflow template to see the board.
      </div>
    );
  }

  const selectColumnTask = (col: KanbanColumn, task: PlannerTask) => {
    if (col.key === UNASSIGNED_COLUMN_KEY || !col.phase) {
      setSelection({ type: "task", id: task.id });
      return;
    }
    setSelection({ type: "phase", id: col.phase.id });
  };

  const isCardSelected = (col: KanbanColumn, task: PlannerTask) => {
    if (!selection) return false;
    if (col.key === UNASSIGNED_COLUMN_KEY || !col.phase) {
      return selection.type === "task" && selection.id === task.id;
    }
    return selection.type === "phase" && selection.id === col.phase.id;
  };

  return (
    <div className={styles.board} data-testid="planner-kanban">
      {model.columns.map((col) => {
        const gated = columnGated(col);
        return (
          <section
            key={col.key}
            className={styles.column}
            data-testid="planner-kanban-column"
            data-phase-key={col.key}
            aria-label={kanbanColumnAccessibleName(col)}
          >
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={`${styles.dot} ${COLUMN_DOT[col.status]}`} aria-hidden="true" />
                <span className={styles.label}>{col.label}</span>
                {gated && <Lock size={11} aria-hidden="true" className={styles.lockIcon} />}
              </div>
              <span className={styles.count}>{col.tasks.length}</span>
            </header>
            <div className={styles.cards}>
              {col.tasks.map((task) => {
                const chip = resolveTaskStatusChip(task.status);
                const selected = isCardSelected(col, task);
                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
                    aria-label={`Select ${task.title}`}
                    aria-pressed={selected}
                    onClick={() => selectColumnTask(col, task)}
                    data-testid="planner-kanban-card"
                  >
                    <div className={styles.title}>{task.title}</div>
                    <div className={styles.meta}>
                      <span className={`${styles.chip} ${CHIP_TONE[chip.tone]}`}>
                        <span className={styles.chipDot} aria-hidden="true" />
                        {chip.label}
                      </span>
                      <span className={styles.avatar} aria-hidden="true">
                        {resolveOwnerInitials(task)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
