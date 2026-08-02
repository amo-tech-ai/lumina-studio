// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./planner-list.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const setSelection = vi.fn();
let mockSelection: { type: "phase" | "task"; id: string } | null = null;
vi.mock("@/lib/planner/use-planner-selection", () => ({
  usePlannerSelection: () => ({
    selection: mockSelection,
    setSelection,
    deselect: vi.fn(),
  }),
}));

import type { PlannerPhase, PlannerTask } from "@/lib/planner/types";
import { buildTaskViews } from "@/lib/planner/planner-view-model";
import { PlannerList } from "./planner-list";

function phase(overrides: Partial<PlannerPhase> = {}): PlannerPhase {
  return {
    id: "ph-casting",
    workflowId: "wf-1",
    slug: "casting",
    name: "Casting",
    orderIndex: 1,
    defaultDurationDays: 3,
    gateType: null,
    requiredRole: null,
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
    status: "in_progress",
    priority: "high",
    assigneeUserId: null,
    assigneeRole: "producer",
    sortOrder: 0,
    ...overrides,
  };
}

beforeEach(() => {
  setSelection.mockClear();
  mockSelection = null;
});

afterEach(() => cleanup());

describe("PlannerList — IPI-580", () => {
  it("renders SCR-32 column headers and task rows without an Actions menu", () => {
    render(
      <PlannerList
        rows={buildTaskViews(
          [phase()],
          [task({ title: "A very long task title that should still render without clipping the row" })],
        )}
      />,
    );

    for (const header of ["Task", "Step", "Owner", "Dates", "Dur", "Priority", "Status"]) {
      expect(screen.getByText(header)).toBeDefined();
    }
    expect(
      screen.getByText("A very long task title that should still render without clipping the row"),
    ).toBeDefined();
    expect(screen.getByText("Casting")).toBeDefined();
    expect(screen.getByText("In Progress")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
    expect(screen.queryByText(/Actions/i)).toBeNull();
  });

  it("selects the phase on row click; Unassigned selects the task", async () => {
    const user = userEvent.setup();
    const rows = buildTaskViews(
      [phase()],
      [
        task({ id: "t-phase", title: "Phase task", phaseId: "ph-casting" }),
        task({ id: "t-orphan", title: "Orphan task", phaseId: null }),
      ],
    );
    render(<PlannerList rows={rows} />);

    await user.click(screen.getByRole("button", { name: /Select Phase task/ }));
    expect(setSelection).toHaveBeenCalledWith({ type: "phase", id: "ph-casting" });

    await user.click(screen.getByRole("button", { name: /Select Orphan task/ }));
    expect(setSelection).toHaveBeenCalledWith({ type: "task", id: "t-orphan" });
  });

  it("shows Unassigned step label and a neutral chip for unknown status", () => {
    render(
      <PlannerList
        rows={buildTaskViews(
          [phase()],
          [
            task({
              id: "t-weird",
              phaseId: null,
              title: "Loose",
              status: "mystery" as PlannerTask["status"],
            }),
          ],
        )}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeDefined();
    expect(screen.getByText("mystery")).toBeDefined();
  });
});
