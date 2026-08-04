// IPI-483 · PLN-ENG-002 — Expand Approve date edits into root + successor
// changedTasks (same calendar-day propagation as PlannerEngine.shiftTask).
// Pure: no DB. Callers stamp expectedUpdatedAt (proposal CAS for roots,
// fresh read for auto-propagated successors).

import { PlannerEngine } from "./engine";
import type { PlannerDependency, PlannerTask } from "./types";

export type GateDateProposal = {
  taskId: string;
  newStartDate: string;
  newEndDate: string;
};

export type ExpandedGateDateChange = {
  taskId: string;
  newStartDate: string;
  newEndDate: string;
  /** True when this id appeared in the operator's proposal (not only BFS). */
  fromProposal: boolean;
};

const engine = new PlannerEngine();

/** Calendar-day delta between ISO dates (YYYY-MM-DD). */
export function calendarDayDelta(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00.000Z`);
  const b = Date.parse(`${to}T00:00:00.000Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.round((b - a) / 86_400_000);
}

/**
 * Apply proposed absolute dates, shifting FS successors when the root moves.
 * Duration changes (end delta ≠ start delta) push an extra end-aligned shift
 * to successors, then the root is restored to the exact proposed span.
 */
export function expandProposedGateChanges(
  tasks: PlannerTask[],
  dependencies: PlannerDependency[],
  proposed: GateDateProposal[],
): { ok: true; changes: ExpandedGateDateChange[] } | { ok: false; message: string } {
  if (proposed.length === 0) return { ok: true, changes: [] };

  const working = new Map(tasks.map((t) => [t.id, { ...t }]));
  const proposalIds = new Set(proposed.map((p) => p.taskId));

  for (const change of proposed) {
    if (!change.newStartDate || !change.newEndDate) {
      return { ok: false, message: "Every schedule change needs a start and end date." };
    }
    if (change.newStartDate > change.newEndDate) {
      return { ok: false, message: "Start date must be on or before end date." };
    }

    const current = working.get(change.taskId);
    if (!current) {
      return { ok: false, message: "A task in this approval is no longer on the plan." };
    }

    if (!current.startDate || !current.endDate) {
      working.set(change.taskId, {
        ...current,
        startDate: change.newStartDate,
        endDate: change.newEndDate,
      });
      continue;
    }

    const startDelta = calendarDayDelta(current.startDate, change.newStartDate);
    const endDelta = calendarDayDelta(current.endDate, change.newEndDate);
    if (Number.isNaN(startDelta) || Number.isNaN(endDelta)) {
      return { ok: false, message: "That request wasn't valid." };
    }

    if (startDelta !== 0) {
      const { updated, conflicts } = engine.shiftTask(
        change.taskId,
        startDelta,
        working,
        dependencies,
      );
      if (conflicts.length > 0) {
        return { ok: false, message: conflicts[0] ?? "Schedule conflict." };
      }
      for (const [id, task] of updated) working.set(id, task);
    }

    // Extra end-aligned push when duration changed (or start-only was 0).
    const extraEnd = endDelta - startDelta;
    if (extraEnd !== 0) {
      const { updated, conflicts } = engine.shiftTask(
        change.taskId,
        extraEnd,
        working,
        dependencies,
      );
      if (conflicts.length > 0) {
        return { ok: false, message: conflicts[0] ?? "Schedule conflict." };
      }
      for (const [id, task] of updated) working.set(id, task);
    }

    const after = working.get(change.taskId)!;
    working.set(change.taskId, {
      ...after,
      startDate: change.newStartDate,
      endDate: change.newEndDate,
    });
  }

  const changes: ExpandedGateDateChange[] = [];
  const seen = new Set<string>();

  for (const task of tasks) {
    const next = working.get(task.id);
    if (!next?.startDate || !next.endDate) continue;
    if (next.startDate === task.startDate && next.endDate === task.endDate) continue;
    seen.add(task.id);
    changes.push({
      taskId: task.id,
      newStartDate: next.startDate,
      newEndDate: next.endDate,
      fromProposal: proposalIds.has(task.id),
    });
  }

  for (const change of proposed) {
    if (seen.has(change.taskId)) continue;
    const original = tasks.find((t) => t.id === change.taskId);
    if (!original) continue;
    if (
      original.startDate === change.newStartDate &&
      original.endDate === change.newEndDate
    ) {
      continue;
    }
    changes.push({
      taskId: change.taskId,
      newStartDate: change.newStartDate,
      newEndDate: change.newEndDate,
      fromProposal: true,
    });
  }

  return { ok: true, changes };
}
