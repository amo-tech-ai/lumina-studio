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
 * Within a bucket: nearest valid start (then end), then stable task id.
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

/** Absolute day distance from today to the best available date anchor. */
function dateDistance(task: SelectablePlannerTask, today: PlanDate): number {
  const start = parsePlanDate(task.startDate);
  if (start) return Math.abs(daysBetween(today, start));
  const end = parsePlanDate(task.endDate);
  if (end) return Math.abs(daysBetween(today, end));
  return Number.POSITIVE_INFINITY;
}

function compareTasks(
  a: SelectablePlannerTask,
  b: SelectablePlannerTask,
  today: PlanDate,
): number {
  const bucketDiff = rankBucket(a, today) - rankBucket(b, today);
  if (bucketDiff !== 0) return bucketDiff;

  const distDiff = dateDistance(a, today) - dateDistance(b, today);
  if (distDiff !== 0) return distDiff;

  return a.id.localeCompare(b.id);
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
