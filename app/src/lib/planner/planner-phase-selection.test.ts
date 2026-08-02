import { describe, expect, it } from "vitest";

import type { PlannerPhase, PlannerTask } from "./types";
import { resolvePhaseSelection } from "./planner-phase-selection";

function phase(id: string, name: string): PlannerPhase {
  return {
    id,
    workflowId: "wf-1",
    slug: id,
    name,
    orderIndex: 1,
    defaultDurationDays: 2,
    gateType: null,
    requiredRole: null,
  };
}

function task(id: string, phaseId: string): PlannerTask {
  return {
    id,
    instanceId: "i-1",
    phaseId,
    parentTaskId: null,
    title: id,
    description: null,
    startDate: "2026-03-02",
    endDate: "2026-03-04",
    durationDays: 2,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
  };
}

describe("resolvePhaseSelection", () => {
  it("resolves a phase id to the phase and its tasks", () => {
    const phases = [phase("ph-casting", "Casting"), phase("ph-delivery", "Item delivery")];
    const tasks = [task("t1", "ph-casting"), task("t2", "ph-casting"), task("t3", "ph-delivery")];

    const resolved = resolvePhaseSelection(phases, tasks, "ph-casting");
    expect(resolved).not.toBeNull();
    expect(resolved!.phase.name).toBe("Casting");
    expect(resolved!.tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("returns an empty task list for a valid phase with no tasks", () => {
    const resolved = resolvePhaseSelection([phase("ph-empty", "Empty")], [], "ph-empty");
    expect(resolved).toEqual({ phase: expect.objectContaining({ id: "ph-empty" }), tasks: [] });
  });

  it("returns null for an unknown phase id", () => {
    expect(resolvePhaseSelection([phase("ph-a", "A")], [], "ph-missing")).toBeNull();
  });
});
