"use client";

// IPI-581 · PLN-S1D — read-only monthly Calendar (SCR-32). Pure presentational
// map of buildPlannerMonth(); month nav is local state. Task selection reuses
// usePlannerSelection → AdaptivePanel (same contract as Timeline). No fetch,
// no FullCalendar, no drag/mutation, no multi-day spans.
//
// Responsive scope is chip density only (3/2/1). Full Planner mobile shell /
// nav / AdaptivePanel redesign is IPI-557 — out of scope here.

import { useEffect, useId, useRef, useState } from "react";

import {
  buildPlannerMonth,
  normalizeCalendarStatus,
  shiftPlannerMonth,
  splitChipsForOverflow,
  visibleChipLimit,
  type CalendarChipStatus,
  type PlannerCalendarChip,
  type PlannerCalendarDay,
  type PlannerCalendarModel,
} from "@/lib/planner/planner-calendar-model";
import { formatPlanDateShort, parsePlanDate, utcToday } from "@/lib/planner/planner-date-utils";
import type { PlannerTask } from "@/lib/planner/types";
import { usePlannerSelection } from "@/lib/planner/use-planner-selection";

import styles from "./planner-calendar.module.css";

function resolveTodaySeed(today?: string) {
  if (!today) return utcToday();
  return parsePlanDate(today) ?? utcToday();
}

const DOT_CLASS: Record<CalendarChipStatus, string> = {
  done: styles.dotDone,
  in_progress: styles.dotInProgress,
  blocked: styles.dotBlocked,
  todo: styles.dotTodo,
  cancelled: styles.dotCancelled,
  unknown: styles.dotUnknown,
};

function useChipLimit(): 1 | 2 | 3 {
  const [limit, setLimit] = useState<1 | 2 | 3>(3);

  useEffect(() => {
    const update = () => setLimit(visibleChipLimit(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return limit;
}

function chipAccessibleName(chip: PlannerCalendarChip, day: PlannerCalendarDay): string {
  const parts = [
    `Select task ${chip.task.title}`,
    formatPlanDateShort(day.date),
    chip.status.replaceAll("_", " "),
  ];
  if (chip.invalidRange) parts.push("needs correction");
  if (!day.inMonth) parts.push("outside month");
  return parts.join(", ");
}

function TaskChip({
  chip,
  day,
  selected,
  onSelect,
}: {
  chip: PlannerCalendarChip;
  day: PlannerCalendarDay;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.chipSelected : ""} ${
        chip.status === "cancelled" ? styles.chipCancelled : ""
      }`}
      aria-label={chipAccessibleName(chip, day)}
      aria-pressed={selected}
      title={chip.task.title}
      onClick={onSelect}
      data-testid="planner-calendar-chip"
      data-task-id={chip.task.id}
    >
      <span className={`${styles.chipDot} ${DOT_CLASS[chip.status]}`} aria-hidden="true" />
      <span className={styles.chipTitle}>{chip.task.title}</span>
    </button>
  );
}

function DayCell({
  day,
  limit,
  selectedTaskId,
  onSelectTask,
  openOverflowIso,
  onToggleOverflow,
  onCloseOverflow,
}: {
  day: PlannerCalendarDay;
  limit: number;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  openOverflowIso: string | null;
  onToggleOverflow: (iso: string) => void;
  onCloseOverflow: () => void;
}) {
  const { visible, overflow, overflowCount } = splitChipsForOverflow(day.chips, limit);
  const overflowOpen = openOverflowIso === day.iso && overflowCount > 0;
  const overflowId = useId();
  const moreRef = useRef<HTMLButtonElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    overflowRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseOverflow();
        moreRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [overflowOpen, onCloseOverflow]);

  return (
    <div
      className={`${styles.cell} ${day.inMonth ? "" : styles.cellOutOfMonth}`}
      data-testid="planner-calendar-cell"
      data-date={day.iso}
      data-in-month={day.inMonth ? "true" : "false"}
    >
      <div className={`${styles.dayNum} ${day.isToday ? styles.dayNumToday : ""}`}>
        {day.date.day}
        {day.isToday && <span className={styles.todaySr}>Today</span>}
      </div>

      <div className={styles.chipList}>
        {visible.map((chip) => (
          <TaskChip
            key={chip.task.id}
            chip={chip}
            day={day}
            selected={selectedTaskId === chip.task.id}
            onSelect={() => onSelectTask(chip.task.id)}
          />
        ))}
        {overflowCount > 0 && (
          <button
            ref={moreRef}
            type="button"
            className={styles.moreButton}
            aria-expanded={overflowOpen}
            aria-controls={overflowId}
            onClick={() => onToggleOverflow(day.iso)}
            data-testid="planner-calendar-more"
          >
            +{overflowCount} more
          </button>
        )}
      </div>

      {overflowOpen && (
        <div
          ref={overflowRef}
          id={overflowId}
          role="dialog"
          tabIndex={-1}
          aria-label={`More tasks on ${formatPlanDateShort(day.date)}`}
          className={styles.overflow}
          data-testid="planner-calendar-overflow"
        >
          <div className={styles.overflowTitle}>{formatPlanDateShort(day.date)}</div>
          <div className={styles.chipList}>
            {overflow.map((chip) => (
              <TaskChip
                key={chip.task.id}
                chip={chip}
                day={day}
                selected={selectedTaskId === chip.task.id}
                onSelect={() => {
                  onSelectTask(chip.task.id);
                  onCloseOverflow();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarGrid({
  model,
  limit,
  selectedTaskId,
  onSelectTask,
}: {
  model: PlannerCalendarModel;
  limit: number;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}) {
  const [openOverflowIso, setOpenOverflowIso] = useState<string | null>(null);

  return (
    <div className={styles.card} data-testid="planner-calendar-grid">
      {/* Plain markup — incomplete ARIA grid (no gridcell/row structure or
          keyboard grid nav) is worse for screen readers than no roles. */}
      <div className={styles.weekdayRow} data-testid="planner-calendar-weekdays">
        {model.weekdays.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}
      </div>
      <div
        className={styles.grid}
        aria-label={`${model.label} calendar`}
        data-cell-count={model.days.length}
      >
        {model.days.map((day) => (
          <DayCell
            key={day.iso}
            day={day}
            limit={limit}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            openOverflowIso={openOverflowIso}
            onToggleOverflow={(iso) =>
              setOpenOverflowIso((current) => (current === iso ? null : iso))
            }
            onCloseOverflow={() => setOpenOverflowIso(null)}
          />
        ))}
      </div>
    </div>
  );
}

export function PlannerCalendar({
  tasks,
  initialYear,
  initialMonth,
  today,
}: {
  tasks: PlannerTask[];
  /** Test hooks — default to UTC today. */
  initialYear?: number;
  initialMonth?: number;
  today?: string;
}) {
  const seed = resolveTodaySeed(today);
  const [year, setYear] = useState(initialYear ?? seed.year);
  const [month, setMonth] = useState(initialMonth ?? seed.month);
  const limit = useChipLimit();
  const { selection, setSelection } = usePlannerSelection();

  const model = buildPlannerMonth({
    year,
    month,
    tasks,
    today: seed,
    weekStartsOn: "monday",
  });

  const selectedTaskId =
    selection !== null && selection.type === "task" ? selection.id : null;

  const selectTask = (taskId: string) => setSelection({ type: "task", id: taskId });

  const goToday = () => {
    // Re-read "today" at click time so a long-lived tab crossing a UTC
    // month boundary still lands on the current month.
    const now = resolveTodaySeed(today);
    setYear(now.year);
    setMonth(now.month);
  };

  const goPrev = () => {
    const next = shiftPlannerMonth(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
  };

  const goNext = () => {
    const next = shiftPlannerMonth(year, month, 1);
    setYear(next.year);
    setMonth(next.month);
  };

  return (
    <div className={styles.root} data-testid="planner-calendar">
      <div className={styles.nav}>
        <h2 className={styles.navLabel} data-testid="planner-calendar-label">
          {model.label}
        </h2>
        <div className={styles.navActions}>
          <button type="button" className={styles.navButton} onClick={goPrev} data-testid="planner-calendar-prev">
            Previous
          </button>
          <button type="button" className={styles.navButton} onClick={goToday} data-testid="planner-calendar-today">
            Today
          </button>
          <button type="button" className={styles.navButton} onClick={goNext} data-testid="planner-calendar-next">
            Next
          </button>
        </div>
      </div>

      {model.emptyMonth && (
        <div className={styles.emptyNote} data-testid="planner-calendar-empty-month">
          No scheduled tasks in {model.label}. The grid stays complete so dates stay easy to scan.
        </div>
      )}

      <CalendarGrid
        model={model}
        limit={limit}
        selectedTaskId={selectedTaskId}
        onSelectTask={selectTask}
      />

      {model.unscheduled.length > 0 && (
        <div className={styles.band} data-testid="planner-calendar-unscheduled">
          <div className={styles.bandHeading}>
            Unscheduled ({model.unscheduled.length})
          </div>
          {model.unscheduled.map((task) => {
            const status = normalizeCalendarStatus(task.status);
            return (
              <button
                key={task.id}
                type="button"
                className={styles.bandRow}
                aria-label={`Select unscheduled task ${task.title}, ${status.replaceAll("_", " ")}`}
                aria-pressed={selectedTaskId === task.id}
                onClick={() => selectTask(task.id)}
                data-testid="planner-calendar-unscheduled-row"
              >
                <span className={`${styles.chipDot} ${DOT_CLASS[status]}`} aria-hidden="true" />
                <span>{task.title}</span>
                <span className={styles.bandTag}>No valid start date</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
