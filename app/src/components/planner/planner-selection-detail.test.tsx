// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlannerPhase, PlannerTask } from "@/lib/planner/types";

import { PlannerPhaseDetail, PlannerTaskDetail } from "./planner-selection-detail";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const updateTaskAction = vi.fn();
vi.mock("@/app/(operator)/app/planner/[instanceId]/actions", () => ({
  updateTaskAction: (...args: unknown[]) => updateTaskAction(...args),
}));

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
    updatedAt: "2026-03-01T12:00:00.000Z",
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

describe("PlannerTaskDetail — IPI-582 updateTask form", () => {
  beforeEach(() => {
    updateTaskAction.mockReset();
    refreshMock.mockReset();
  });

  it("Viewer (canUpdateTasks=false) sees read-only detail with no Save control", () => {
    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Confirm talent" })}
        onClose={() => {}}
        canUpdateTasks={false}
      />,
    );

    expect(screen.getByTestId("planner-detail-task").getAttribute("data-readonly")).toBe("true");
    expect(screen.queryByTestId("planner-task-save")).toBeNull();
    expect(screen.getByText(/View only/i)).toBeDefined();
    expect(screen.getByText("Confirm talent")).toBeDefined();
  });

  it("authorized user can save via updateTaskAction with a stable idempotency key", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockResolvedValue({
      ok: true,
      data: { replayed: false, taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" },
    });
    const onRefreshSelection = vi.fn().mockResolvedValue({
      task: task({ title: "Confirm talent — Jordan", updatedAt: "2026-03-02T00:00:00.000Z" }),
      canUpdateTasks: true,
      assignees: [{ userId: "u-jordan", displayName: "Jordan" }],
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Confirm talent" })}
        onClose={() => {}}
        canUpdateTasks
        assignees={[{ userId: "u-jordan", displayName: "Jordan" }]}
        onRefreshSelection={onRefreshSelection}
      />,
    );

    const title = screen.getByTestId("planner-task-title");
    await user.clear(title);
    await user.type(title, "Confirm talent — Jordan");
    await user.selectOptions(screen.getByTestId("planner-task-assignee"), "u-jordan");
    await user.click(screen.getByTestId("planner-task-save"));

    await waitFor(() => expect(updateTaskAction).toHaveBeenCalledTimes(1));
    const [instanceId, taskId, expectedUpdatedAt, patch, idempotencyKey] = updateTaskAction.mock.calls[0];
    expect(instanceId).toBe("i-1");
    expect(taskId).toBe("t-1");
    expect(expectedUpdatedAt).toBe("2026-03-01T12:00:00.000Z");
    expect(patch).toEqual({
      title: "Confirm talent — Jordan",
      description: null,
      status: "todo",
      assigneeUserId: "u-jordan",
    });
    expect(typeof idempotencyKey).toBe("string");
    expect(idempotencyKey.length).toBeGreaterThan(0);
    await waitFor(() => expect(onRefreshSelection).toHaveBeenCalled());
    expect(refreshMock).toHaveBeenCalled();
  });

  it("rejects empty title before calling the action", async () => {
    const user = userEvent.setup();
    render(
      <PlannerTaskDetail task={task({ status: "todo" })} onClose={() => {}} canUpdateTasks />,
    );

    await user.clear(screen.getByTestId("planner-task-title"));
    await user.click(screen.getByTestId("planner-task-save"));

    expect(screen.getByTestId("planner-task-field-error").textContent).toMatch(/Title is required/i);
    expect(updateTaskAction).not.toHaveBeenCalled();
  });

  it("STALE_VERSION preserves draft values and offers Reload latest", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockResolvedValue({
      ok: false,
      error: {
        code: "STALE_VERSION",
        message: "This task changed since you last viewed it. Refresh and try again.",
      },
    });
    const onRefreshSelection = vi.fn().mockResolvedValue({
      task: task({
        title: "Server title",
        description: "from server",
        updatedAt: "2026-03-03T00:00:00.000Z",
      }),
      canUpdateTasks: true,
      assignees: [],
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Local draft title" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={onRefreshSelection}
      />,
    );

    const title = screen.getByTestId("planner-task-title");
    await user.clear(title);
    await user.type(title, "My unsaved edit");
    await user.click(screen.getByTestId("planner-task-save"));

    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("My unsaved edit");
    expect(screen.getByTestId("planner-task-reload")).toBeDefined();

    await user.click(screen.getByTestId("planner-task-reload"));
    await waitFor(() => expect(onRefreshSelection).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("Server title"),
    );
  });

  it("reuses the same idempotency key when retrying after a network-style failure", async () => {
    const user = userEvent.setup();
    updateTaskAction
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { replayed: false, taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" },
      });

    render(
      <PlannerTaskDetail task={task({ status: "todo" })} onClose={() => {}} canUpdateTasks />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalledTimes(1));
    const firstKey = updateTaskAction.mock.calls[0][4];

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalledTimes(2));
    expect(updateTaskAction.mock.calls[1][4]).toBe(firstKey);
  });

  it("does not expose a priority editor — adapter has no priority patch", () => {
    render(
      <PlannerTaskDetail task={task({ priority: "critical" })} onClose={() => {}} canUpdateTasks />,
    );
    expect(screen.queryByLabelText(/^Priority$/i)).toBeNull();
    expect(screen.getByText(/critical/i)).toBeDefined();
  });
});
