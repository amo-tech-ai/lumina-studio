// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./planner-calendar.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const setSelection = vi.fn();
let mockSelection: { type: "task"; id: string } | null = null;
vi.mock("@/lib/planner/use-planner-selection", () => ({
  usePlannerSelection: () => ({
    selection: mockSelection,
    setSelection,
    deselect: vi.fn(),
  }),
}));

import type { PlannerTask } from "@/lib/planner/types";
import { PLANNER_CALENDAR_CELL_COUNT } from "@/lib/planner/planner-calendar-model";
import { PlannerCalendar } from "./planner-calendar";

const T1 = "11111111-1111-1111-1111-111111111111";
const T2 = "22222222-2222-2222-2222-222222222222";
const T3 = "33333333-3333-3333-3333-333333333333";
const T4 = "44444444-4444-4444-4444-444444444444";
const T5 = "55555555-5555-5555-5555-555555555555";
const TUN = "66666666-6666-6666-6666-666666666666";

function task(
  id: string,
  startDate: string | null,
  extra: Partial<PlannerTask> = {},
): PlannerTask {
  return {
    id,
    instanceId: "i1",
    phaseId: "ph-1",
    parentTaskId: null,
    title: extra.title ?? id.slice(0, 8),
    description: null,
    startDate,
    endDate: startDate,
    durationDays: 1,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...extra,
  };
}

beforeEach(() => {
  setSelection.mockClear();
  mockSelection = null;
  // Desktop density (3 chips) for overflow tests unless overridden.
  vi.stubGlobal("innerWidth", 1440);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlannerCalendar — grid + nav", () => {
  it("renders Monday-first headers and always 42 cells", () => {
    render(
      <PlannerCalendar
        tasks={[]}
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
      />,
    );

    const weekdayRow = screen.getByTestId("planner-calendar-weekdays");
    expect([...weekdayRow.children].map((el) => el.textContent)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.queryByRole("columnheader")).toBeNull();
    expect(screen.getAllByTestId("planner-calendar-cell")).toHaveLength(
      PLANNER_CALENDAR_CELL_COUNT,
    );
    expect(screen.getByTestId("planner-calendar-grid").querySelector("[data-cell-count]")?.getAttribute("data-cell-count")).toBe(
      "42",
    );
  });

  it("navigates Previous / Today / Next without losing the 42-cell grid", async () => {
    const user = userEvent.setup();
    render(
      <PlannerCalendar
        tasks={[]}
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
      />,
    );

    expect(screen.getByTestId("planner-calendar-label").textContent).toBe("March 2026");

    await user.click(screen.getByTestId("planner-calendar-next"));
    expect(screen.getByTestId("planner-calendar-label").textContent).toBe("April 2026");
    expect(screen.getAllByTestId("planner-calendar-cell")).toHaveLength(42);

    await user.click(screen.getByTestId("planner-calendar-prev"));
    expect(screen.getByTestId("planner-calendar-label").textContent).toBe("March 2026");

    await user.click(screen.getByTestId("planner-calendar-next"));
    await user.click(screen.getByTestId("planner-calendar-today"));
    expect(screen.getByTestId("planner-calendar-label").textContent).toBe("March 2026");
  });

  it("places chips on start_date and surfaces Unscheduled for null dates", () => {
    render(
      <PlannerCalendar
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
        tasks={[
          task(T1, "2026-03-12", { title: "Sample pull" }),
          task(TUN, null, { title: "Needs date" }),
        ]}
      />,
    );

    const mar12 = screen
      .getAllByTestId("planner-calendar-cell")
      .find((el) => el.getAttribute("data-date") === "2026-03-12");
    expect(mar12).toBeDefined();
    expect(within(mar12!).getByText("Sample pull")).toBeDefined();

    expect(screen.getByTestId("planner-calendar-unscheduled")).toBeDefined();
    expect(screen.getByText("Needs date")).toBeDefined();
  });

  it("selects a task into the shared AdaptivePanel selection contract", async () => {
    const user = userEvent.setup();
    render(
      <PlannerCalendar
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
        tasks={[task(T1, "2026-03-12", { title: "Sample pull" })]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Select task Sample pull/ }));
    expect(setSelection).toHaveBeenCalledWith({ type: "task", id: T1 });
  });

  it("shows +N more overflow and lists hidden chips; Escape closes it", async () => {
    const user = userEvent.setup();
    render(
      <PlannerCalendar
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
        tasks={[
          task(T1, "2026-03-12", { title: "A", sortOrder: 1 }),
          task(T2, "2026-03-12", { title: "B", sortOrder: 2 }),
          task(T3, "2026-03-12", { title: "C", sortOrder: 3 }),
          task(T4, "2026-03-12", { title: "D", sortOrder: 4 }),
          task(T5, "2026-03-12", { title: "E", sortOrder: 5 }),
        ]}
      />,
    );

    expect(screen.getByTestId("planner-calendar-more").textContent).toBe("+2 more");
    expect(screen.queryByTestId("planner-calendar-overflow")).toBeNull();

    await user.click(screen.getByTestId("planner-calendar-more"));
    const overflow = screen.getByTestId("planner-calendar-overflow");
    expect(within(overflow).getByText("D")).toBeDefined();
    expect(within(overflow).getByText("E")).toBeDefined();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("planner-calendar-overflow")).toBeNull();
  });

  it("styles cancelled chips as muted and still selectable", async () => {
    const user = userEvent.setup();
    render(
      <PlannerCalendar
        initialYear={2026}
        initialMonth={3}
        today="2026-03-12"
        tasks={[task(T1, "2026-03-12", { title: "Cancelled pull", status: "cancelled" })]}
      />,
    );

    const chip = screen.getByRole("button", { name: /Select task Cancelled pull/ });
    expect(chip.className).toContain("chipCancelled");
    await user.click(chip);
    expect(setSelection).toHaveBeenCalledWith({ type: "task", id: T1 });
  });

  it("marks today with an accessible Today label", () => {
    render(
      <PlannerCalendar tasks={[]} initialYear={2026} initialMonth={3} today="2026-03-12" />,
    );
    const todayCell = screen
      .getAllByTestId("planner-calendar-cell")
      .find((el) => el.getAttribute("data-date") === "2026-03-12");
    expect(within(todayCell!).getByText("Today")).toBeDefined();
  });
});
