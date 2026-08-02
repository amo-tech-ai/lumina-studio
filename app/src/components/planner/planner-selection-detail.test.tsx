// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { PlannerPhase, PlannerTask } from "@/lib/planner/types";

import { PlannerPhaseDetail } from "./planner-selection-detail";

afterEach(() => cleanup());

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
    status: "done",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("PlannerPhaseDetail — gate state", () => {
  it("shows Ready for approval when all tasks are done but no persisted approval exists", () => {
    render(
      <PlannerPhaseDetail
        phase={phase()}
        tasks={[task({ id: "a", status: "done" }), task({ id: "b", status: "done", startDate: "2026-03-05", endDate: "2026-03-07" })]}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId("planner-detail-gate-state").textContent).toContain("Ready for approval");
    expect(screen.getByTestId("planner-detail-gate-state").textContent).not.toContain("Approved");
  });

  it("shows Locked when the gated phase has no tasks", () => {
    render(<PlannerPhaseDetail phase={phase()} tasks={[]} onClose={() => {}} />);
    expect(screen.getByTestId("planner-detail-gate-state").textContent).toContain("Locked");
  });

  it("shows Needs correction for a reversed task range instead of a misleading earliest→latest", () => {
    render(
      <PlannerPhaseDetail
        phase={phase({ gateType: null, requiredRole: null })}
        tasks={[task({ startDate: "2026-03-20", endDate: "2026-03-15", status: "todo" })]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Needs correction/i)).toBeDefined();
  });
});
