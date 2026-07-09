import type {
  CreateInstanceParams,
  BuildScheduleResult,
  PlannerInstance,
  PlannerTask,
  PlannerPhase,
  PlannerDependency,
  PlannerAssignment,
  PlannerInstanceStatus,
  PlannerTaskStatus,
  DependencyGraph,
} from "./types";

export class PlannerEngine {
  /**
   * Build a full task schedule from a workflow's phases and an instance.
   * Returns proposed tasks + dependencies without writing to the DB.
   * Pure calculation — no side effects.
   */
  buildSchedule(
    phases: PlannerPhase[],
    params: CreateInstanceParams,
  ): BuildScheduleResult {
    const tasks: PlannerTask[] = [];
    const dependencies: PlannerDependency[] = [];
    const warnings: string[] = [];

    const sorted = [...phases].sort((a, b) => a.orderIndex - b.orderIndex);
    let cursorDate = new Date(params.plannedStart);
    let prevTaskId: string | null = null;

    for (const phase of sorted) {
      const taskId = crypto.randomUUID();
      const startDate = this.toDateString(cursorDate);
      const endDate = this.addBusinessDays(cursorDate, phase.defaultDurationDays);

      tasks.push({
        id: taskId,
        instanceId: "", // filled by caller
        phaseId: phase.id,
        parentTaskId: null,
        title: phase.name,
        description: null,
        startDate,
        endDate,
        durationDays: phase.defaultDurationDays,
        status: "todo" as PlannerTaskStatus,
        priority: "medium",
        assigneeUserId: null,
        assigneeRole: null,
        sortOrder: phase.orderIndex,
      });

      if (prevTaskId) {
        dependencies.push({
          id: crypto.randomUUID(),
          instanceId: "", // filled by caller
          fromTaskId: prevTaskId,
          toTaskId: taskId,
          depType: "finish_to_start",
          lagDays: 0,
        });
      }

      prevTaskId = taskId;
      cursorDate = new Date(endDate);
      cursorDate.setUTCDate(cursorDate.getUTCDate() + 1); // next day after end
    }

    if (sorted.length === 0) {
      warnings.push("Workflow has no phases defined; schedule is empty.");
    }

    return { tasks, dependencies, warnings };
  }

  /**
   * Shift a task's dates by deltaDays and propagate to successors.
   * Pure calculation — returns updated tasks map without side effects.
   */
  shiftTask(
    taskId: string,
    deltaDays: number,
    tasks: Map<string, PlannerTask>,
    dependencies: PlannerDependency[],
  ): { updated: Map<string, PlannerTask>; conflicts: string[] } {
    const updated = new Map(tasks);
    const conflicts: string[] = [];
    const visited = new Set<string>();

    const graph = this.buildDependencyGraph(dependencies);
    const queue: Array<{ id: string; offset: number }> = [];

    // Find base task
    const base = updated.get(taskId);
    if (!base) {
      conflicts.push(`Task ${taskId} not found.`);
      return { updated, conflicts };
    }

    // Validate: cannot shift before predecessor end
    const preds = graph.reverseAdjacency.get(taskId) ?? [];
    if (deltaDays < 0) {
      // Backward shift: check predecessors
      for (const predId of preds) {
        const pred = updated.get(predId);
        if (pred && pred.endDate) {
          const newStart = this.addBusinessDays(
            new Date(base.startDate ?? pred.endDate),
            deltaDays,
          );
          if (this.toMs(newStart) < this.toMs(pred.endDate)) {
            conflicts.push(
              `Cannot shift "${base.title}" before predecessor "${pred.title}" ends on ${pred.endDate}.`,
            );
            return { updated, conflicts };
          }
        }
      }
    }

    // Shift the base task
    const shifted = this.applyDelta(base, deltaDays);
    updated.set(taskId, shifted);
    visited.add(taskId);

    // BFS propagation to successors
    queue.push({ id: taskId, offset: deltaDays });

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const succId of graph.adjacency.get(current.id) ?? []) {
        if (visited.has(succId)) {
          // Cycle detected
          conflicts.push(`Circular dependency detected: task ${succId} already shifted.`);
          continue;
        }
        visited.add(succId);

        const succ = updated.get(succId);
        if (!succ) continue;

        // Find the dependency edge to determine lag
        const dep = dependencies.find(
          (d) => d.fromTaskId === current.id && d.toTaskId === succId,
        );
        const effectiveDelta = current.offset + (dep?.lagDays ?? 0);
        const shiftedSucc = this.applyDelta(succ, effectiveDelta);
        updated.set(succId, shiftedSucc);

        queue.push({ id: succId, offset: effectiveDelta });
      }
    }

    return { updated, conflicts };
  }

  /**
   * Detect circular dependencies in a dependency list.
   * Returns IDs of tasks involved in cycles, or empty array if clean.
   */
  detectCycles(dependencies: PlannerDependency[]): string[][] {
    const graph = this.buildDependencyGraph(dependencies);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    let path: string[] = [];

    const allTaskIds = new Set<string>();
    for (const dep of dependencies) {
      allTaskIds.add(dep.fromTaskId);
      allTaskIds.add(dep.toTaskId);
    }

    function dfs(node: string): void {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const neighbor of graph.adjacency.get(node) ?? []) {
        dfs(neighbor);
      }

      path.pop();
      recursionStack.delete(node);
    }

    for (const taskId of allTaskIds) {
      dfs(taskId);
    }

    return cycles;
  }

  /**
   * Check if a phase gate can be passed for the given instance.
   * Pure logic — no DB writes.
   */
  checkGate(
    instance: PlannerInstance,
    phase: PlannerPhase,
    tasks: PlannerTask[],
    assignments: PlannerAssignment[],
    userId: string,
  ): { passed: boolean; reason?: string } {
    if (!phase.gateType) {
      return { passed: true };
    }

    // Check all tasks in this phase are done
    const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
    const allDone = phaseTasks.every((t) => t.status === "done");
    if (!allDone) {
      return { passed: false, reason: "Not all tasks in this phase are complete." };
    }

    // Check user's role meets the gate requirement
    if (phase.requiredRole) {
      const userAssignment = assignments.find((a) => a.userId === userId);
      if (!userAssignment) {
        return { passed: false, reason: "User is not assigned to this instance." };
      }

      const hierarchy: Record<string, number> = {
        viewer: 0,
        contributor: 1,
        manager: 2,
        owner: 3,
      };

      const userLevel = hierarchy[userAssignment.role] ?? 0;
      const requiredLevel = hierarchy[phase.requiredRole] ?? 0;

      if (userLevel < requiredLevel) {
        return {
          passed: false,
          reason: `User role ${userAssignment.role} does not meet required role ${phase.requiredRole}.`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * Resolve dependency chains for a task — returns predecessor and successor lists.
   * Pure read — no side effects.
   */
  resolveDependencies(
    taskId: string,
    dependencies: PlannerDependency[],
  ): {
    predecessors: PlannerDependency[];
    successors: PlannerDependency[];
    cycles: string[][];
  } {
    // First detect cycles
    const cycles = this.detectCycles(dependencies);

    const predecessors = dependencies.filter((d) => d.toTaskId === taskId);
    const successors = dependencies.filter((d) => d.fromTaskId === taskId);

    return { predecessors, successors, cycles };
  }

  /**
   * Get effective permissions for a user on a planner instance.
   */
  getEffectivePermissions(
    userId: string,
    assignments: PlannerAssignment[],
  ): {
    role: string | null;
    canRead: boolean;
    canUpdateTasks: boolean;
    canManageWorkflow: boolean;
  } {
    const assignment = assignments.find((a) => a.userId === userId);
    if (!assignment) {
      return { role: null, canRead: false, canUpdateTasks: false, canManageWorkflow: false };
    }

    const role = assignment.role;
    return {
      role,
      canRead: true,
      canUpdateTasks: role === "owner" || role === "manager" || role === "contributor",
      canManageWorkflow: role === "owner" || role === "manager",
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private buildDependencyGraph(dependencies: PlannerDependency[]): DependencyGraph {
    const adjacency = new Map<string, string[]>();
    const reverseAdjacency = new Map<string, string[]>();

    for (const dep of dependencies) {
      // Forward: fromTask -> toTask
      if (!adjacency.has(dep.fromTaskId)) {
        adjacency.set(dep.fromTaskId, []);
      }
      adjacency.get(dep.fromTaskId)!.push(dep.toTaskId);

      // Reverse: toTask -> fromTask
      if (!reverseAdjacency.has(dep.toTaskId)) {
        reverseAdjacency.set(dep.toTaskId, []);
      }
      reverseAdjacency.get(dep.toTaskId)!.push(dep.fromTaskId);
    }

    return { adjacency, reverseAdjacency };
  }

  private applyDelta(task: PlannerTask, deltaDays: number): PlannerTask {
    const newTask = { ...task };

    if (task.startDate) {
      const d = new Date(task.startDate);
      d.setUTCDate(d.getUTCDate() + deltaDays);
      newTask.startDate = this.toDateString(d);
    }
    if (task.endDate) {
      const d = new Date(task.endDate);
      d.setUTCDate(d.getUTCDate() + deltaDays);
      newTask.endDate = this.toDateString(d);
    }

    return newTask;
  }

  private computeEarliestStart(
    taskId: string,
    tasks: Map<string, PlannerTask>,
    graph: DependencyGraph,
  ): Date | null {
    const preds = graph.reverseAdjacency.get(taskId) ?? [];
    if (preds.length === 0) return null;

    let latestEnd: Date | null = null;
    for (const predId of preds) {
      const pred = tasks.get(predId);
      if (pred?.endDate) {
        const end = new Date(pred.endDate);
        if (!latestEnd || end.getTime() > latestEnd.getTime()) {
          latestEnd = end;
        }
      }
    }
    return latestEnd;
  }

  private addBusinessDays(from: Date, days: number): string {
    const result = new Date(from);
    let remaining = Math.abs(days);
    const sign = days >= 0 ? 1 : -1;

    while (remaining > 0) {
      result.setUTCDate(result.getUTCDate() + sign);
      const day = result.getUTCDay();
      if (day !== 0 && day !== 6) {
        remaining -= 1;
      }
    }

    return this.toDateString(result);
  }

  private toDateString(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  private toMs(d: string | Date): number {
    return new Date(d).getTime();
  }
}
