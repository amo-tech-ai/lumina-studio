// IPI-588 · PLN-S1G — pure "Happening now" selector for the Now & Next bar.
// No React, no Supabase: derives one current task from the shared
// getInstanceDetail() payload + viewer id + today. Deterministic ranking
// so the same inputs always pick the same task.

import type { PlannerTask } from "./types";
import { daysBetween, parsePlanDate, planDateToDays, type PlanDate } from "./planner-date-utils";

/** Input slice — only fields the ranking contract reads. */
export type SelectablePlannerTask = Pick<
  PlannerTask,
  "id" | "status" | "assigneeUserId" | "startDate" | "endDate"
>;

/**
 * Ranking buckets (lower is better):
 * 1 — valid inclusive range containing today
 * 2 — start-only, start on/before today
 * 3 — end-only, end on/after today
 * 4 — undated in-progress
 * 5 — other dated in-progress (outside the windows above)
 *
 * Within a bucket: nearest valid start, then nearest end, then stable task id.
 */
function rankBucket(task: SelectablePlannerTask, today: PlanDate): number {
  const start = parsePlanDate(task.startDate);
  const end = parsePlanDate(task.endDate);
  const todayDays = planDateToDays(today);

  if (start && end && daysBetween(start, end) >= 0) {
    const startDays = planDateToDays(start);
    const endDays = planDateToDays(end);
    if (startDays <= todayDays && todayDays <= endDays) return 1;
  }

  if (start && !end && planDateToDays(start) <= todayDays) return 2;
  if (!start && end && planDateToDays(end) >= todayDays) return 3;
  if (!start && !end) return 4;
  return 5;
}

/** Absolute day distance from today to the start date, or ∞ when absent. */
function startDateDistance(task: SelectablePlannerTask, today: PlanDate): number {
  const start = parsePlanDate(task.startDate);
  if (start) return Math.abs(daysBetween(today, start));
  return Number.POSITIVE_INFINITY;
}

/** Absolute day distance from today to the end date, or ∞ when absent. */
function endDateDistance(task: SelectablePlannerTask, today: PlanDate): number {
  const end = parsePlanDate(task.endDate);
  if (end) return Math.abs(daysBetween(today, end));
  return Number.POSITIVE_INFINITY;
}

/** Compare distances without `Infinity - Infinity → NaN`. */
function compareDistance(a: number, b: number): number {
  if (a === b) return 0;
  const aInf = !Number.isFinite(a);
  const bInf = !Number.isFinite(b);
  if (aInf && bInf) return 0;
  if (aInf) return 1;
  if (bInf) return -1;
  return a - b;
}

/** Locale-independent id ordering (UUIDs / ASCII ids). */
function compareTaskId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareTasks(
  a: SelectablePlannerTask,
  b: SelectablePlannerTask,
  today: PlanDate,
): number {
  const bucketDiff = rankBucket(a, today) - rankBucket(b, today);
  if (bucketDiff !== 0) return bucketDiff;

  const startDiff = compareDistance(startDateDistance(a, today), startDateDistance(b, today));
  if (startDiff !== 0) return startDiff;

  const endDiff = compareDistance(endDateDistance(a, today), endDateDistance(b, today));
  if (endDiff !== 0) return endDiff;

  return compareTaskId(a.id, b.id);
}

/**
 * Pick the viewer's current in-progress task, or null when none match.
 * `todayIso` must be `YYYY-MM-DD`; malformed today → null (fail closed).
 */
export function selectCurrentTaskForViewer<T extends SelectablePlannerTask>(
  tasks: readonly T[],
  viewerId: string | null | undefined,
  todayIso: string,
): T | null {
  if (!viewerId) return null;
  const today = parsePlanDate(todayIso);
  if (!today) return null;

  const eligible = tasks.filter(
    (task) => task.status === "in_progress" && task.assigneeUserId === viewerId,
  );
  if (eligible.length === 0) return null;

  let best = eligible[0]!;
  for (let i = 1; i < eligible.length; i += 1) {
    const candidate = eligible[i]!;
    if (compareTasks(candidate, best, today) < 0) best = candidate;
  }
  return best;
}
