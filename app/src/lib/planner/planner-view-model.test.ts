import { describe, expect, it } from "vitest";

import type { PlannerPhase, PlannerTask } from "./types";
import { buildTimelineModel, groupTasksByPhase } from "./planner-view-model";

const TODAY = "2026-03-12";

function phase(overrides: Partial<PlannerPhase> = {}): PlannerPhase {
  return {
    id: "ph-casting",
    workflowId: "wf-1",
    slug: "casting",
    name: "Casting",
    orderIndex: 2,
    defaultDurationDays: 3,
    gateType: "approval",
    requiredRole: "manager",
    ...overrides,
  };
}

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: "t-1",
    instanceId: "i-1",
    phaseId: "ph-casting",
    parentTaskId: null,
    title: "Shortlist models",
    description: null,
    startDate: "2026-03-04",
    endDate: "2026-03-06",
    durationDays: 2,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("groupTasksByPhase", () => {
  it("groups tasks by phase_id, skipping orphaned tasks", () => {
    const grouped = groupTasksByPhase([
      task({ id: "a", phaseId: "ph-1" }),
      task({ id: "b", phaseId: "ph-2" }),
      task({ id: "c", phaseId: "ph-1" }),
      task({ id: "d", phaseId: null }),
    ]);
    expect(grouped.get("ph-1")?.map((t) => t.id)).toEqual(["a", "c"]);
    expect(grouped.get("ph-2")?.map((t) => t.id)).toEqual(["b"]);
  });
});

describe("phase range aggregation (earliest task start → latest task end)", () => {
  it("derives the phase range from multiple tasks — AC-C.7", () => {
    const model = buildTimelineModel(
      [phase()],
      [
        task({ id: "a", startDate: "2026-03-04", endDate: "2026-03-06", status: "done" }),
        task({ id: "b", startDate: "2026-03-05", endDate: "2026-03-10", status: "in_progress" }),
      ],
      TODAY,
    );
    const row = model.phases[0];
    expect(row.range).toEqual({ start: { year: 2026, month: 3, day: 4 }, end: { year: 2026, month: 3, day: 10 } });
    expect(row.durationLabel).toBe("7d");
  });

  it("renders ONE bar per phase, never per task — AC-G", () => {
    const model = buildTimelineModel(
      [phase()],
      [
        task({ id: "a", startDate: "2026-03-04", endDate: "2026-03-06" }),
        task({ id: "b", startDate: "2026-03-05", endDate: "2026-03-10" }),
        task({ id: "c", startDate: "2026-03-06", endDate: "2026-03-07" }),
      ],
      TODAY,
    );
    expect(model.phases.length).toBe(1);
    expect(model.scheduled.length).toBe(1);
  });

  it("applies the one-day phase-width convention — AC-C.5", () => {
    const model = buildTimelineModel(
      [phase({ id: "ph-x", slug: "x", name: "X", gateType: null, requiredRole: null })],
      [task({ id: "a", phaseId: "ph-x", startDate: "2026-03-04", endDate: "2026-03-04" })],
      TODAY,
    );
    const row = model.scheduled[0];
    // One day of a 7-day single-week range = 1/7 of the width.
    expect(row.widthPercent).toBeCloseTo(100 / 7, 2);
    expect(row.durationLabel).toBe("1d");
  });
});

describe("unscheduled and invalid phases — AC-C.2 / AC-C.4", () => {
  it("marks a phase with no dated tasks as unscheduled", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", startDate: null, endDate: null }), task({ id: "b", startDate: null, endDate: "2026-03-06" })],
      TODAY,
    );
    expect(model.unscheduled.map((r) => r.phase.id)).toEqual(["ph-casting"]);
    expect(model.hasScheduled).toBe(false);
    expect(model.weeks).toEqual([]);
  });

  it("marks a phase with malformed dates as unscheduled (not crashing)", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", startDate: "not-a-date", endDate: "2026-02-31" })],
      TODAY,
    );
    expect(model.unscheduled.map((r) => r.phase.id)).toEqual(["ph-casting"]);
  });

  it("flags a reversed task range as invalid — needs correction", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", startDate: "2026-03-10", endDate: "2026-03-04" })],
      TODAY,
    );
    const row = model.phases[0];
    expect(row.invalidRange).toBe(true);
    expect(model.invalid.map((r) => r.phase.id)).toEqual(["ph-casting"]);
    expect(model.scheduled).toEqual([]);
  });

  it("a single reversed task escalates the whole phase to invalid", () => {
    const model = buildTimelineModel(
      [phase()],
      [
        task({ id: "a", startDate: "2026-03-04", endDate: "2026-03-06" }),
        task({ id: "b", startDate: "2026-03-09", endDate: "2026-03-07" }),
      ],
      TODAY,
    );
    expect(model.phases[0].invalidRange).toBe(true);
  });

  it("tolerates missing dates on some tasks while keeping the valid bar", () => {
    const model = buildTimelineModel(
      [phase()],
      [
        task({ id: "a", startDate: "2026-03-04", endDate: "2026-03-06" }),
        task({ id: "b", startDate: null, endDate: null }),
      ],
      TODAY,
    );
    const row = model.scheduled[0];
    expect(row.range).toEqual({ start: { year: 2026, month: 3, day: 4 }, end: { year: 2026, month: 3, day: 6 } });
    expect(row.invalidRange).toBe(false);
  });
});

describe("phase status derivation", () => {
  it("done when all non-cancelled tasks are done", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", status: "done" }), task({ id: "b", status: "done" })],
      TODAY,
    );
    expect(model.phases[0].status).toBe("done");
  });

  it("at_risk when an incomplete task is overdue — AC-C.1 proximity", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", status: "in_progress", startDate: "2026-03-04", endDate: "2026-03-11" })],
      TODAY, // 2026-03-12 > end
    );
    expect(model.phases[0].atRisk).toBe(true);
    expect(model.phases[0].status).toBe("at_risk");
  });

  it("blocked when a task is blocked (and nothing overdue)", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", status: "blocked", endDate: "2026-03-20" })],
      TODAY,
    );
    expect(model.phases[0].status).toBe("blocked");
  });

  it("in_progress when a task is in progress", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", status: "in_progress", endDate: "2026-03-20" })],
      TODAY,
    );
    expect(model.phases[0].status).toBe("in_progress");
  });

  it("todo for all-todo tasks", () => {
    const model = buildTimelineModel([phase()], [task({ id: "a", status: "todo", endDate: "2026-03-20" })], TODAY);
    expect(model.phases[0].status).toBe("todo");
  });

  it("at_risk wins over blocked", () => {
    const model = buildTimelineModel(
      [phase()],
      [
        task({ id: "a", status: "blocked", endDate: "2026-03-10" }),
        task({ id: "b", status: "todo", endDate: "2026-03-11" }),
      ],
      TODAY,
    );
    expect(model.phases[0].status).toBe("at_risk");
  });
});

describe("progress", () => {
  it("computes percent done among non-cancelled tasks", () => {
    const model = buildTimelineModel(
      [phase()],
      [task({ id: "a", status: "done" }), task({ id: "b", status: "in_progress" }), task({ id: "c", status: "cancelled" })],
      TODAY,
    );
    expect(model.phases[0].progress).toBe(50);
  });

  it("is null when the phase has no tasks", () => {
    const model = buildTimelineModel([phase()], [], TODAY);
    expect(model.phases[0].progress).toBeNull();
  });
});

describe("gates", () => {
  it("null gate when the phase has no gate_type", () => {
    const model = buildTimelineModel([phase({ gateType: null, requiredRole: null })], [task()], TODAY);
    expect(model.phases[0].gate).toBeNull();
  });

  it("locked when the phase has a gate but no tasks", () => {
    const model = buildTimelineModel([phase()], [], TODAY);
    expect(model.phases[0].gate).toBe("locked");
    expect(model.phases[0].gateRequiredRole).toBe("manager");
  });

  it("approved when all tasks are done", () => {
    const model = buildTimelineModel([phase()], [task({ id: "a", status: "done" })], TODAY);
    expect(model.phases[0].gate).toBe("approved");
  });

  it("ready when tasks exist but are not all done", () => {
    const model = buildTimelineModel([phase()], [task({ id: "a", status: "todo" })], TODAY);
    expect(model.phases[0].gate).toBe("ready");
  });
});

describe("milestones", () => {
  it("flags the default workflow's production phase (shoot day)", () => {
    const model = buildTimelineModel(
      [phase({ id: "ph-prod", slug: "production", name: "Production", gateType: null, requiredRole: null })],
      [task({ id: "a", phaseId: "ph-prod", title: "Shoot day" })],
      TODAY,
    );
    expect(model.phases[0].milestone).toBe(true);
  });

  it("does not flag other phases", () => {
    const model = buildTimelineModel([phase()], [task()], TODAY);
    expect(model.phases[0].milestone).toBe(false);
  });
});

describe("weeks and visible range", () => {
  it("pads the range to full weeks (Monday → Sunday)", () => {
    const model = buildTimelineModel(
      [phase({ id: "ph-x", slug: "x", gateType: null, requiredRole: null })],
      [task({ id: "a", phaseId: "ph-x", startDate: "2026-03-04", endDate: "2026-03-06" })],
      TODAY,
    );
    // 2026-03-04 is a Wednesday; week starts Mon 03-02, ends Sun 03-08.
    expect(model.rangeStart).toEqual({ year: 2026, month: 3, day: 2 });
    expect(model.rangeEnd).toEqual({ year: 2026, month: 3, day: 8 });
    expect(model.dayCount).toBe(7);
    expect(model.weeks.map((w) => w.key)).toEqual(["W1"]);
    expect(model.weeks[0].label).toBe("Mar 2");
  });

  it("spans multiple weeks when phases span them", () => {
    const model = buildTimelineModel(
      [phase({ id: "ph-x", slug: "x", gateType: null, requiredRole: null })],
      [task({ id: "a", phaseId: "ph-x", startDate: "2026-03-02", endDate: "2026-03-20" })],
      TODAY,
    );
    expect(model.weeks.length).toBe(3);
    expect(model.weeks[0].label).toBe("Mar 2");
    expect(model.weeks[1].label).toBe("Mar 9");
    expect(model.weeks[2].label).toBe("Mar 16");
  });

  it("keeps pathological ranges inside the visible window — AC-C.6", () => {
    // The visible range spans ALL scheduled phases (min start → max end),
    // so a scheduled phase can never fall outside it by construction. The
    // clamp is the defensive invariant for pathological ranges: a multi-year
    // phase must never push another phase's bar past 0/100 or overflow the
    // grid.
    const model = buildTimelineModel(
      [
        phase({ id: "ph-a", slug: "a", name: "A", gateType: null, requiredRole: null }),
        phase({ id: "ph-b", slug: "b", name: "B", gateType: null, requiredRole: null }),
      ],
      [
        task({ id: "t1", phaseId: "ph-a", startDate: "2026-03-02", endDate: "2026-03-08" }),
        // An absurdly long phase spanning years.
        task({ id: "t2", phaseId: "ph-b", startDate: "2025-01-01", endDate: "2027-01-01" }),
      ],
      TODAY,
    );
    for (const row of model.phases) {
      expect(row.leftPercent).toBeGreaterThanOrEqual(0);
      expect(row.leftPercent).toBeLessThanOrEqual(100);
      expect(row.widthPercent).toBeGreaterThanOrEqual(0);
      expect(row.widthPercent).toBeLessThanOrEqual(100);
    }
    // The 7-day phase still occupies roughly 1% of the ~735-day window.
    expect(model.phases[0].widthPercent).toBeCloseTo((7 / model.dayCount) * 100, 2);
  });

  it("orders phases by order_index regardless of input order", () => {
    const model = buildTimelineModel(
      [
        phase({ id: "ph-b", slug: "b", name: "B", orderIndex: 3, gateType: null, requiredRole: null }),
        phase({ id: "ph-a", slug: "a", name: "A", orderIndex: 1, gateType: null, requiredRole: null }),
      ],
      [],
      TODAY,
    );
    expect(model.phases.map((r) => r.phase.name)).toEqual(["A", "B"]);
  });
});
