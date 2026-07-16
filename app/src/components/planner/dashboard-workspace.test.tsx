// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("./dashboard-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("./hub-workspace.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock("next/image", () => ({
  default: () => null,
}));

import type { PlannerDashboardSummary, PlannerInstanceSummary } from "@/lib/planner/queries";

import { PlannerDashboardWorkspace } from "./dashboard-workspace";

afterEach(() => cleanup());

function makeSummary(overrides: Partial<PlannerDashboardSummary> = {}): PlannerDashboardSummary {
  return {
    progress: 42,
    atRisk: 1,
    dueToday: 3,
    myTasks: 5,
    needsApproval: { available: false, count: null, reason: "workflow_approval_unavailable" },
    ...overrides,
  };
}

function makeItem(overrides: Partial<PlannerInstanceSummary> = {}): PlannerInstanceSummary {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    orgId: "org-1",
    workflowId: "wf-1",
    entityType: "shoot",
    entityId: "entity-1",
    name: "Summer Lookbook",
    status: "active",
    plannedStart: "2026-07-01",
    plannedEnd: "2026-08-01",
    ownerUserId: "user-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    progress: 27,
    atRisk: false,
    ...overrides,
  };
}

describe("PlannerDashboardWorkspace — success state", () => {
  it("renders real KPI values, not sample data", () => {
    render(
      <PlannerDashboardWorkspace summary={makeSummary()} items={[makeItem()]} />,
    );
    expect(screen.getByText("42%")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("renders up to three recent plan cards and a generic View all plans link", () => {
    const items = [
      makeItem({ id: "1", name: "Plan One" }),
      makeItem({ id: "2", name: "Plan Two" }),
      makeItem({ id: "3", name: "Plan Three" }),
    ];
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={items} />);
    expect(screen.getAllByTestId("hub-card")).toHaveLength(3);
    const viewAll = screen.getByRole("link", { name: /view all plans/i });
    expect(viewAll.getAttribute("href")).toBe("/app/planner");
  });

  it("labels Due today as UTC, matching V1 semantics", () => {
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={[makeItem()]} />);
    expect(screen.getByText(/Due today uses UTC in V1/i)).toBeDefined();
  });
});

describe("PlannerDashboardWorkspace — honest zero and null handling", () => {
  it("shows a real zero, not sample data or a dash, when a metric is genuinely zero", () => {
    render(
      <PlannerDashboardWorkspace
        summary={makeSummary({ atRisk: 0, dueToday: 0, myTasks: 0 })}
        items={[makeItem()]}
      />,
    );
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(3);
  });

  it("renders an em dash and 'Not enough data yet' for null progress, never a fabricated 0%", () => {
    render(
      <PlannerDashboardWorkspace summary={makeSummary({ progress: null })} items={[makeItem()]} />,
    );
    expect(screen.queryByText("0%")).toBeNull();
    expect(screen.getByText("Not enough data yet")).toBeDefined();
  });

  it("renders 0% (a real zero), not 'Not enough data', when eligible tasks exist but none are done", () => {
    render(
      <PlannerDashboardWorkspace summary={makeSummary({ progress: 0 })} items={[makeItem()]} />,
    );
    expect(screen.getByText("0%")).toBeDefined();
    expect(screen.queryByText("Not enough data yet")).toBeNull();
  });
});

describe("PlannerDashboardWorkspace — approvals stay honestly unavailable", () => {
  it("never renders a number for Needs approval, regardless of other metrics", () => {
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={[makeItem()]} />);
    expect(screen.getByText("Not available yet")).toBeDefined();
    // The approvals card's own value cell is the em dash, not a count.
    const approvalCard = screen.getByLabelText(/Needs approval: Not available yet/i);
    expect(approvalCard.textContent).toContain("—");
  });

  it("the approvals card is not a link — there is nowhere to navigate to yet", () => {
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={[makeItem()]} />);
    const approvalCard = screen.getByLabelText(/Needs approval: Not available yet/i);
    expect(approvalCard.tagName).toBe("ARTICLE");
  });
});

describe("PlannerDashboardWorkspace — no-plans state", () => {
  it("renders 'No plans yet' and a safe link back to the Hub when there are zero visible plans", () => {
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={[]} />);
    expect(screen.getByText("No plans yet")).toBeDefined();
    const link = screen.getByRole("link", { name: /browse plans/i });
    expect(link.getAttribute("href")).toBe("/app/planner");
    expect(screen.queryByTestId("dashboard-stats")).toBeNull();
  });
});

describe("PlannerDashboardWorkspace — accessible structure", () => {
  it("every navigation action is a real link, never a clickable div", () => {
    render(<PlannerDashboardWorkspace summary={makeSummary()} items={[makeItem()]} />);
    const progressLink = screen.getByLabelText(/^Progress:/);
    expect(progressLink.tagName).toBe("A");
  });
});
