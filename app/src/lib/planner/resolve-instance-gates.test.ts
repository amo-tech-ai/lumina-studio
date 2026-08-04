import { describe, expect, it } from "vitest";

import { resolveInstanceGates } from "./queries";
import type { PlannerAssignment, PlannerInstance, PlannerPhase, PlannerTask } from "./types";

function phase(overrides: Partial<PlannerPhase> & { id: string }): PlannerPhase {
  return {
    workflowId: "wf-1",
    slug: overrides.id,
    name: overrides.id,
    orderIndex: 0,
    defaultDurationDays: 3,
    gateType: "approval",
    requiredRole: "manager",
    ...overrides,
  };
}

function task(overrides: Partial<PlannerTask> & { id: string; phaseId: string }): PlannerTask {
  return {
    instanceId: "i1",
    parentTaskId: null,
    title: overrides.id,
    description: null,
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    durationDays: 1,
    status: "done",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

const instance: PlannerInstance = {
  id: "i1",
  orgId: "o1",
  workflowId: "wf-1",
  entityType: "shoot",
  entityId: "e1",
  name: "Spring shoot",
  status: "active",
  plannedStart: "2026-08-01",
  plannedEnd: null,
  ownerUserId: "u1",
  tasks: [],
};

const manager: PlannerAssignment = {
  id: "a1",
  instanceId: "i1",
  userId: "u1",
  role: "manager",
  permissions: null,
};

describe("resolveInstanceGates", () => {
  it("marks a gated phase Locked when tasks are incomplete", () => {
    const phases = [phase({ id: "ph-cast", name: "Casting", orderIndex: 1 })];
    const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "in_progress" })];
    const gates = resolveInstanceGates({ ...instance, tasks }, phases, [manager], "u1", []);
    expect(gates).toHaveLength(1);
    expect(gates[0].status).toBe("locked");
    expect(gates[0].reason).toMatch(/Not all tasks/i);
  });

  it("marks Reachable when all phase tasks are done and role matches — never Approved", () => {
    const phases = [phase({ id: "ph-cast", name: "Casting", orderIndex: 1 })];
    const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "done" })];
    const gates = resolveInstanceGates({ ...instance, tasks }, phases, [manager], "u1", []);
    expect(gates[0].status).toBe("reachable");
  });

  it("returns Approved only when a persisted approval row exists", () => {
    const phases = [phase({ id: "ph-cast", name: "Casting", orderIndex: 1 })];
    const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "done" })];
    const gates = resolveInstanceGates({ ...instance, tasks }, phases, [manager], "u1", [
      {
        id: "ga-1",
        phase_id: "ph-cast",
        status: "approved",
        approved_by: "u1",
        approved_at: "2026-08-02T12:00:00.000Z",
      },
    ]);
    expect(gates[0].status).toBe("approved");
    expect(gates[0].approvalId).toBe("ga-1");
  });

  it("keeps Discarded when a discarded row exists even if tasks/role still pass", () => {
    const phases = [phase({ id: "ph-cast", name: "Casting", orderIndex: 1 })];
    const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "done" })];
    const gates = resolveInstanceGates({ ...instance, tasks }, phases, [manager], "u1", [
      {
        id: "ga-1",
        phase_id: "ph-cast",
        status: "discarded",
        approved_by: null,
        approved_at: null,
      },
    ]);
    expect(gates[0].status).toBe("discarded");
  });

  it.each(["completed", "archived", "cancelled"] as const)(
    "does not advertise Reachable on terminal instance status=%s",
    (status) => {
      const phases = [phase({ id: "ph-cast", name: "Casting", orderIndex: 1 })];
      const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "done" })];
      const gates = resolveInstanceGates(
        { ...instance, status, tasks },
        phases,
        [manager],
        "u1",
        [],
      );
      expect(gates[0].status).toBe("locked");
      expect(gates[0].reason).toMatch(/completed|archived|cancelled/i);
    },
  );

  it("skips phases without a gateType", () => {
    const phases = [
      phase({ id: "ph-cast", gateType: "approval", orderIndex: 1 }),
      phase({ id: "ph-prod", gateType: null, orderIndex: 2 }),
    ];
    const tasks = [task({ id: "t1", phaseId: "ph-cast", status: "done" })];
    const gates = resolveInstanceGates({ ...instance, tasks }, phases, [manager], "u1", []);
    expect(gates.map((g) => g.phaseId)).toEqual(["ph-cast"]);
  });
});
