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

describe("PlannerPhaseDetail — task date spans", () => {
  it("renders both dates when present", () => {
    render(
      <PlannerPhaseDetail
        phase={phase({ gateType: null })}
        tasks={[task({ title: "Both ends", startDate: "2026-03-04", endDate: "2026-03-06" })]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Both ends/).closest("li")?.textContent).toContain(
      "(2026-03-04 → 2026-03-06)",
    );
  });

  it("renders start-only without pretending there are no dates", () => {
    render(
      <PlannerPhaseDetail
        phase={phase({ gateType: null })}
        tasks={[task({ title: "Start only", startDate: "2026-03-04", endDate: null })]}
        onClose={() => {}}
      />,
    );
    const text = screen.getByText(/Start only/).closest("li")?.textContent ?? "";
    expect(text).toContain("(2026-03-04)");
    expect(text).not.toContain("(no dates)");
  });

  it("renders end-only without pretending there are no dates", () => {
    render(
      <PlannerPhaseDetail
        phase={phase({ gateType: null })}
        tasks={[task({ title: "End only", startDate: null, endDate: "2026-03-06" })]}
        onClose={() => {}}
      />,
    );
    const text = screen.getByText(/End only/).closest("li")?.textContent ?? "";
    expect(text).toContain("(2026-03-06)");
    expect(text).not.toContain("(no dates)");
  });

  it("uses (no dates) only when both bounds are absent", () => {
    render(
      <PlannerPhaseDetail
        phase={phase({ gateType: null })}
        tasks={[task({ title: "Undated", startDate: null, endDate: null })]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Undated/).closest("li")?.textContent).toContain("(no dates)");
  });
});
