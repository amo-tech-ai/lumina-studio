import { beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

vi.mock("@/lib/planner/queries", () => ({
  getInstanceDetail: vi.fn(),
  listWorkflowPhases: vi.fn(),
}));

vi.mock("@/lib/planner/planner-view-model", () => ({
  buildTimelineModel: vi.fn(() => ({ phases: [] })),
  buildKanbanModel: vi.fn(() => ({ columns: [] })),
  buildTaskViews: vi.fn(() => []),
}));

vi.mock("@/components/planner/planner-timeline", () => ({
  PlannerTimeline: () => null,
}));

vi.mock("@/components/planner/planner-kanban", () => ({
  PlannerKanban: () => null,
}));

vi.mock("@/components/planner/planner-list", () => ({
  PlannerList: () => null,
}));

vi.mock("@/components/planner/planner-workspace-shell", () => ({
  PlannerWorkspaceShell: () => null,
}));

import { getInstanceDetail, listWorkflowPhases } from "@/lib/planner/queries";
import PlannerWorkspacePage from "./page";

beforeEach(() => {
  notFound.mockClear();
  vi.mocked(getInstanceDetail).mockReset();
  vi.mocked(listWorkflowPhases).mockReset();
});

describe("PlannerWorkspacePage — getInstanceDetail failures", () => {
  it("calls notFound() for INVALID_INPUT instead of throwing the query message", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    } as never);

    await expect(PlannerWorkspacePage({ params: Promise.resolve({ instanceId: "missing" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledTimes(1);
    expect(listWorkflowPhases).not.toHaveBeenCalled();
  });

  it("rethrows non-INVALID_INPUT failures for the route error boundary", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue({
      ok: false,
      error: { code: "QUERY_FAILED", message: "database unavailable" },
    } as never);

    await expect(PlannerWorkspacePage({ params: Promise.resolve({ instanceId: "i-1" }) })).rejects.toThrow(
      "database unavailable",
    );
    expect(notFound).not.toHaveBeenCalled();
  });
});
