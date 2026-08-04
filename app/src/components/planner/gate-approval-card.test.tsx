/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InstanceGate, PlannerTask } from "@/lib/planner/types";

const approveGateAction = vi.fn();
const discardGateAction = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(operator)/app/planner/[instanceId]/actions", () => ({
  approveGateAction: (...args: unknown[]) => approveGateAction(...args),
  discardGateAction: (...args: unknown[]) => discardGateAction(...args),
}));

vi.mock("./gate-approval-card.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { GateApprovalCard } from "./gate-approval-card";

afterEach(() => {
  cleanup();
  approveGateAction.mockReset();
  discardGateAction.mockReset();
  refresh.mockReset();
});

function gate(overrides: Partial<InstanceGate> = {}): InstanceGate {
  return {
    phaseId: "ph-cast",
    phaseName: "Casting",
    phaseSlug: "casting",
    orderIndex: 2,
    gateType: "approval",
    requiredRole: "manager",
    status: "reachable",
    approvalId: null,
    approvedAt: null,
    approvedBy: null,
    ...overrides,
  };
}

function task(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: "t1",
    instanceId: "i1",
    phaseId: "ph-cast",
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

describe("GateApprovalCard", () => {
  beforeEach(() => {
    approveGateAction.mockResolvedValue({
      ok: true,
      data: {
        replayed: false,
        status: "approved",
        phaseId: "ph-cast",
        approvalId: "ga-1",
        approvedAt: "2026-08-02T12:00:00.000Z",
        approvedBy: "u1",
        changedTasks: [],
      },
    });
    discardGateAction.mockResolvedValue({
      ok: true,
      data: {
        replayed: false,
        status: "discarded",
        phaseId: "ph-cast",
        approvalId: "ga-1",
      },
    });
  });

  it("shows before/after schedule diff and Approve / Edit / Discard — no Reject", () => {
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    expect(screen.getByTestId("planner-gate-schedule-diff").textContent).toContain("Before");
    expect(screen.getByTestId("planner-gate-schedule-diff").textContent).toContain(
      "Shortlist models",
    );
    expect(screen.getByRole("button", { name: "Approve" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Reject/i })).toBeNull();
  });

  it("Approve calls the typed action and refreshes", async () => {
    const user = userEvent.setup();
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveGateAction).toHaveBeenCalledWith("i1", "ph-cast", expect.any(String), []);
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("Discard calls the typed action and refreshes", async () => {
    const user = userEvent.setup();
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    await user.click(screen.getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(discardGateAction).toHaveBeenCalledWith("i1", "ph-cast", expect.any(String));
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("Edit toggles date editors and Approve sends proposed changes", async () => {
    const user = userEvent.setup();
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByTestId("planner-gate-edit-dates")).toBeDefined();

    const end = screen.getByLabelText("Shortlist models end date");
    fireEvent.change(end, { target: { value: "2026-03-08" } });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveGateAction).toHaveBeenCalledWith(
        "i1",
        "ph-cast",
        expect.any(String),
        [
          {
            taskId: "t1",
            newStartDate: "2026-03-04",
            newEndDate: "2026-03-08",
            expectedUpdatedAt: "2026-03-01T12:00:00.000Z",
          },
        ],
      );
    });
  });

  it("reuses the same Approve idempotency key across retries", async () => {
    approveGateAction
      .mockResolvedValueOnce({
        ok: false,
        error: {
          code: "STALE_VERSION",
          message: "This plan changed since you last viewed it. Refresh and try again.",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          replayed: false,
          status: "approved",
          phaseId: "ph-cast",
          approvalId: "ga-1",
          approvedAt: "2026-08-02T12:00:00.000Z",
          approvedBy: "u1",
          changedTasks: [],
        },
      });
    const user = userEvent.setup();
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    await screen.findByTestId("planner-gate-error");
    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveGateAction).toHaveBeenCalledTimes(2);
    });
    const key1 = approveGateAction.mock.calls[0][2];
    const key2 = approveGateAction.mock.calls[1][2];
    expect(key1).toBe(key2);
  });

  it("lets Edit schedule a previously undated task", async () => {
    const user = userEvent.setup();
    render(
      <GateApprovalCard
        instanceId="i1"
        gate={gate()}
        tasks={[task({ startDate: null, endDate: null })]}
      />,
    );

    expect(screen.getByTestId("planner-gate-schedule-diff").textContent).toContain(
      "Unscheduled",
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Shortlist models end date"), {
      target: { value: "2026-03-06" },
    });
    // start input is labelled by the title
    fireEvent.change(screen.getByLabelText("Shortlist models"), {
      target: { value: "2026-03-04" },
    });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveGateAction).toHaveBeenCalledWith(
        "i1",
        "ph-cast",
        expect.any(String),
        [
          {
            taskId: "t1",
            newStartDate: "2026-03-04",
            newEndDate: "2026-03-06",
            expectedUpdatedAt: "2026-03-01T12:00:00.000Z",
          },
        ],
      );
    });
  });

  it("calls onMutated after a successful Approve", async () => {
    const onMutated = vi.fn();
    const user = userEvent.setup();
    render(
      <GateApprovalCard
        instanceId="i1"
        gate={gate()}
        tasks={[task()]}
        onMutated={onMutated}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(onMutated).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("hides actions when the gate is locked", () => {
    render(
      <GateApprovalCard
        instanceId="i1"
        gate={gate({ status: "locked", reason: "Not all tasks in this phase are complete." })}
        tasks={[task({ status: "todo" })]}
      />,
    );

    expect(screen.getByTestId("planner-gate-status").textContent).toContain("Locked");
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("surfaces action errors without Reject", async () => {
    approveGateAction.mockResolvedValue({
      ok: false,
      error: { code: "STALE_VERSION", message: "This plan changed since you last viewed it. Refresh and try again." },
    });
    const user = userEvent.setup();
    render(<GateApprovalCard instanceId="i1" gate={gate()} tasks={[task()]} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect((await screen.findByTestId("planner-gate-error")).textContent).toMatch(
      /changed since you last viewed/i,
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
