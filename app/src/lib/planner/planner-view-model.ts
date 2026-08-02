// IPI-579 · PLN-S1B — pure normalization of a Planner instance's phases +
// tasks into the read-only Timeline model. No React, no Supabase: this is
// the single source of truth for phase rows, phase date ranges, status,
// progress, gates, and milestones, shared by the Timeline component, the
// AdaptivePanel phase detail, and (via planner-phase-selection.ts) the
// server-side selection resolver.
//
// Documented aggregation rules (IPI-579 Step A):
//
//   Phase date range = earliest task start_date → latest task end_date
//   across the phase's tasks, computed from tasks where BOTH dates parse
//   AND start <= end. One phase bar always spans its full inclusive range —
//   never one bar per task (SCR-32 parity, AC-G).
//
//   A task with a missing/malformed date contributes nothing to the range
//   but does not fail the phase. A task with a REVERSED range (start > end)
//   escalates the whole phase to `invalidRange` — the bar would mislead, so
//   the phase is pulled out of the positioned grid into the "needs
//   correction" band instead (AC "Invalid range" state).
//
//   A phase with no range (no dated tasks) is `unscheduled` and renders
//   outside the positioned grid. Phases are always listed in workflow
//   order (phase.orderIndex), matching planner.phases' own order_index.

import type { PlannerPhase, PlannerTask, PlannerTaskStatus } from "./types";
import {
  addPlanDays,
  daysBetween,
  endOfWeekSunday,
  formatPlanDateShort,
  parsePlanDate,
  planDateToDays,
  startOfWeekMonday,
  utcToday,
  type PlanDate,
} from "./planner-date-utils";

/** Soft cap so a malformed multi-year range cannot materialize unbounded weeks. */
const MAX_TIMELINE_WEEKS = 104;

// SCR-32's shoot-day milestone flag. The schema has no milestone column —
// this is the default 5-week workflow's shoot-day phase slug (its task is
// the shoot day itself). Custom workflows simply get no flags; a real
// milestone field is schema work owned by a later ticket.
const MILESTONE_PHASE_SLUGS: ReadonlySet<string> = new Set(["production"]);

export type PhaseTimelineStatus =
  | "done"
  | "in_progress"
  | "blocked"
  | "at_risk"
  | "todo";

// Mirrors SCR-32's gate diamond trio: green (approved), amber (ready for
// approval), grey (locked — nothing to approve yet).
export type GateVisualState = "approved" | "ready" | "locked";

export interface TimelinePhaseRange {
  start: PlanDate;
  end: PlanDate;
}

export interface TimelinePhase {
  phase: PlannerPhase;
  tasks: PlannerTask[];
  /** Inclusive date range derived from the phase's valid tasks; null when unscheduled. */
  range: TimelinePhaseRange | null;
  /** Reversed task dates (or otherwise invalid task ranges) — show as needing correction. */
  invalidRange: boolean;
  status: PhaseTimelineStatus;
  /** Overdue incomplete task — amber "at risk" bar per SCR-32. */
  atRisk: boolean;
  /** Percent of non-cancelled tasks done (0–100), null when the phase has no tasks. */
  progress: number | null;
  /** Shoot-day milestone flag (default-workflow `production` slug). */
  milestone: boolean;
  gate: GateVisualState | null;
  gateRequiredRole: string | null;
  /** "5d" — inclusive span of the phase range, null when unscheduled. */
  durationLabel: string | null;
  /** Horizontal position within the visible range, clamped to 0–100. */
  leftPercent: number;
  widthPercent: number;
}

export interface TimelineWeek {
  key: string; // "W1"
  label: string; // "Mar 2"
  monday: PlanDate;
  startDay: number; // UTC epoch day of the Monday
  endDay: number; // UTC epoch day of the Sunday
}

export interface TimelineModel {
  phases: TimelinePhase[]; // all phases, workflow order
  scheduled: TimelinePhase[]; // positioned rows (valid range)
  unscheduled: TimelinePhase[]; // no valid range
  invalid: TimelinePhase[]; // reversed/malformed task ranges
  weeks: TimelineWeek[];
  /** Monday of the first week; null when nothing is scheduled. */
  rangeStart: PlanDate | null;
  /** Sunday of the last week; null when nothing is scheduled. */
  rangeEnd: PlanDate | null;
  /** Days from rangeStart to rangeEnd inclusive. */
  dayCount: number;
  today: PlanDate;
  hasScheduled: boolean;
}

export function groupTasksByPhase(tasks: PlannerTask[]): Map<string, PlannerTask[]> {
  const grouped = new Map<string, PlannerTask[]>();
  for (const task of tasks) {
    if (!task.phaseId) continue;
    const list = grouped.get(task.phaseId);
    if (list) list.push(task);
    else grouped.set(task.phaseId, [task]);
  }
  return grouped;
}

const INCOMPLETE: ReadonlySet<PlannerTaskStatus> = new Set(["todo", "in_progress", "blocked"]);

function isIncomplete(task: PlannerTask): boolean {
  return INCOMPLETE.has(task.status);
}

function isCancelled(task: PlannerTask): boolean {
  return task.status === "cancelled";
}

export function rangeForPhase(tasks: PlannerTask[]): {
  range: TimelinePhaseRange | null;
  invalid: boolean;
} {
  let earliest: PlanDate | null = null;
  let latest: PlanDate | null = null;
  let invalid = false;

  for (const task of tasks) {
    const start = parsePlanDate(task.startDate);
    const end = parsePlanDate(task.endDate);

    if (!start || !end) continue;
    // Reversed task range escalates the phase regardless of other tasks —
    // one misleading bar is worse than no bar.
    if (daysBetween(start, end) < 0) {
      invalid = true;
      continue;
    }
    if (earliest === null || planDateToDays(start) < planDateToDays(earliest)) earliest = start;
    if (latest === null || planDateToDays(end) > planDateToDays(latest)) latest = end;
  }

  if (invalid) return { range: null, invalid: true };
  if (!earliest || !latest) return { range: null, invalid: false };
  return { range: { start: earliest, end: latest }, invalid: false };
}

function phaseStatus(
  tasks: PlannerTask[],
  today: PlanDate,
  progress: number | null,
): { status: PhaseTimelineStatus; atRisk: boolean } {
  if (tasks.length === 0) return { status: "todo", atRisk: false };

  const overdue = tasks.some((task) => {
    if (!isIncomplete(task)) return false;
    const end = parsePlanDate(task.endDate);
    return end !== null && planDateToDays(end) < planDateToDays(today);
  });
  if (overdue) return { status: "at_risk", atRisk: true };

  if (tasks.some((task) => task.status === "blocked")) {
    return { status: "blocked", atRisk: false };
  }
  if (progress !== null && progress === 100) return { status: "done", atRisk: false };
  if (tasks.some((task) => task.status === "in_progress")) {
    return { status: "in_progress", atRisk: false };
  }
  return { status: "todo", atRisk: false };
}

function phaseProgress(tasks: PlannerTask[]): number | null {
  const eligible = tasks.filter((task) => !isCancelled(task));
  if (eligible.length === 0) return null;
  const done = eligible.filter((task) => task.status === "done").length;
  return Math.round((done / eligible.length) * 100);
}

/**
 * Gate diamond / Detail label. Phase 1 has no persisted approval decision
 * (IPI-483), so task completion never yields `approved` — only `ready`.
 * Cancelled tasks are ignored, matching progress aggregation.
 */
export function resolveGateVisualState(
  phase: PlannerPhase,
  tasks: PlannerTask[],
): GateVisualState | null {
  if (!phase.gateType) return null;
  const eligible = tasks.filter((task) => !isCancelled(task));
  if (eligible.length === 0) return "locked";
  if (eligible.every((task) => task.status === "done")) return "ready";
  return "locked";
}

function buildWeeks(rangeStart: PlanDate, rangeEnd: PlanDate): TimelineWeek[] {
  const weeks: TimelineWeek[] = [];
  let monday = startOfWeekMonday(rangeStart);
  const finalSunday = endOfWeekSunday(rangeEnd);
  let weekIndex = 1;

  while (planDateToDays(monday) <= planDateToDays(finalSunday) && weeks.length < MAX_TIMELINE_WEEKS) {
    const sunday = addPlanDays(monday, 6);
    weeks.push({
      key: `W${weekIndex}`,
      label: formatPlanDateShort(monday),
      monday,
      startDay: planDateToDays(monday),
      endDay: planDateToDays(sunday),
    });
    monday = addPlanDays(sunday, 1);
    weekIndex += 1;
  }
  return weeks;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function buildTimelineModel(
  phases: PlannerPhase[],
  tasks: PlannerTask[],
  todayIso: string,
): TimelineModel {
  const today = parsePlanDate(todayIso) ?? utcToday();
  const byPhase = groupTasksByPhase(tasks);

  // Phase rows in workflow order — planner.phases.order_index is the
  // canonical sequence (verified ascending on the live project).
  const ordered = [...phases].sort((a, b) => a.orderIndex - b.orderIndex);

  const rows: TimelinePhase[] = ordered.map((phase) => {
    const phaseTasks = byPhase.get(phase.id) ?? [];
    const { range, invalid } = rangeForPhase(phaseTasks);
    const progress = phaseProgress(phaseTasks);
    const { status, atRisk } = phaseStatus(phaseTasks, today, progress);
    const durationLabel = range ? `${daysBetween(range.start, range.end) + 1}d` : null;

    return {
      phase,
      tasks: phaseTasks,
      range,
      invalidRange: invalid,
      status,
      atRisk,
      progress,
      milestone: MILESTONE_PHASE_SLUGS.has(phase.slug),
      gate: resolveGateVisualState(phase, phaseTasks),
      gateRequiredRole: phase.requiredRole,
      durationLabel,
      leftPercent: 0,
      widthPercent: 0,
    };
  });

  const scheduled = rows.filter((row) => row.range && !row.invalidRange);
  const unscheduled = rows.filter((row) => !row.range && !row.invalidRange);
  const invalid = rows.filter((row) => row.invalidRange);

  // Visible range: first scheduled Monday → last scheduled Sunday. When
  // nothing is scheduled the grid has no date columns — the timeline
  // renders the empty/unscheduled states instead.
  let rangeStart: PlanDate | null = null;
  let rangeEnd: PlanDate | null = null;
  if (scheduled.length > 0) {
    const first = scheduled.reduce<TimelinePhaseRange | null>(
      (min, row) =>
        min === null || planDateToDays(row.range!.start) < planDateToDays(min.start)
          ? row.range!
          : min,
      null,
    )!;
    const last = scheduled.reduce<TimelinePhaseRange | null>(
      (max, row) =>
        max === null || planDateToDays(row.range!.end) > planDateToDays(max.end)
          ? row.range!
          : max,
      null,
    )!;
    rangeStart = startOfWeekMonday(first.start);
    rangeEnd = endOfWeekSunday(last.end);
    // Bound the visible window before materializing week cells / percents.
    const maxDays = MAX_TIMELINE_WEEKS * 7;
    if (daysBetween(rangeStart, rangeEnd) + 1 > maxDays) {
      rangeEnd = addPlanDays(rangeStart, maxDays - 1);
    }
  }

  const dayCount = rangeStart && rangeEnd ? daysBetween(rangeStart, rangeEnd) + 1 : 0;

  for (const row of scheduled) {
    const { start, end } = row.range!;
    // Inclusive one-day convention: a 1-day phase spans exactly one day
    // column (IPI-579 "one explicit one-day phase-width convention").
    row.leftPercent = clampPercent((daysBetween(rangeStart!, start) / dayCount) * 100);
    row.widthPercent = clampPercent(((daysBetween(start, end) + 1) / dayCount) * 100);
  }

  return {
    phases: rows,
    scheduled,
    unscheduled,
    invalid,
    weeks: rangeStart && rangeEnd ? buildWeeks(rangeStart, rangeEnd) : [],
    rangeStart,
    rangeEnd,
    dayCount,
    today,
    hasScheduled: scheduled.length > 0,
  };
}
