// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlannerPhase, PlannerTask } from "@/lib/planner/types";

vi.mock("./gate-approval-card", () => ({
  GateApprovalCard: ({ gate }: { gate: { status: string; phaseName: string } }) => (
    <div data-testid="planner-gate-approval-card">GateApprovalCard:{gate.status}</div>
  ),
}));

import { PlannerPhaseDetail, PlannerTaskDetail } from "./planner-selection-detail";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const updateTaskAction = vi.fn();
const shiftTaskAction = vi.fn();
vi.mock("@/app/(operator)/app/planner/[instanceId]/actions", () => ({
  updateTaskAction: (...args: unknown[]) => updateTaskAction(...args),
  shiftTaskAction: (...args: unknown[]) => shiftTaskAction(...args),
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

  it("mounts GateApprovalCard when AdaptivePanel supplies a persisted gate", () => {
    render(
      <PlannerPhaseDetail
        instanceId="i-1"
        phase={phase()}
        tasks={[task({ status: "done" })]}
        gate={{
          phaseId: "ph-casting",
          phaseName: "Casting",
          phaseSlug: "casting",
          orderIndex: 2,
          gateType: "approval",
          requiredRole: "manager",
          status: "reachable",
          approvalId: null,
          approvedAt: null,
          approvedBy: null,
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId("planner-gate-approval-card").textContent).toContain("reachable");
    expect(screen.queryByTestId("planner-detail-gate-state")).toBeNull();
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
    shiftTaskAction.mockReset();
    refreshMock.mockReset();
  });

  it("Viewer (canUpdateTasks=false) sees read-only detail with no Save control", () => {
    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Confirm talent", assigneeRole: "producer" })}
        onClose={() => {}}
        canUpdateTasks={false}
      />,
    );

    expect(screen.getByTestId("planner-detail-task").getAttribute("data-readonly")).toBe("true");
    expect(screen.queryByTestId("planner-task-save")).toBeNull();
    expect(screen.getByText(/View only/i)).toBeDefined();
    expect(screen.getByText("Confirm talent")).toBeDefined();
    expect(screen.getByText(/Role · producer/i)).toBeDefined();
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

  it("STALE_VERSION Review latest keeps the draft and Retry is not offered", async () => {
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
    expect(screen.getByTestId("planner-task-action-error").getAttribute("data-recovery-kind")).toBe("stale");
    expect(screen.queryByTestId("planner-task-action-error-retry")).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId("planner-task-action-error-review")),
    );

    await user.click(screen.getByTestId("planner-task-action-error-review"));
    await waitFor(() => expect(onRefreshSelection).toHaveBeenCalled());
    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("My unsaved edit");
  });

  it("NOT_FOUND closes the stale Fitting panel instead of advertising refresh", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    updateTaskAction.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "This task is no longer available." },
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Fitting" })}
        onClose={onClose}
        canUpdateTasks
      />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-action-error").getAttribute("data-recovery-kind")).toBe(
      "not_found",
    );
    expect(screen.queryByTestId("planner-task-action-error-review")).toBeNull();
    expect(screen.queryByTestId("planner-task-reload")).toBeNull();
    await user.click(screen.getByTestId("planner-task-action-error-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("treats a post-commit refresh failure as a refresh problem, not a failed save", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockResolvedValue({
      ok: true,
      data: { replayed: false, taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" },
    });
    const onRefreshSelection = vi.fn().mockRejectedValue(new Error("transport"));

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Lookbook notes" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={onRefreshSelection}
      />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-action-error").getAttribute("data-recovery-kind")).toBe(
      "refresh",
    );
    expect(screen.getByTestId("planner-task-action-error").textContent).toMatch(/already completed/i);
    expect(screen.queryByTestId("planner-task-action-error-retry")).toBeNull();
    expect(screen.getByTestId("planner-task-action-error-review")).toBeDefined();
    expect(updateTaskAction).toHaveBeenCalledTimes(1);
  });

  it("points aria-describedby at the recovery alert for a server title validation failure", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockResolvedValue({
      ok: false,
      error: { code: "INVALID_INPUT", message: "Title is too long." },
    });

    render(
      <PlannerTaskDetail task={task({ status: "todo" })} onClose={() => {}} canUpdateTasks />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    const title = screen.getByTestId("planner-task-title");
    const describedBy = title.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(screen.getByTestId("planner-task-action-error").id).toBe(describedBy);
    expect(screen.queryByTestId("planner-task-field-error")).toBeNull();
  });

  it("FORBIDDEN explains permission and does not offer Retry", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "You don't have permission to edit this task." },
    });

    render(
      <PlannerTaskDetail task={task({ status: "todo" })} onClose={() => {}} canUpdateTasks />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-action-error").getAttribute("data-recovery-kind")).toBe(
      "unauthorized",
    );
    expect(screen.getByTestId("planner-task-action-error").textContent).toMatch(/permission/i);
    expect(screen.queryByTestId("planner-task-action-error-retry")).toBeNull();
    expect(screen.queryByTestId("planner-task-reload")).toBeNull();
  });

  it("network failure offers Retry with the same idempotency key and keeps the draft", async () => {
    const user = userEvent.setup();
    updateTaskAction
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        ok: true,
        data: { replayed: false, taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" },
      });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Fitting notes" })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await user.type(screen.getByTestId("planner-task-title"), " — hold");
    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error-retry")).toBeDefined());
    expect(screen.getByTestId("planner-task-action-error").getAttribute("data-recovery-kind")).toBe(
      "network",
    );
    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toMatch(/Fitting notes/);
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId("planner-task-action-error-retry")),
    );

    const firstKey = updateTaskAction.mock.calls[0][4];
    await user.click(screen.getByTestId("planner-task-action-error-retry"));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalledTimes(2));
    expect(updateTaskAction.mock.calls[1][4]).toBe(firstKey);
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

  it("resyncs the form when switching tasks that share the same updatedAt", () => {
    const sharedUpdatedAt = "2026-03-01T12:00:00.000Z";
    const { rerender } = render(
      <PlannerTaskDetail
        task={task({ id: "t-a", title: "Task A", updatedAt: sharedUpdatedAt })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("Task A");

    rerender(
      <PlannerTaskDetail
        task={task({ id: "t-b", title: "Task B", updatedAt: sharedUpdatedAt })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("Task B");
  });

  it("keeps the current assignee visible when they are missing from the options list", () => {
    render(
      <PlannerTaskDetail
        task={task({
          status: "todo",
          assigneeUserId: "u-missing",
          title: "Has assignee",
        })}
        onClose={() => {}}
        canUpdateTasks
        assignees={[{ userId: "u-other", displayName: "Other" }]}
      />,
    );

    const select = screen.getByTestId("planner-task-assignee") as HTMLSelectElement;
    expect(select.value).toBe("u-missing");
    expect(screen.getByRole("option", { name: "Assigned member" })).toBeDefined();
  });

  it("does not show a misleading Unassigned select for role-only assignments", () => {
    render(
      <PlannerTaskDetail
        task={task({
          status: "todo",
          assigneeUserId: null,
          assigneeRole: "producer",
        })}
        onClose={() => {}}
        canUpdateTasks
        assignees={[{ userId: "u-jordan", displayName: "Jordan" }]}
      />,
    );

    expect(screen.queryByTestId("planner-task-assignee")).toBeNull();
    expect(screen.getByTestId("planner-task-assignee-role").textContent).toMatch(/Role · producer/i);
  });

  it("surfaces UNKNOWN_ERROR when updateTaskAction rejects (transport failure)", async () => {
    const user = userEvent.setup();
    updateTaskAction.mockRejectedValue(new Error("network down"));

    render(
      <PlannerTaskDetail task={task({ status: "todo" })} onClose={() => {}} canUpdateTasks />,
    );

    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(screen.getByTestId("planner-task-action-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-action-error").textContent).toMatch(
      /could not be completed/i,
    );

    // Idempotency key preserved for retry
    updateTaskAction.mockResolvedValue({
      ok: true,
      data: { replayed: false, taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" },
    });
    const firstKey = updateTaskAction.mock.calls[0][4];
    await user.click(screen.getByTestId("planner-task-save"));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalledTimes(2));
    expect(updateTaskAction.mock.calls[1][4]).toBe(firstKey);
  });

  it("disables reassignment when assignee options failed to load", () => {
    render(
      <PlannerTaskDetail
        task={task({ status: "todo", assigneeUserId: "u-jordan" })}
        onClose={() => {}}
        canUpdateTasks
        assignees={[]}
        assigneesUnavailable
      />,
    );

    expect((screen.getByTestId("planner-task-assignee") as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByText(/Assignee list unavailable/i)).toBeDefined();
  });
});

describe("PlannerTaskDetail — IPI-582 shiftTask keyboard schedule", () => {
  beforeEach(() => {
    updateTaskAction.mockReset();
    shiftTaskAction.mockReset();
    refreshMock.mockReset();
  });

  it("shows proposed dates and only commits on Confirm via shiftTaskAction", async () => {
    const user = userEvent.setup();
    shiftTaskAction.mockResolvedValue({
      ok: true,
      data: { replayed: false, changedTasks: [{ taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" }] },
    });
    const onRefreshSelection = vi.fn().mockResolvedValue({
      task: task({
        startDate: "2026-03-05",
        endDate: "2026-03-07",
        updatedAt: "2026-03-02T00:00:00.000Z",
      }),
      canUpdateTasks: true,
      assignees: [],
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={onRefreshSelection}
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    expect(shiftTaskAction).not.toHaveBeenCalled();
    expect(screen.getByTestId("planner-task-shift-preview").textContent).toContain("2026-03-05");
    expect(screen.getByTestId("planner-task-shift-preview").textContent).toContain("2026-03-07");

    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(shiftTaskAction).toHaveBeenCalledTimes(1));
    const [instanceId, taskId, deltaDays, idempotencyKey, expectedUpdatedAt] =
      shiftTaskAction.mock.calls[0];
    expect(instanceId).toBe("i-1");
    expect(taskId).toBe("t-1");
    expect(deltaDays).toBe(1);
    expect(typeof idempotencyKey).toBe("string");
    expect(expectedUpdatedAt).toBe("2026-03-01T12:00:00.000Z");
    await waitFor(() => expect(onRefreshSelection).toHaveBeenCalled());
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Cancel clears the proposal without calling the server", async () => {
    const user = userEvent.setup();
    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-earlier"));
    expect(screen.getByTestId("planner-task-shift-preview")).toBeDefined();
    await user.click(screen.getByTestId("planner-task-shift-cancel"));
    expect(screen.queryByTestId("planner-task-shift-preview")).toBeNull();
    expect(shiftTaskAction).not.toHaveBeenCalled();
  });

  it("surfaces typed shift errors, rolls back the uncommitted move, and does not retry", async () => {
    const user = userEvent.setup();
    shiftTaskAction.mockResolvedValue({
      ok: false,
      error: {
        code: "DEPENDENCY_CHANGED",
        message:
          'Cannot shift "Fitting" before predecessor "Casting" (requires 0-day lag after 2026-03-06).',
      },
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-shift-error").getAttribute("data-recovery-kind")).toBe(
      "dependency",
    );
    expect(screen.getByTestId("planner-task-shift-error").textContent).toMatch(/Fitting/);
    expect(screen.queryByTestId("planner-task-shift-preview")).toBeNull();
    expect(screen.queryByTestId("planner-task-shift-error-retry")).toBeNull();
  });

  it("failed shift STALE_VERSION keeps typed notes and offers Review latest", async () => {
    const user = userEvent.setup();
    shiftTaskAction.mockResolvedValue({
      ok: false,
      error: {
        code: "STALE_VERSION",
        message: "This task changed since you last viewed it. Refresh and try again.",
      },
    });
    const onRefreshSelection = vi.fn().mockResolvedValue({
      task: task({
        title: "Fitting",
        startDate: "2026-03-10",
        endDate: "2026-03-12",
        updatedAt: "2026-03-04T00:00:00.000Z",
      }),
      canUpdateTasks: true,
      assignees: [],
    });

    render(
      <PlannerTaskDetail
        task={task({
          status: "todo",
          title: "Fitting",
          startDate: "2026-03-04",
          endDate: "2026-03-06",
        })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={onRefreshSelection}
      />,
    );

    await user.type(screen.getByTestId("planner-task-description"), "Need extra rack time");
    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error")).toBeDefined());
    expect(screen.queryByTestId("planner-task-shift-preview")).toBeNull();

    await user.click(screen.getByTestId("planner-task-shift-error-review"));
    await waitFor(() => expect(onRefreshSelection).toHaveBeenCalled());
    expect((screen.getByTestId("planner-task-description") as HTMLTextAreaElement).value).toBe(
      "Need extra rack time",
    );
  });

  it("failed shift UNKNOWN_ERROR keeps the proposal so Retry can confirm again", async () => {
    const user = userEvent.setup();
    shiftTaskAction
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { replayed: false, changedTasks: [{ taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" }] },
      });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={vi.fn().mockResolvedValue({
          task: task({ startDate: "2026-03-05", endDate: "2026-03-07" }),
          canUpdateTasks: true,
          assignees: [],
        })}
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error-retry")).toBeDefined());
    expect(screen.getByTestId("planner-task-shift-error").getAttribute("data-recovery-kind")).toBe(
      "unknown",
    );
    expect(screen.getByTestId("planner-task-shift-preview")).toBeDefined();
    const firstKey = shiftTaskAction.mock.calls[0][3];
    await user.click(screen.getByTestId("planner-task-shift-error-retry"));
    await waitFor(() => expect(shiftTaskAction).toHaveBeenCalledTimes(2));
    expect(shiftTaskAction.mock.calls[1][3]).toBe(firstKey);
    expect(shiftTaskAction.mock.calls[1][2]).toBe(1);
  });

  it("FORBIDDEN shift focuses the recovery alert after the proposal is removed", async () => {
    const user = userEvent.setup();
    shiftTaskAction.mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", message: "You don't have permission to edit this task." },
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error")).toBeDefined());
    expect(screen.queryByTestId("planner-task-shift-preview")).toBeNull();
    expect(screen.queryByTestId("planner-task-shift-error-retry")).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId("planner-task-shift-error")),
    );
    expect(document.activeElement).not.toBe(document.body);
  });

  it("failed shift NOT_FOUND offers Close instead of unusable refresh actions", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    shiftTaskAction.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "This task is no longer available." },
    });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Fitting", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={onClose}
        canUpdateTasks
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error")).toBeDefined());
    expect(screen.getByTestId("planner-task-shift-error").getAttribute("data-recovery-kind")).toBe(
      "not_found",
    );
    expect(screen.queryByTestId("planner-task-shift-error-review")).toBeNull();
    expect(screen.queryByTestId("planner-task-shift-error-reload")).toBeNull();
    await user.click(screen.getByTestId("planner-task-shift-error-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("failed shift network keeps the proposal and retries with the same key", async () => {
    const user = userEvent.setup();
    shiftTaskAction
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        ok: true,
        data: { replayed: false, changedTasks: [{ taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" }] },
      });

    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={vi.fn().mockResolvedValue({
          task: task({ startDate: "2026-03-05", endDate: "2026-03-07" }),
          canUpdateTasks: true,
          assignees: [],
        })}
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(screen.getByTestId("planner-task-shift-error-retry")).toBeDefined());
    expect(screen.getByTestId("planner-task-shift-preview")).toBeDefined();
    const firstKey = shiftTaskAction.mock.calls[0][3];
    await user.click(screen.getByTestId("planner-task-shift-error-retry"));
    await waitFor(() => expect(shiftTaskAction).toHaveBeenCalledTimes(2));
    expect(shiftTaskAction.mock.calls[1][3]).toBe(firstKey);
  });

  it("hides schedule controls for Viewer", () => {
    render(
      <PlannerTaskDetail
        task={task({ status: "todo" })}
        onClose={() => {}}
        canUpdateTasks={false}
      />,
    );
    expect(screen.queryByTestId("planner-task-schedule")).toBeNull();
  });

  it("requires both start and end dates before enabling schedule shifts", () => {
    render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: null })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );
    expect(screen.getByTestId("planner-task-schedule").textContent).toMatch(/both start and end/i);
    expect(screen.queryByTestId("planner-task-move-later")).toBeNull();
  });

  it("resyncs the date picker after a successful shift refresh", async () => {
    const user = userEvent.setup();
    shiftTaskAction.mockResolvedValue({
      ok: true,
      data: { replayed: false, changedTasks: [{ taskId: "t-1", updatedAt: "2026-03-02T00:00:00.000Z" }] },
    });

    const { rerender } = render(
      <PlannerTaskDetail
        task={task({ status: "todo", startDate: "2026-03-04", endDate: "2026-03-06" })}
        onClose={() => {}}
        canUpdateTasks
        onRefreshSelection={vi.fn().mockResolvedValue({
          task: task({
            startDate: "2026-03-05",
            endDate: "2026-03-07",
            updatedAt: "2026-03-02T00:00:00.000Z",
          }),
          canUpdateTasks: true,
          assignees: [],
        })}
      />,
    );

    await user.click(screen.getByTestId("planner-task-move-later"));
    await user.click(screen.getByTestId("planner-task-shift-confirm"));
    await waitFor(() => expect(shiftTaskAction).toHaveBeenCalled());

    rerender(
      <PlannerTaskDetail
        task={task({
          status: "todo",
          startDate: "2026-03-05",
          endDate: "2026-03-07",
          updatedAt: "2026-03-02T00:00:00.000Z",
        })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await waitFor(() =>
      expect((screen.getByTestId("planner-task-shift-date") as HTMLInputElement).value).toBe(
        "2026-03-05",
      ),
    );
  });

  it("preserves unsaved field edits when schedule refresh advances updatedAt", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlannerTaskDetail
        task={task({ status: "todo", title: "Shortlist models" })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    await user.clear(screen.getByTestId("planner-task-title"));
    await user.type(screen.getByTestId("planner-task-title"), "Edited title");

    rerender(
      <PlannerTaskDetail
        task={task({
          status: "todo",
          title: "Shortlist models",
          startDate: "2026-03-05",
          endDate: "2026-03-07",
          updatedAt: "2026-03-02T00:00:00.000Z",
        })}
        onClose={() => {}}
        canUpdateTasks
      />,
    );

    expect((screen.getByTestId("planner-task-title") as HTMLInputElement).value).toBe("Edited title");
  });
});
