// IPI-581 · PLN-S1D — pure monthly Calendar model. No React, no Supabase.
// Consumes the same PlannerTask[] already loaded by getInstanceDetail
// (page.tsx) — never adds a second query.
//
// Spec locks (Linear decision 2026-08-02 + kickoff comment):
//  - Monday-first weekday order
//  - ALWAYS 42 cells (6×7) — ignore older "four/five/six rows as needed"
//  - One chip per individual task on valid start_date only
//  - No multi-day spans, no week/day views, no FullCalendar
//  - Null/malformed start_date → Unscheduled collection (never silent drop)
//  - Tasks outside the 42-cell window do not appear in cells
//  - Date math routes through planner-date-utils (IPI-579) only

import type { PlannerTask, PlannerTaskStatus } from "./types";
import {
  addPlanDays,
  daysBetween,
  parsePlanDate,
  planDateToISO,
  startOfWeekMonday,
  utcToday,
  type PlanDate,
} from "./planner-date-utils";

/** Locked: every month matrix is exactly six rows × seven columns. */
export const PLANNER_CALENDAR_CELL_COUNT = 42;

export const PLANNER_CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const KNOWN_STATUSES = new Set<PlannerTaskStatus>([
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);

export type CalendarChipStatus = PlannerTaskStatus | "unknown";

export interface PlannerCalendarChip {
  task: PlannerTask;
  /** Parsed start_date — the only placement key. */
  startDate: PlanDate;
  status: CalendarChipStatus;
  /** end_date parses and precedes start_date — place on start_date; AdaptivePanel shows detail. */
  invalidRange: boolean;
}

export interface PlannerCalendarDay {
  date: PlanDate;
  iso: string;
  /** True when date.month === model.month (leading/trailing fillers are false). */
  inMonth: boolean;
  isToday: boolean;
  chips: PlannerCalendarChip[];
}

export interface PlannerCalendarModel {
  year: number;
  month: number; // 1–12
  label: string; // "March 2026"
  weekdays: readonly string[];
  /** Always length PLANNER_CALENDAR_CELL_COUNT (42). */
  days: PlannerCalendarDay[];
  /** Tasks with null/malformed start_date — accessible Unscheduled collection. */
  unscheduled: PlannerTask[];
  today: PlanDate;
  /** True when no chip lands in any of the 42 cells. */
  emptyMonth: boolean;
}

export interface BuildPlannerMonthInput {
  year: number;
  month: number; // 1–12
  tasks: PlannerTask[];
  /** Override "today" for deterministic tests (UTC PlanDate or YYYY-MM-DD). */
  today?: PlanDate | string;
  /** Locked to monday for Phase 1; other values throw so callers can't silently diverge. */
  weekStartsOn?: "monday";
}

function resolveToday(today: PlanDate | string | undefined): PlanDate {
  if (today === undefined) return utcToday();
  if (typeof today === "string") {
    const parsed = parsePlanDate(today);
    if (!parsed) {
      throw new Error(`buildPlannerMonth: invalid today override "${today}"`);
    }
    return parsed;
  }
  return today;
}

function normalizeStatus(status: PlannerTaskStatus | string): CalendarChipStatus {
  if (KNOWN_STATUSES.has(status as PlannerTaskStatus)) return status as PlannerTaskStatus;
  return "unknown";
}

function chipSort(a: PlannerCalendarChip, b: PlannerCalendarChip): number {
  if (a.task.sortOrder !== b.task.sortOrder) return a.task.sortOrder - b.task.sortOrder;
  const titleCmp = a.task.title.localeCompare(b.task.title);
  if (titleCmp !== 0) return titleCmp;
  return a.task.id.localeCompare(b.task.id);
}

export function formatPlannerMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Shift a year/month by delta months (negative = previous). */
export function shiftPlannerMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const absolute = year * 12 + (month - 1) + delta;
  // Positive modulo: JS `%` keeps the dividend's sign (`-1 % 12 === -1`).
  const monthIndex = ((absolute % 12) + 12) % 12;
  const nextYear = Math.floor(absolute / 12);
  return { year: nextYear, month: monthIndex + 1 };
}

/**
 * Deterministic visible-chip budget from viewport width (Phase 1 lock):
 *  ≥1280 → 3,  ≥768 → 2,  else → 1.
 */
export function visibleChipLimit(viewportWidthPx: number): 1 | 2 | 3 {
  if (viewportWidthPx >= 1280) return 3;
  if (viewportWidthPx >= 768) return 2;
  return 1;
}

export function splitChipsForOverflow<T>(
  chips: readonly T[],
  limit: number,
): { visible: T[]; overflow: T[]; overflowCount: number } {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (chips.length <= safeLimit) {
    return { visible: [...chips], overflow: [], overflowCount: 0 };
  }
  const visible = chips.slice(0, safeLimit);
  const overflow = chips.slice(safeLimit);
  return { visible, overflow, overflowCount: overflow.length };
}

/**
 * Build a Monday-first, always-42-cell month matrix and place individual
 * task chips on valid start_date cells.
 */
export function buildPlannerMonth(input: BuildPlannerMonthInput): PlannerCalendarModel {
  const { year, month, tasks } = input;
  if (input.weekStartsOn !== undefined && input.weekStartsOn !== "monday") {
    throw new Error('buildPlannerMonth: weekStartsOn must be "monday"');
  }
  if (!Number.isInteger(year) || year < 100 || year > 9999) {
    throw new Error(`buildPlannerMonth: invalid year ${year}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`buildPlannerMonth: invalid month ${month}`);
  }

  const today = resolveToday(input.today);
  const firstOfMonth: PlanDate = { year, month, day: 1 };
  const gridStart = startOfWeekMonday(firstOfMonth);

  const days: PlannerCalendarDay[] = [];
  for (let i = 0; i < PLANNER_CALENDAR_CELL_COUNT; i++) {
    const date = addPlanDays(gridStart, i);
    const iso = planDateToISO(date);
    days.push({
      date,
      iso,
      inMonth: date.year === year && date.month === month,
      isToday:
        date.year === today.year && date.month === today.month && date.day === today.day,
      chips: [],
    });
  }

  const dayIndex = new Map<string, number>();
  for (let i = 0; i < days.length; i++) {
    dayIndex.set(days[i].iso, i);
  }

  const unscheduled: PlannerTask[] = [];

  for (const task of tasks) {
    const start = parsePlanDate(task.startDate);
    if (!start) {
      unscheduled.push(task);
      continue;
    }

    const iso = planDateToISO(start);
    const idx = dayIndex.get(iso);
    if (idx === undefined) {
      // Outside the 42-cell window for this month view — not Unscheduled.
      continue;
    }

    const end = parsePlanDate(task.endDate);
    const invalidRange = end !== null && daysBetween(start, end) < 0;

    days[idx].chips.push({
      task,
      startDate: start,
      status: normalizeStatus(task.status),
      invalidRange,
    });
  }

  for (const day of days) {
    day.chips.sort(chipSort);
  }

  return {
    year,
    month,
    label: formatPlannerMonthLabel(year, month),
    weekdays: PLANNER_CALENDAR_WEEKDAYS,
    days,
    unscheduled,
    today,
    emptyMonth: days.every((d) => d.chips.length === 0),
  };
}
