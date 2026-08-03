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

vi.mock("@/components/planner/planner-calendar", () => ({
  PlannerCalendar: () => null,
}));

vi.mock("@/components/planner/planner-workspace-shell", () => ({
  PlannerWorkspaceShell: () => null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })),
    },
  })),
}));

import { getInstanceDetail, listWorkflowPhases } from "@/lib/planner/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PlannerWorkspacePage from "./page";

beforeEach(() => {
  notFound.mockClear();
  vi.mocked(getInstanceDetail).mockReset();
  vi.mocked(listWorkflowPhases).mockReset();
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })),
    },
  } as never);
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

  it("throws auth errors instead of mapping them to notFound()", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue({
      ok: true,
      data: { workflowId: "wf-1", tasks: [], status: "active" },
    } as never);
    vi.mocked(listWorkflowPhases).mockResolvedValue({
      ok: true,
      data: [],
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: { message: "auth unavailable" },
        })),
      },
    } as never);

    await expect(
      PlannerWorkspacePage({ params: Promise.resolve({ instanceId: "i-1" }) }),
    ).rejects.toThrow("auth unavailable");
    expect(notFound).not.toHaveBeenCalled();
  });
});
