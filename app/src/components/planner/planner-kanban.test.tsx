// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./planner-kanban.module.css", () => ({
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
import {
  buildKanbanModel,
  buildTimelineModel,
  UNASSIGNED_COLUMN_KEY,
} from "@/lib/planner/planner-view-model";
import { PlannerKanban } from "./planner-kanban";

const TODAY = "2026-03-12";

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
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: "producer",
    sortOrder: 0,
    ...overrides,
  };
}

function model(phases: PlannerPhase[], tasks: PlannerTask[]) {
  return buildKanbanModel(buildTimelineModel(phases, tasks, TODAY), tasks);
}

beforeEach(() => {
  setSelection.mockClear();
  mockSelection = null;
});

afterEach(() => cleanup());

describe("PlannerKanban — IPI-580", () => {
  it("renders one column per phase including empty ones", () => {
    render(
      <PlannerKanban
        model={model(
          [
            phase({ id: "ph-a", name: "Brief", orderIndex: 1 }),
            phase({ id: "ph-b", name: "Casting", orderIndex: 2 }),
          ],
          [task({ phaseId: "ph-a" })],
        )}
      />,
    );

    const columns = screen.getAllByTestId("planner-kanban-column");
    expect(columns).toHaveLength(2);
    expect(columns[0]?.getAttribute("data-phase-key")).toBe("ph-a");
    expect(columns[1]?.getAttribute("data-phase-key")).toBe("ph-b");
    expect(columns[1]?.textContent).toContain("0");
  });

  it("puts null-phase tasks in Unassigned and selects task on click", async () => {
    const user = userEvent.setup();
    render(
      <PlannerKanban
        model={model(
          [phase({ id: "ph-a", name: "Brief", orderIndex: 1 })],
          [task({ id: "orphan", phaseId: null, title: "Loose end" })],
        )}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeDefined();
    const unassigned = screen
      .getAllByTestId("planner-kanban-column")
      .find((el) => el.getAttribute("data-phase-key") === UNASSIGNED_COLUMN_KEY);
    expect(unassigned).toBeDefined();

    await user.click(screen.getByRole("button", { name: /Select Loose end/ }));
    expect(setSelection).toHaveBeenCalledWith({ type: "task", id: "orphan" });
  });

  it("selects the phase when a phase-column card is clicked — AdaptivePanel path", async () => {
    const user = userEvent.setup();
    render(
      <PlannerKanban
        model={model(
          [phase({ id: "ph-casting", name: "Casting", orderIndex: 1 })],
          [task({ id: "t-1", phaseId: "ph-casting", title: "Shortlist models" })],
        )}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Select Shortlist models/ }));
    expect(setSelection).toHaveBeenCalledWith({ type: "phase", id: "ph-casting" });
  });

  it("shows a status chip on each card, including unknown status as neutral label", () => {
    render(
      <PlannerKanban
        model={model(
          [phase()],
          [
            task({ id: "t-done", status: "done", title: "Done task" }),
            task({
              id: "t-weird",
              status: "mystery" as PlannerTask["status"],
              title: "Weird task",
            }),
          ],
        )}
      />,
    );

    expect(screen.getByText("Done")).toBeDefined();
    expect(screen.getByText("mystery")).toBeDefined();
  });

  it("shows a lock affordance on gated columns without drag handlers", () => {
    const { container } = render(
      <PlannerKanban
        model={model(
          [
            phase({
              id: "ph-gate",
              name: "Outfit confirmation",
              orderIndex: 1,
              gateType: "approval",
              requiredRole: "manager",
            }),
          ],
          [task({ phaseId: "ph-gate", status: "done" })],
        )}
      />,
    );

    expect(screen.getByText("Outfit confirmation")).toBeDefined();
    // Gate ready (all done) still shows the lock affordance in SCR-32.
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/ondrag|draggable|dnd-kit|react-beautiful-dnd/i);
  });
});
