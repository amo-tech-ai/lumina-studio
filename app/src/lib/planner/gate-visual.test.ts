import { describe, expect, it } from "vitest";

import { applyInstanceGates, gateUiToVisual } from "./gate-visual";
import { buildTimelineModel } from "./planner-view-model";
import type { InstanceGate, PlannerPhase, PlannerTask } from "./types";

const TODAY = "2026-03-12";

function phase(overrides: Partial<PlannerPhase> = {}): PlannerPhase {
  return {
    id: "ph-cast",
    workflowId: "wf-1",
    slug: "casting",
    name: "Casting",
    orderIndex: 1,
    defaultDurationDays: 3,
    gateType: "approval",
    requiredRole: "manager",
    ...overrides,
  };
}

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: "t1",
    instanceId: "i1",
    phaseId: "ph-cast",
    parentTaskId: null,
    title: "Shortlist",
    description: null,
    startDate: "2026-03-04",
    endDate: "2026-03-06",
    durationDays: 2,
    status: "done",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

function gate(overrides: Partial<InstanceGate> = {}): InstanceGate {
  return {
    phaseId: "ph-cast",
    phaseName: "Casting",
    phaseSlug: "casting",
    orderIndex: 1,
    gateType: "approval",
    requiredRole: "manager",
    status: "reachable",
    approvalId: null,
    approvedAt: null,
    approvedBy: null,
    ...overrides,
  };
}

describe("gateUiToVisual", () => {
  it("maps each GateUiStatus onto a diamond state", () => {
    expect(gateUiToVisual("locked")).toBe("locked");
    expect(gateUiToVisual("reachable")).toBe("ready");
    expect(gateUiToVisual("approved")).toBe("approved");
    expect(gateUiToVisual("discarded")).toBe("discarded");
  });
});

describe("applyInstanceGates", () => {
  it("overlays persisted Approved over task-only Ready", () => {
    const model = buildTimelineModel([phase()], [task()], TODAY);
    expect(model.phases[0].gate).toBe("ready");

    const next = applyInstanceGates(model, [gate({ status: "approved", approvalId: "ga-1" })]);
    expect(next.phases[0].gate).toBe("approved");
    expect(next.scheduled[0].gate).toBe("approved");
  });

  it("surfaces Discarded when the adapter reports it", () => {
    const model = buildTimelineModel([phase()], [task({ status: "todo" })], TODAY);
    expect(model.phases[0].gate).toBe("locked");

    const next = applyInstanceGates(model, [gate({ status: "discarded" })]);
    expect(next.phases[0].gate).toBe("discarded");
  });

  it("leaves rows unchanged when no gates are provided", () => {
    const model = buildTimelineModel([phase()], [task()], TODAY);
    expect(applyInstanceGates(model, [])).toBe(model);
  });
});
