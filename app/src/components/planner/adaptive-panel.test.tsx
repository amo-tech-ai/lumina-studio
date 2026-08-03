/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntelligenceDetailProvider, useIntelligenceDetail } from "@/context/intelligence-detail-context";
import type { PlannerMember, PlannerPhase, PlannerTask } from "@/lib/planner/types";

const resolvePlannerSelectionAction = vi.fn();
vi.mock("@/app/(operator)/app/planner/[instanceId]/selection-actions", () => ({
  resolvePlannerSelectionAction: (...args: unknown[]) => resolvePlannerSelectionAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/app/(operator)/app/planner/[instanceId]/actions", () => ({
  updateTaskAction: vi.fn(),
  shiftTaskAction: vi.fn(),
}));

const deselect = vi.fn();
let mockSelection: { type: string; id: string } | null = null;
vi.mock("@/lib/planner/use-planner-selection", () => ({
  usePlannerSelection: () => ({
    selection: mockSelection,
    setSelection: vi.fn(),
    deselect,
  }),
}));

let escapeOwned = false;
vi.mock("@/lib/planner/escape-ownership", () => ({
  isEscapeOwnedByNestedOverlay: () => escapeOwned,
}));

import { AdaptivePanel } from "./adaptive-panel";

const TASK_ID = "11111111-1111-1111-1111-111111111111";
const MEMBER_ID = "33333333-3333-3333-3333-333333333333";
const PHASE_ID = "22222222-2222-2222-2222-222222222222";

const TASK_FIXTURE: PlannerTask = {
  id: TASK_ID,
  instanceId: "i1",
  phaseId: null,
  parentTaskId: null,
  title: "Draft creative brief",
  description: null,
  startDate: "2026-07-01",
  endDate: "2026-07-05",
  durationDays: 4,
  status: "in_progress",
  priority: "high",
  assigneeUserId: null,
  assigneeRole: null,
  sortOrder: 0,
  updatedAt: "2026-07-01T00:00:00.000Z",
};

function taskSelection(overrides: { canUpdateTasks?: boolean } = {}) {
  return {
    ok: true as const,
    data: {
      kind: "task" as const,
      task: TASK_FIXTURE,
      canUpdateTasks: overrides.canUpdateTasks ?? false,
      assignees: [] as { userId: string; displayName: string }[],
    },
  };
}

const MEMBER_FIXTURE: PlannerMember = {
  id: MEMBER_ID,
  instanceId: "i1",
  userId: "u1",
  role: "manager",
  permissions: null,
  displayName: "Maya",
};

const PHASE_FIXTURE: PlannerPhase = {
  id: PHASE_ID,
  workflowId: "wf1",
  slug: "casting",
  name: "Casting",
  orderIndex: 2,
  defaultDurationDays: 3,
  gateType: "approval",
  requiredRole: "manager",
};

/** Small probe rendering the real IntelligenceDetailContext value, so tests
 * assert against exactly what AdaptivePanel publishes — no mocking of the
 * context this ticket is explicitly told not to touch. */
function DetailProbe() {
  const { detail } = useIntelligenceDetail();
  return <div data-testid="detail-probe">{detail}</div>;
}

function renderPanel(instanceId = "i1") {
  return render(
    <IntelligenceDetailProvider>
      <AdaptivePanel instanceId={instanceId} />
      <DetailProbe />
    </IntelligenceDetailProvider>,
  );
}

beforeEach(() => {
  resolvePlannerSelectionAction.mockReset();
  deselect.mockClear();
  mockSelection = null;
  escapeOwned = false;
});

afterEach(() => cleanup());

describe("AdaptivePanel — renders null itself (no DOM presence)", () => {
  it("has zero DOM presence of its own", () => {
    mockSelection = null;
    const { container } = render(
      <IntelligenceDetailProvider>
        <AdaptivePanel instanceId="i1" />
      </IntelligenceDetailProvider>,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("AdaptivePanel — task selection", () => {
  it("resolves a valid task selection and publishes planner-detail-task", async () => {
    mockSelection = { type: "task", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue(taskSelection());

    renderPanel();

    expect(await screen.findByTestId("planner-detail-task")).toBeDefined();
    expect(screen.getByText("Draft creative brief")).toBeDefined();
    expect(screen.queryByTestId("planner-detail-member")).toBeNull();
    expect(deselect).not.toHaveBeenCalled();
  });
});

describe("AdaptivePanel — member selection", () => {
  it("resolves a valid member selection and publishes planner-detail-member", async () => {
    mockSelection = { type: "member", id: MEMBER_ID };
    resolvePlannerSelectionAction.mockResolvedValue({ ok: true, data: { kind: "member", member: MEMBER_FIXTURE } });

    renderPanel();

    expect(await screen.findByTestId("planner-detail-member")).toBeDefined();
    expect(screen.getByText("Maya")).toBeDefined();
    expect(screen.queryByTestId("planner-detail-task")).toBeNull();
  });
});

describe("AdaptivePanel — phase selection", () => {
  it("resolves a valid phase selection and publishes planner-detail-phase with its tasks", async () => {
    mockSelection = { type: "phase", id: PHASE_ID };
    resolvePlannerSelectionAction.mockResolvedValue({
      ok: true,
      data: { kind: "phase", phase: PHASE_FIXTURE, tasks: [TASK_FIXTURE] },
    });

    renderPanel();

    expect(await screen.findByTestId("planner-detail-phase")).toBeDefined();
    expect(screen.getByText("Casting")).toBeDefined();
    expect(screen.getByText(/requires Manager/)).toBeDefined();
    expect(screen.getByText(/Tasks \(1\)/)).toBeDefined();
    expect(screen.queryByTestId("planner-detail-task")).toBeNull();
    expect(deselect).not.toHaveBeenCalled();
  });
});

describe("AdaptivePanel — fails closed to Intelligence mode", () => {
  it("unknown type: falls back, auto-corrects the URL with replace, no detail rendered", async () => {
    mockSelection = { type: "brand", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue({ ok: false });

    renderPanel();

    await vi.waitFor(() => expect(deselect).toHaveBeenCalledWith({ replace: true }));
    expect(screen.queryByTestId("planner-detail-task")).toBeNull();
    expect(screen.queryByTestId("planner-detail-member")).toBeNull();
  });

  it("not-found id: falls back, auto-corrects the URL with replace, no detail rendered", async () => {
    mockSelection = { type: "task", id: "does-not-exist" };
    resolvePlannerSelectionAction.mockResolvedValue({ ok: false });

    renderPanel();

    await vi.waitFor(() => expect(deselect).toHaveBeenCalledWith({ replace: true }));
    expect(screen.queryByTestId("planner-detail-task")).toBeNull();
  });

  it("unknown phase id: falls back, auto-corrects the URL with replace, no detail rendered", async () => {
    mockSelection = { type: "phase", id: PHASE_ID };
    resolvePlannerSelectionAction.mockResolvedValue({ ok: false });

    renderPanel();

    await vi.waitFor(() => expect(deselect).toHaveBeenCalledWith({ replace: true }));
    expect(screen.queryByTestId("planner-detail-phase")).toBeNull();
  });

  it("null selection: publishes null immediately, no resolve call at all", () => {
    mockSelection = null;

    renderPanel();

    expect(resolvePlannerSelectionAction).not.toHaveBeenCalled();
    expect(screen.queryByTestId("planner-detail-task")).toBeNull();
    expect(screen.queryByTestId("planner-detail-member")).toBeNull();
  });
});

describe("AdaptivePanel — exactly one tree at a time", () => {
  it("never has both a task testid and a member testid present simultaneously", async () => {
    mockSelection = { type: "task", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue(taskSelection());

    renderPanel();
    await screen.findByTestId("planner-detail-task");

    const hasTask = screen.queryByTestId("planner-detail-task") !== null;
    const hasMember = screen.queryByTestId("planner-detail-member") !== null;
    expect(hasTask && hasMember).toBe(false);
    expect(hasTask).toBe(true);
  });

  it("passes canUpdateTasks so authorized users see the edit form", async () => {
    mockSelection = { type: "task", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue(taskSelection({ canUpdateTasks: true }));

    renderPanel();

    expect(await screen.findByTestId("planner-task-save")).toBeDefined();
    expect(screen.getByTestId("planner-detail-task").getAttribute("data-readonly")).toBe("false");
  });
});

describe("AdaptivePanel — Escape key handling", () => {
  it("does NOT call deselect when a nested overlay owns Escape", () => {
    mockSelection = { type: "task", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue(taskSelection());
    escapeOwned = true;

    renderPanel();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(deselect).not.toHaveBeenCalled();
  });

  it("calls deselect on Escape when no overlay owns it and a selection is present", () => {
    mockSelection = { type: "task", id: TASK_ID };
    resolvePlannerSelectionAction.mockResolvedValue(taskSelection());
    escapeOwned = false;

    renderPanel();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(deselect).toHaveBeenCalledTimes(1);
    expect(deselect).toHaveBeenCalledWith();
  });

  it("does nothing on Escape when there is no selection", () => {
    mockSelection = null;
    escapeOwned = false;

    renderPanel();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(deselect).not.toHaveBeenCalled();
  });
});
