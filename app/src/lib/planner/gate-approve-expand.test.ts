import { describe, expect, it } from "vitest";

import {
  calendarDayDelta,
  expandProposedGateChanges,
} from "./gate-approve-expand";
import type { PlannerDependency, PlannerTask } from "./types";

function task(overrides: Partial<PlannerTask> & { id: string }): PlannerTask {
  return {
    instanceId: "i1",
    phaseId: "ph1",
    parentTaskId: null,
    title: overrides.id,
    description: null,
    startDate: "2026-03-04",
    endDate: "2026-03-06",
    durationDays: 2,
    status: "done",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

function dep(
  fromTaskId: string,
  toTaskId: string,
  overrides: Partial<PlannerDependency> = {},
): PlannerDependency {
  return {
    id: `${fromTaskId}->${toTaskId}`,
    instanceId: "i1",
    fromTaskId,
    toTaskId,
    depType: "finish_to_start",
    lagDays: 0,
    ...overrides,
  };
}

describe("calendarDayDelta", () => {
  it("counts calendar days between ISO dates", () => {
    expect(calendarDayDelta("2026-03-04", "2026-03-06")).toBe(2);
    expect(calendarDayDelta("2026-03-06", "2026-03-04")).toBe(-2);
  });
});

describe("expandProposedGateChanges", () => {
  it("returns empty when nothing proposed", () => {
    expect(expandProposedGateChanges([task({ id: "t1" })], [], [])).toEqual({
      ok: true,
      changes: [],
    });
  });

  it("shifts FS successors when a root start moves", () => {
    const tasks = [
      task({ id: "t1", startDate: "2026-03-04", endDate: "2026-03-06" }),
      task({ id: "t2", startDate: "2026-03-07", endDate: "2026-03-09" }),
    ];
    const result = expandProposedGateChanges(tasks, [dep("t1", "t2")], [
      { taskId: "t1", newStartDate: "2026-03-06", newEndDate: "2026-03-08" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes).toEqual([
      {
        taskId: "t1",
        newStartDate: "2026-03-06",
        newEndDate: "2026-03-08",
        fromProposal: true,
      },
      {
        taskId: "t2",
        newStartDate: "2026-03-09",
        newEndDate: "2026-03-11",
        fromProposal: false,
      },
    ]);
  });

  it("propagates end-only duration growth to successors", () => {
    const tasks = [
      task({ id: "t1", startDate: "2026-03-04", endDate: "2026-03-06" }),
      task({ id: "t2", startDate: "2026-03-07", endDate: "2026-03-09" }),
    ];
    const result = expandProposedGateChanges(tasks, [dep("t1", "t2")], [
      { taskId: "t1", newStartDate: "2026-03-04", newEndDate: "2026-03-08" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes.find((c) => c.taskId === "t1")).toMatchObject({
      newStartDate: "2026-03-04",
      newEndDate: "2026-03-08",
      fromProposal: true,
    });
    expect(result.changes.find((c) => c.taskId === "t2")).toMatchObject({
      newStartDate: "2026-03-09",
      newEndDate: "2026-03-11",
      fromProposal: false,
    });
  });

  it("schedules a previously undated task without graph shifts", () => {
    const tasks = [
      task({ id: "t1", startDate: null, endDate: null }),
      task({ id: "t2", startDate: "2026-03-07", endDate: "2026-03-09" }),
    ];
    const result = expandProposedGateChanges(tasks, [dep("t1", "t2")], [
      { taskId: "t1", newStartDate: "2026-03-04", newEndDate: "2026-03-06" },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes).toEqual([
      {
        taskId: "t1",
        newStartDate: "2026-03-04",
        newEndDate: "2026-03-06",
        fromProposal: true,
      },
    ]);
  });
});
