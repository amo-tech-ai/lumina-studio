// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./planner-timeline.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

const setSelection = vi.fn();
let mockSelection: { type: "phase"; id: string } | null = null;
vi.mock("@/lib/planner/use-planner-selection", () => ({
  usePlannerSelection: () => ({
    selection: mockSelection,
    setSelection,
    deselect: vi.fn(),
  }),
}));

import type { PlannerPhase, PlannerTask } from "@/lib/planner/types";
import { buildTimelineModel } from "@/lib/planner/planner-view-model";
import { PlannerTimeline } from "./planner-timeline";

const TODAY = "2026-03-12";

function phase(id: string, slug: string, name: string, extra: Partial<PlannerPhase> = {}): PlannerPhase {
  return {
    id,
    workflowId: "wf-1",
    slug,
    name,
    orderIndex: 1,
    defaultDurationDays: 2,
    gateType: null,
    requiredRole: null,
    ...extra,
  };
}

function task(id: string, phaseId: string, startDate: string, endDate: string, extra: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id,
    instanceId: "i1",
    phaseId,
    parentTaskId: null,
    title: id,
    description: null,
    startDate,
    endDate,
    durationDays: 1,
    status: "todo",
    priority: "medium",
    assigneeUserId: null,
    assigneeRole: null,
    sortOrder: 0,
    ...extra,
  };
}

function fixtureModel() {
  const phases = [
    phase("ph-brief", "brief", "Brief confirmation", { orderIndex: 1 }),
    phase("ph-casting", "casting", "Casting", { orderIndex: 2, gateType: "approval", requiredRole: "manager" }),
    phase("ph-soft-hold", "soft-hold", "Soft hold", { orderIndex: 3 }),
    phase("ph-payment", "payment", "Payment scheduling", { orderIndex: 4 }),
    phase("ph-outfit", "outfit-confirm", "Outfit confirmation", { orderIndex: 5, gateType: "approval", requiredRole: "manager" }),
    phase("ph-production", "production", "Production", { orderIndex: 6 }),
    phase("ph-return", "product-return", "Product return", { orderIndex: 7 }),
    phase("ph-talent", "talent", "Talent", { orderIndex: 8 }),
    phase("ph-delivery", "item-delivery", "Item delivery", { orderIndex: 9 }),
  ];
  const tasks = [
    task("t-brief", "ph-brief", "2026-03-02", "2026-03-03", { status: "done" }),
    task("t-cast-1", "ph-casting", "2026-03-04", "2026-03-05", { status: "done" }),
    task("t-cast-2", "ph-casting", "2026-03-05", "2026-03-06", { status: "done" }),
    task("t-soft", "ph-soft-hold", "2026-03-09", "2026-03-13", { status: "in_progress" }),
    // Overdue incomplete task -> at-risk amber bar.
    task("t-pay", "ph-payment", "2026-03-10", "2026-03-11"),
    task("t-outfit", "ph-outfit", "2026-03-16", "2026-03-18"),
    task("t-prod", "ph-production", "2026-03-23", "2026-03-25"),
    task("t-ret", "ph-return", "2026-03-30", "2026-04-01"),
    // Reversed range escalates the whole phase to the invalid band.
    task("t-del", "ph-delivery", "2026-03-20", "2026-03-15"),
  ];
  return buildTimelineModel(phases, tasks, TODAY);
}

beforeEach(() => {
  setSelection.mockClear();
  mockSelection = null;
});

afterEach(() => cleanup());

describe("PlannerTimeline — grid structure (SCR-32 parity)", () => {
  it("renders the week header W1..W5 with Monday labels", () => {
    render(<PlannerTimeline model={fixtureModel()} />);

    const weeks = screen.getAllByTestId("planner-timeline-week");
    expect(weeks).toHaveLength(5);
    expect(weeks[0].textContent).toContain("W1");
    expect(weeks[0].textContent).toContain("Mar 2");
    expect(weeks[4].textContent).toContain("W5");
  });

  it("renders one button row per scheduled phase, in workflow order", () => {
    render(<PlannerTimeline model={fixtureModel()} />);

    const rows = screen.getAllByTestId("planner-timeline-row");
    expect(rows).toHaveLength(7);
    expect(rows[0].getAttribute("aria-label")).toBe("Select Brief confirmation phase, done");
    expect(rows.map((r) => r.getAttribute("aria-label"))).toEqual(
      expect.arrayContaining([
        "Select Brief confirmation phase, done",
        "Select Casting phase, done",
        "Select Soft hold phase, in progress",
        "Select Payment scheduling phase, at risk",
        "Select Outfit confirmation phase, todo",
        "Select Production phase, todo",
        "Select Product return phase, todo",
      ]),
    );
  });

  it("positions bars by inclusive day spans — a 2-day phase is 2 of 35 columns wide", () => {
    const { container } = render(<PlannerTimeline model={fixtureModel()} />);

    const bars = container.querySelectorAll('[data-testid="planner-timeline-bar"]');
    expect(bars).toHaveLength(7);
    const brief = bars[0] as HTMLElement;
    expect(brief.style.left).toBe("0%");
    expect(parseFloat(brief.style.width)).toBeCloseTo((2 / 35) * 100, 5);
    const production = bars[5] as HTMLElement;
    // left is the boundary position: day offset 21 of 35 (no +1).
    expect(parseFloat(production.style.left)).toBeCloseTo((21 / 35) * 100, 5);
  });

  it("shows the duration label inside each bar", () => {
    render(<PlannerTimeline model={fixtureModel()} />);
    // "2d" appears twice (brief + payment); "5d" once (soft hold).
    expect(screen.getAllByText("2d")).toHaveLength(2);
    expect(screen.getByText("5d")).toBeDefined();
  });
});

describe("PlannerTimeline — visual markers", () => {
  it("renders the TODAY badge and current-date line", () => {
    const { container } = render(<PlannerTimeline model={fixtureModel()} />);

    const badge = screen.getByTestId("planner-timeline-today-badge");
    expect(badge.textContent).toBe("TODAY");
    // 2026-03-12 is day offset 10 of the 35-day window (Mon 03-02 .. Sun 04-05).
    expect(parseFloat((badge as HTMLElement).style.left)).toBeCloseTo((10 / 35) * 100, 5);
    expect(container.querySelectorAll('[data-testid="planner-timeline-today-line"]').length).toBeGreaterThanOrEqual(1);
  });

  it("hides the TODAY marker when today is outside the scheduled range", () => {
    const pastModel = buildTimelineModel(
      [phase("ph-brief", "brief", "Brief", { orderIndex: 1 })],
      [task("t-brief", "ph-brief", "2026-01-05", "2026-01-10", { status: "done" })],
      TODAY,
    );
    render(<PlannerTimeline model={pastModel} />);
    expect(screen.queryByTestId("planner-timeline-today-badge")).toBeNull();
    expect(screen.queryByTestId("planner-timeline-today-line")).toBeNull();
  });

  it("renders a gate diamond for gated phases only", () => {
    const { container } = render(<PlannerTimeline model={fixtureModel()} />);

    const gates = container.querySelectorAll('[data-testid="planner-timeline-gate"]');
    // casting (all done → ready) + outfit (incomplete → locked)
    expect(gates).toHaveLength(2);
    expect(gates[0].getAttribute("title")).toBe("Gate: ready for approval");
    expect(gates[1].getAttribute("title")).toBe("Gate: locked");
  });

  it("renders the shoot-day milestone flag on the production phase", () => {
    render(<PlannerTimeline model={fixtureModel()} />);

    const flag = screen.getByTestId("planner-timeline-milestone");
    expect(flag.getAttribute("title")).toBe("Shoot day");
  });

  it("colors the overdue phase bar at-risk (amber) and the done phase bar approved", () => {
    const { container } = render(<PlannerTimeline model={fixtureModel()} />);

    const bars = container.querySelectorAll('[data-testid="planner-timeline-bar"]');
    expect(bars[0].className).toContain("barDone");
    expect(bars[3].className).toContain("barAtRisk");
    expect(bars[2].className).toContain("barInProgress");
  });
});

describe("PlannerTimeline — states", () => {
  it("renders unscheduled phases in a band below the grid", () => {
    render(<PlannerTimeline model={fixtureModel()} />);

    const band = screen.getByTestId("planner-timeline-band-unscheduled");
    expect(band.textContent).toContain("Talent");
    expect(band.textContent).toContain("Unscheduled — no dates set yet");
  });

  it("renders invalid-range phases in a needs-correction band", () => {
    render(<PlannerTimeline model={fixtureModel()} />);

    const band = screen.getByTestId("planner-timeline-band-invalid");
    expect(band.textContent).toContain("Item delivery");
    expect(band.textContent).toContain("Needs correction");
  });

  it("shows the empty state when the workflow has no phases", () => {
    const emptyModel = buildTimelineModel([], [], TODAY);
    render(<PlannerTimeline model={emptyModel} />);

    expect(screen.getByTestId("planner-timeline-empty")).toBeDefined();
    expect(screen.getByText("No steps yet")).toBeDefined();
    expect(screen.queryByTestId("planner-timeline-row")).toBeNull();
  });
});

describe("PlannerTimeline — selection", () => {
  it("row buttons are native buttons and select the phase", async () => {
    const user = userEvent.setup();
    render(<PlannerTimeline model={fixtureModel()} />);

    const rows = screen.getAllByTestId("planner-timeline-row");
    await user.click(rows[0]);

    expect(setSelection).toHaveBeenCalledWith({ type: "phase", id: "ph-brief" });
  });

  it("band rows are native buttons and select the phase too", async () => {
    const user = userEvent.setup();
    render(<PlannerTimeline model={fixtureModel()} />);

    const bandRows = screen.getAllByTestId("planner-timeline-band-row");
    expect(bandRows).toHaveLength(2);
    await user.click(bandRows[1]);

    expect(setSelection).toHaveBeenCalledWith({ type: "phase", id: "ph-delivery" });
  });

  it("marks the selected row aria-pressed", () => {
    mockSelection = { type: "phase", id: "ph-casting" };
    render(<PlannerTimeline model={fixtureModel()} />);

    const rows = screen.getAllByTestId("planner-timeline-row");
    expect(rows[1].getAttribute("aria-pressed")).toBe("true");
    expect(rows[0].getAttribute("aria-pressed")).toBe("false");
  });
});
