import { describe, expect, it } from "vitest";
import { PlannerEngine } from "./engine";
import type { PlannerPhase, PlannerTask, PlannerDependency, PlannerAssignment, PlannerInstance, CreateInstanceParams } from "./types";

const engine = new PlannerEngine();

function makePhase(overrides: Partial<PlannerPhase> & { id: string }): PlannerPhase {
  return {
    workflowId: "wf-1",
    slug: overrides.id,
    name: overrides.id,
    orderIndex: 0,
    defaultDurationDays: 3,
    gateType: null,
    requiredRole: null,
    ...overrides,
  };
}

function makeTask(overrides: Partial<PlannerTask> & { id: string }): PlannerTask {
  return {
    instanceId: "inst-1",
    phaseId: null,
    parentTaskId: null,
    title: overrides.id,
    description: null,
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    durationDays: 3,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

function makeDep(overrides: Partial<PlannerDependency> & { id: string }): PlannerDependency {
  return {
    instanceId: "inst-1",
    fromTaskId: "",
    toTaskId: "",
    depType: "finish_to_start",
    lagDays: 0,
    ...overrides,
  };
}

function makeInstance(overrides: Partial<PlannerInstance> & { id: string }): PlannerInstance {
  return {
    orgId: "org-1",
    workflowId: "wf-1",
    entityType: "shoot",
    entityId: "entity-1",
    name: "Test Instance",
    status: "active",
    plannedStart: "2026-07-01",
    plannedEnd: null,
    ownerUserId: null,
    tasks: [],
    ...overrides,
  };
}

function makeAssign(overrides: Partial<PlannerAssignment> & { id: string; userId?: string }): PlannerAssignment {
  return {
    instanceId: "inst-1",
    userId: "user-1",
    role: "contributor",
    permissions: null,
    ...overrides,
  };
}

const baseParams: CreateInstanceParams = {
  workflowId: "wf-1",
  orgId: "org-1",
  entityType: "shoot",
  entityId: "entity-1",
  name: "Test Shoot",
  plannedStart: "2026-07-01",
};

describe("buildSchedule", () => {
  it("creates sequential tasks and dependencies from phases", () => {
    const phases = [
      makePhase({ id: "brief", orderIndex: 0, defaultDurationDays: 2 }),
      makePhase({ id: "casting", orderIndex: 1, defaultDurationDays: 3 }),
      makePhase({ id: "production", orderIndex: 2, defaultDurationDays: 5 }),
    ];

    const result = engine.buildSchedule(phases, baseParams);

    expect(result.tasks).toHaveLength(3);
    expect(result.dependencies).toHaveLength(2);
    expect(result.warnings).toEqual([]);

    expect(result.tasks[0].title).toBe("brief");
    expect(result.tasks[0].startDate).toBe("2026-07-01");
    // 2 business days from Jul 1 (Wed): Thu Jul 2, Fri Jul 3
    expect(result.tasks[0].endDate).toBe("2026-07-03");

    expect(result.tasks[1].title).toBe("casting");
    // Start = Jul 3 + 1 day = Jul 4 (Sat)
    // 3 business days from Sat: skip Sun, Mon 6, Tue 7, Wed 8
    expect(result.tasks[1].startDate).toBe("2026-07-04");
    expect(result.tasks[1].endDate).toBe("2026-07-08");

    expect(result.tasks[2].title).toBe("production");
    // Start = Jul 8 + 1 day = Jul 9 (Thu)
    // 5 business days from Thu: Fri 10, skip Sat/Sun, Mon 13, Tue 14, Wed 15, Thu 16
    expect(result.tasks[2].startDate).toBe("2026-07-09");
    expect(result.tasks[2].endDate).toBe("2026-07-16");

    expect(result.dependencies[0].toTaskId).toBe(result.tasks[1].id);
    expect(result.dependencies[1].toTaskId).toBe(result.tasks[2].id);
  });

  it("skips weekends in date calculation", () => {
    const phases = [
      makePhase({ id: "phase1", orderIndex: 0, defaultDurationDays: 4 }),
    ];

    const result = engine.buildSchedule(phases, {
      ...baseParams,
      plannedStart: "2026-07-02", // Thursday
    });

    // 4 business days from Thu Jul 2: Fri(3), Mon(6), Tue(7), Wed(8)
    expect(result.tasks[0].endDate).toBe("2026-07-08");
  });

  it("returns warning for empty phases", () => {
    const result = engine.buildSchedule([], baseParams);
    expect(result.tasks).toHaveLength(0);
    expect(result.warnings).toContain("Workflow has no phases defined; schedule is empty.");
  });

  it("generates UUIDs for task and dependency IDs", () => {
    const phases = [makePhase({ id: "p1", orderIndex: 0 })];
    const result = engine.buildSchedule(phases, baseParams);

    expect(result.tasks[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("shiftTask", () => {
  it("shifts a task forward and propagates to successors", () => {
    const t1 = makeTask({ id: "t1", startDate: "2026-07-01", endDate: "2026-07-03", sortOrder: 0 });
    const t2 = makeTask({ id: "t2", startDate: "2026-07-04", endDate: "2026-07-06", sortOrder: 1 });
    const tasks = new Map([["t1", t1], ["t2", t2]]);
    const deps = [makeDep({ id: "d1", fromTaskId: "t1", toTaskId: "t2" })];

    const result = engine.shiftTask("t1", 5, tasks, deps);

    expect(result.conflicts).toEqual([]);
    expect(result.updated.get("t1")!.startDate).toBe("2026-07-06");
    expect(result.updated.get("t1")!.endDate).toBe("2026-07-08");
    expect(result.updated.get("t2")!.startDate).toBe("2026-07-09");
    expect(result.updated.get("t2")!.endDate).toBe("2026-07-11");
  });

  it("rejects backward shift before predecessor end", () => {
    const t1 = makeTask({ id: "t1", title: "Brief", startDate: "2026-07-01", endDate: "2026-07-03", sortOrder: 0 });
    const t2 = makeTask({ id: "t2", title: "Casting", startDate: "2026-07-04", endDate: "2026-07-06", sortOrder: 1 });
    const deps = [makeDep({ id: "d1", fromTaskId: "t1", toTaskId: "t2" })];

    const result = engine.shiftTask("t2", -5, new Map([["t1", t1], ["t2", t2]]), deps);

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0]).toContain("Cannot shift");
    expect(result.conflicts[0]).toContain("Casting");
    expect(result.conflicts[0]).toContain("Brief");
  });

  it("returns conflict for unknown task", () => {
    const result = engine.shiftTask("nonexistent", 3, new Map(), []);
    expect(result.conflicts).toContain("Task nonexistent not found.");
  });

  it("propagates predecessor delta through lag edges without re-adding lag", () => {
    const t1 = makeTask({ id: "t1", startDate: "2026-07-01", endDate: "2026-07-03" });
    const t2 = makeTask({ id: "t2", startDate: "2026-07-04", endDate: "2026-07-06" });
    const tasks = new Map([["t1", t1], ["t2", t2]]);
    const deps = [makeDep({ id: "d1", fromTaskId: "t1", toTaskId: "t2", lagDays: 2 })];

    const result = engine.shiftTask("t1", 5, tasks, deps);

    // lagDays is a fixed edge constraint (applied at build time), not re-propagated
    // t2 should shift by 5 (predecessor delta only), not 5 + 2
    expect(result.updated.get("t2")!.startDate).toBe("2026-07-09");
    expect(result.updated.get("t2")!.endDate).toBe("2026-07-11");
  });
});

describe("detectCycles", () => {
  it("returns empty for acyclic graph", () => {
    const deps = [
      makeDep({ id: "d1", fromTaskId: "a", toTaskId: "b" }),
      makeDep({ id: "d2", fromTaskId: "b", toTaskId: "c" }),
    ];
    expect(engine.detectCycles(deps)).toEqual([]);
  });

  it("detects a direct cycle a->b->a", () => {
    const deps = [
      makeDep({ id: "d1", fromTaskId: "a", toTaskId: "b" }),
      makeDep({ id: "d2", fromTaskId: "b", toTaskId: "a" }),
    ];
    const cycles = engine.detectCycles(deps);
    expect(cycles.length).toBeGreaterThan(0);
    const cycle = cycles[0];
    expect(cycle).toContain("a");
    expect(cycle).toContain("b");
  });

  it("detects a self-loop", () => {
    const deps = [makeDep({ id: "d1", fromTaskId: "a", toTaskId: "a" })];
    const cycles = engine.detectCycles(deps);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("handles empty dependencies", () => {
    expect(engine.detectCycles([])).toEqual([]);
  });
});

describe("checkGate", () => {
  const basePhase = makePhase({ id: "phase-a", orderIndex: 0 });

  it("passes when no gate type is set", () => {
    const result = engine.checkGate(
      makeInstance({ id: "inst-1" }),
      basePhase,
      [makeTask({ id: "t1", phaseId: "phase-a", status: "done" })],
      [makeAssign({ id: "a1", userId: "user-1", role: "contributor" })],
      "user-1",
    );
    expect(result.passed).toBe(true);
  });

  it("fails when not all tasks in phase are done", () => {
    const phase = makePhase({ id: "phase-a", gateType: "approval" });
    const result = engine.checkGate(
      makeInstance({ id: "inst-1" }),
      phase,
      [makeTask({ id: "t1", phaseId: "phase-a", status: "in_progress" })],
      [makeAssign({ id: "a1", userId: "user-1", role: "owner" })],
      "user-1",
    );
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Not all tasks");
  });

  it("fails when user is not assigned to instance", () => {
    const phase = makePhase({ id: "phase-a", gateType: "signoff", requiredRole: "manager" });
    const result = engine.checkGate(
      makeInstance({ id: "inst-1" }),
      phase,
      [makeTask({ id: "t1", phaseId: "phase-a", status: "done" })],
      [],
      "user-1",
    );
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("not assigned");
  });

  it("fails when user role is below required role", () => {
    const phase = makePhase({ id: "phase-a", gateType: "signoff", requiredRole: "owner" });
    const result = engine.checkGate(
      makeInstance({ id: "inst-1" }),
      phase,
      [makeTask({ id: "t1", phaseId: "phase-a", status: "done" })],
      [makeAssign({ id: "a1", userId: "user-1", role: "contributor" })],
      "user-1",
    );
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("does not meet");
  });

  it("passes when user role meets required role", () => {
    const phase = makePhase({ id: "phase-a", gateType: "signoff", requiredRole: "manager" });
    const result = engine.checkGate(
      makeInstance({ id: "inst-1" }),
      phase,
      [makeTask({ id: "t1", phaseId: "phase-a", status: "done" })],
      [makeAssign({ id: "a1", userId: "user-1", role: "owner" })],
      "user-1",
    );
    expect(result.passed).toBe(true);
  });
});

describe("resolveDependencies", () => {
  it("returns predecessors and successors for a task", () => {
    const deps = [
      makeDep({ id: "d1", fromTaskId: "t1", toTaskId: "t2" }),
      makeDep({ id: "d2", fromTaskId: "t1", toTaskId: "t3" }),
      makeDep({ id: "d3", fromTaskId: "t2", toTaskId: "t3" }),
    ];

    const t2 = engine.resolveDependencies("t2", deps);
    expect(t2.predecessors).toHaveLength(1);
    expect(t2.predecessors[0].fromTaskId).toBe("t1");
    expect(t2.successors).toHaveLength(1);
    expect(t2.successors[0].toTaskId).toBe("t3");

    const t3 = engine.resolveDependencies("t3", deps);
    expect(t3.predecessors).toHaveLength(2);
    expect(t3.successors).toHaveLength(0);
  });

  it("runs cycle detection", () => {
    const deps = [
      makeDep({ id: "d1", fromTaskId: "a", toTaskId: "b" }),
      makeDep({ id: "d2", fromTaskId: "b", toTaskId: "a" }),
    ];
    const result = engine.resolveDependencies("a", deps);
    expect(result.cycles.length).toBeGreaterThan(0);
  });
});

describe("getEffectivePermissions", () => {
  it("owner can read, update, manage", () => {
    const perms = engine.getEffectivePermissions("user-1", [
      makeAssign({ id: "a1", userId: "user-1", role: "owner" }),
    ]);
    expect(perms.canRead).toBe(true);
    expect(perms.canUpdateTasks).toBe(true);
    expect(perms.canManageWorkflow).toBe(true);
    expect(perms.role).toBe("owner");
  });

  it("manager can read, update, manage", () => {
    const perms = engine.getEffectivePermissions("user-1", [
      makeAssign({ id: "a1", userId: "user-1", role: "manager" }),
    ]);
    expect(perms.canUpdateTasks).toBe(true);
    expect(perms.canManageWorkflow).toBe(true);
  });

  it("contributor can read and update but not manage", () => {
    const perms = engine.getEffectivePermissions("user-1", [
      makeAssign({ id: "a1", userId: "user-1", role: "contributor" }),
    ]);
    expect(perms.canRead).toBe(true);
    expect(perms.canUpdateTasks).toBe(true);
    expect(perms.canManageWorkflow).toBe(false);
  });

  it("viewer can read only", () => {
    const perms = engine.getEffectivePermissions("user-1", [
      makeAssign({ id: "a1", userId: "user-1", role: "viewer" }),
    ]);
    expect(perms.canRead).toBe(true);
    expect(perms.canUpdateTasks).toBe(false);
    expect(perms.canManageWorkflow).toBe(false);
  });

  it("unassigned user has no permissions", () => {
    const perms = engine.getEffectivePermissions("unknown-user", []);
    expect(perms.canRead).toBe(false);
    expect(perms.canUpdateTasks).toBe(false);
    expect(perms.canManageWorkflow).toBe(false);
    expect(perms.role).toBeNull();
  });
});
