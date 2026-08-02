import { describe, expect, it } from "vitest";

import { selectCurrentTaskForViewer, type SelectablePlannerTask } from "./select-current-task";

const TODAY = "2026-03-12";
const VIEWER = "user-viewer";
const OTHER = "user-other";

function task(overrides: Partial<SelectablePlannerTask> & { id: string }): SelectablePlannerTask {
  return {
    status: "in_progress",
    assigneeUserId: VIEWER,
    startDate: null,
    endDate: null,
    ...overrides,
  };
}

describe("selectCurrentTaskForViewer", () => {
  it("returns null when viewer id is missing", () => {
    expect(selectCurrentTaskForViewer([task({ id: "a" })], null, TODAY)).toBeNull();
    expect(selectCurrentTaskForViewer([task({ id: "a" })], "", TODAY)).toBeNull();
  });

  it("returns null when today is malformed", () => {
    expect(selectCurrentTaskForViewer([task({ id: "a" })], VIEWER, "not-a-date")).toBeNull();
  });

  it("requires assigneeUserId === viewer and status in_progress", () => {
    const tasks = [
      task({ id: "assigned-todo", status: "todo", startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "other-user", assigneeUserId: OTHER, startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "mine", startDate: "2026-03-01", endDate: "2026-03-02" }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("mine");
  });

  it("prefers a valid range containing today over other buckets", () => {
    const tasks = [
      task({ id: "undated" }),
      task({ id: "start-only", startDate: "2026-03-01", endDate: null }),
      task({ id: "in-range", startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "end-only", startDate: null, endDate: "2026-03-20" }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("in-range");
  });

  it("ranks start-only (start ≤ today) above end-only and undated", () => {
    const tasks = [
      task({ id: "undated" }),
      task({ id: "end-only", startDate: null, endDate: "2026-03-20" }),
      task({ id: "start-only", startDate: "2026-03-01", endDate: null }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("start-only");
  });

  it("ranks end-only (end ≥ today) above undated", () => {
    const tasks = [
      task({ id: "undated" }),
      task({ id: "end-only", startDate: null, endDate: "2026-03-20" }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("end-only");
  });

  it("accepts undated in-progress when nothing dated matches better", () => {
    expect(selectCurrentTaskForViewer([task({ id: "undated" })], VIEWER, TODAY)?.id).toBe(
      "undated",
    );
  });

  it("does not put start-only future starts in bucket 2 — falls to nearest-start tie-break", () => {
    const tasks = [
      task({ id: "future-start", startDate: "2026-03-20", endDate: null }),
      task({ id: "nearer-future", startDate: "2026-03-15", endDate: null }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("nearer-future");
  });

  it("does not treat reversed ranges as containing today", () => {
    const tasks = [
      task({ id: "reversed", startDate: "2026-03-20", endDate: "2026-03-01" }),
      task({ id: "undated" }),
    ];
    // Reversed is bucket 5; undated is bucket 4 → undated wins.
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("undated");
  });

  it("breaks ties with nearest valid start date, then stable task id", () => {
    const sameDistance = [
      task({ id: "b-id", startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "a-id", startDate: "2026-03-10", endDate: "2026-03-14" }),
    ];
    expect(selectCurrentTaskForViewer(sameDistance, VIEWER, TODAY)?.id).toBe("a-id");

    const nearerStart = [
      task({ id: "far", startDate: "2026-03-01", endDate: "2026-03-20" }),
      task({ id: "near", startDate: "2026-03-11", endDate: "2026-03-13" }),
    ];
    expect(selectCurrentTaskForViewer(nearerStart, VIEWER, TODAY)?.id).toBe("near");
  });

  it("when start distances match, nearer end wins before id", () => {
    const tasks = [
      task({ id: "far-end", startDate: "2026-03-10", endDate: "2026-03-20" }),
      task({ id: "near-end", startDate: "2026-03-10", endDate: "2026-03-14" }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("near-end");
  });

  it("breaks undated ties by stable id (infinite distances must not NaN-skip)", () => {
    const tasks = [task({ id: "z-undated" }), task({ id: "a-undated" })];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe("a-undated");
    expect(selectCurrentTaskForViewer([...tasks].reverse(), VIEWER, TODAY)?.id).toBe(
      "a-undated",
    );
  });

  it("is deterministic for the same inputs", () => {
    const tasks = [
      task({ id: "z", startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "a", startDate: "2026-03-10", endDate: "2026-03-14" }),
      task({ id: "m", startDate: null, endDate: null }),
    ];
    expect(selectCurrentTaskForViewer(tasks, VIEWER, TODAY)?.id).toBe(
      selectCurrentTaskForViewer([...tasks].reverse(), VIEWER, TODAY)?.id,
    );
  });

  it("ignores display-name-like fields — only assigneeUserId counts", () => {
    const withNameNoise = {
      ...task({ id: "named", assigneeUserId: OTHER }),
      assigneeDisplayName: "Viewer Name",
      assigneeName: VIEWER,
    } as SelectablePlannerTask & { assigneeDisplayName: string; assigneeName: string };
    expect(selectCurrentTaskForViewer([withNameNoise], VIEWER, TODAY)).toBeNull();
  });
});

