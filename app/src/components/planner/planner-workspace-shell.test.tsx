// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PlannerTask } from "@/lib/planner/types";

vi.mock("./planner-workspace-shell.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

vi.mock("./now-next-bar.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

// IPI-551 — the shell now mounts AdaptivePanel. Its own behavior (URL
// resolution, Escape handling, context publishing) is fully covered by
// adaptive-panel.test.tsx; stubbed here so this file stays focused on tab
// switching and doesn't need an IntelligenceDetailProvider/router context.
vi.mock("./adaptive-panel", () => ({
  AdaptivePanel: () => null,
}));

const setViewConfigAction = vi.fn();
vi.mock("@/app/(operator)/app/planner/[instanceId]/actions", () => ({
  setViewConfigAction: (...args: unknown[]) => setViewConfigAction(...args),
}));

const setSelection = vi.fn();
vi.mock("@/lib/planner/use-planner-selection", () => ({
  usePlannerSelection: () => ({
    selection: null,
    setSelection,
    deselect: vi.fn(),
  }),
}));

import { PlannerWorkspaceShell } from "./planner-workspace-shell";

afterEach(() => {
  cleanup();
  setSelection.mockClear();
  setViewConfigAction.mockReset();
});

beforeEach(() => {
  setViewConfigAction.mockResolvedValue({ ok: true, data: { instanceId: INSTANCE_ID } });
});

const INSTANCE_ID = "i1";
const VIEWER = "user-viewer";
const TODAY = "2026-03-12";

const TASK_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeTask(overrides: Partial<PlannerTask> = {}): PlannerTask {
  return {
    id: TASK_ID,
    instanceId: INSTANCE_ID,
    phaseId: "ph-1",
    parentTaskId: null,
    title: "Item delivery",
    description: null,
    startDate: "2026-03-10",
    endDate: "2026-03-14",
    durationDays: 4,
    status: "in_progress",
    priority: "medium",
    assigneeUserId: VIEWER,
    assigneeRole: null,
    sortOrder: 0,
    ...overrides,
  };
}

describe("PlannerWorkspaceShell", () => {
  it("renders all 4 views in the correct order with real tab semantics", () => {
    render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Timeline", "Kanban", "Calendar", "List"]);
  });

  it("defaults to the Timeline view and shows its placeholder", () => {
    render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

    expect(screen.getByRole("tab", { name: /Timeline/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("planner-workspace-placeholder-timeline")).toBeDefined();
  });

  it("switching to Kanban shows only the Kanban placeholder — AC-A/AC-F", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

    await user.click(screen.getByRole("tab", { name: /Kanban/ }));

    expect(screen.getByRole("tab", { name: /Kanban/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("planner-workspace-placeholder-kanban")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-timeline")).toBeNull();
  });

  it("every view switches to its own stable, distinct placeholder id — AC-F stable extension points", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

    for (const label of ["Timeline", "Kanban", "Calendar", "List"]) {
      await user.click(screen.getByRole("tab", { name: new RegExp(label) }));
      expect(screen.getByTestId(`planner-workspace-placeholder-${label.toLowerCase()}`)).toBeDefined();
    }
  });

  it("tabs are keyboard-operable via arrow keys — AC-D", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

    const timelineTab = screen.getByRole("tab", { name: /Timeline/ });
    timelineTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Kanban/ }));
  });

  it("renders no nested aside/Sheet/Drawer — AC-B shell boundary", () => {
    const { container } = render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);
    expect(container.querySelectorAll("aside").length).toBe(0);
  });

  it("switching tabs does not remount the shell — AC-G, the h1/heading persists across a switch", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);
    const headingBefore = container.querySelector("h1");

    await user.click(screen.getByRole("tab", { name: /Calendar/ }));

    expect(screen.getByTestId("planner-workspace-placeholder-calendar")).toBeDefined();
    expect(container.querySelector("h1")).toBe(headingBefore);
  });

  it("renders the server-built Timeline node in the Timeline tab when provided — IPI-579", async () => {
    const user = userEvent.setup();
    render(
      <PlannerWorkspaceShell
        instanceId={INSTANCE_ID}
        timeline={<div data-testid="real-timeline-content">Timeline content</div>}
      />,
    );

    expect(screen.getByTestId("real-timeline-content")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-timeline")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /List/ }));
    expect(screen.queryByTestId("real-timeline-content")).toBeNull();
    expect(screen.getByTestId("planner-workspace-placeholder-list")).toBeDefined();
  });

  it("renders server-built Kanban and List nodes in their tabs — IPI-580", async () => {
    const user = userEvent.setup();
    render(
      <PlannerWorkspaceShell
        instanceId={INSTANCE_ID}
        timeline={<div data-testid="real-timeline-content">Timeline</div>}
        kanban={<div data-testid="real-kanban-content">Kanban</div>}
        list={<div data-testid="real-list-content">List</div>}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /Kanban/ }));
    expect(screen.getByTestId("real-kanban-content")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-kanban")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /List/ }));
    expect(screen.getByTestId("real-list-content")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-list")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Calendar/ }));
    expect(screen.getByTestId("planner-workspace-placeholder-calendar")).toBeDefined();
  });

  it("renders the Calendar node in the Calendar tab when provided — IPI-581", async () => {
    const user = userEvent.setup();
    render(
      <PlannerWorkspaceShell
        instanceId={INSTANCE_ID}
        calendar={<div data-testid="real-calendar-content">Calendar content</div>}
      />,
    );

    expect(screen.getByTestId("planner-workspace-placeholder-timeline")).toBeDefined();

    await user.click(screen.getByRole("tab", { name: /Calendar/ }));
    expect(screen.getByTestId("real-calendar-content")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-calendar")).toBeNull();
  });

  describe("IPI-588 · Now & Next bar", () => {
    const nowNextProps = {
      tasks: [makeTask()],
      viewerId: VIEWER,
      phaseNames: { "ph-1": "Item delivery" },
      today: TODAY,
    };

    it("mounts the bar once above all four views — AC-A", async () => {
      const user = userEvent.setup();
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} {...nowNextProps} />);

      expect(screen.getAllByTestId("planner-now-next-bar")).toHaveLength(1);
      expect(screen.getByText("Item delivery")).toBeDefined();

      for (const label of ["Kanban", "Calendar", "List", "Timeline"]) {
        await user.click(screen.getByRole("tab", { name: new RegExp(label) }));
        expect(screen.getAllByTestId("planner-now-next-bar")).toHaveLength(1);
      }
    });

    it("keeps next-approval honestly empty — no Review CTA (IPI-483) — AC-C/E", () => {
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} {...nowNextProps} />);

      const approval = screen.getByTestId("planner-next-approval-card");
      expect(approval.textContent).toContain("Approvals unavailable");
      expect(approval.textContent).toContain("IPI-483");
      expect(screen.queryByRole("button", { name: /Review/i })).toBeNull();
    });

    it("View selects the task for AdaptivePanel — AC-D", async () => {
      const user = userEvent.setup();
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} {...nowNextProps} />);

      await user.click(screen.getByTestId("planner-now-view"));
      expect(setSelection).toHaveBeenCalledWith({ type: "task", id: TASK_ID });
    });

    it("shows an honest empty Happening now card when nothing matches — AC-E", () => {
      render(
        <PlannerWorkspaceShell
          instanceId={INSTANCE_ID}
          tasks={[makeTask({ status: "todo" })]}
          viewerId={VIEWER}
          today={TODAY}
        />,
      );

      expect(screen.getByText("Nothing assigned to you right now")).toBeDefined();
      expect(screen.queryByTestId("planner-now-view")).toBeNull();
    });

    it("does not mount the bar without the shared payload — AC-G", () => {
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);
      expect(screen.queryByTestId("planner-now-next-bar")).toBeNull();
    });
  });

  describe("IPI-582 setViewConfig persistence", () => {
    it("persists timeline/kanban/calendar switches and skips list", async () => {
      const user = userEvent.setup();
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);

      await user.click(screen.getByRole("tab", { name: /Kanban/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(1));
      expect(setViewConfigAction).toHaveBeenLastCalledWith(INSTANCE_ID, { defaultView: "kanban" });

      await user.click(screen.getByRole("tab", { name: /List/ }));
      expect(screen.getByRole("tab", { name: /List/ }).getAttribute("aria-selected")).toBe("true");
      expect(setViewConfigAction).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("tab", { name: /Calendar/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(2));
      expect(setViewConfigAction).toHaveBeenLastCalledWith(INSTANCE_ID, { defaultView: "calendar" });
    });

    it("no-ops when re-selecting the already-persisted view", async () => {
      const user = userEvent.setup();
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} initialView="kanban" />);

      await user.click(screen.getByRole("tab", { name: /Calendar/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(1));

      await user.click(screen.getByRole("tab", { name: /List/ }));
      await user.click(screen.getByRole("tab", { name: /Calendar/ }));
      // Still one write — Calendar was already the last persisted value.
      expect(setViewConfigAction).toHaveBeenCalledTimes(1);
    });

    it("keeps the session view and shows a warning when persistence fails", async () => {
      const user = userEvent.setup();
      setViewConfigAction.mockResolvedValueOnce({
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: "Your view preference could not be saved." },
      });

      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);
      await user.click(screen.getByRole("tab", { name: /Kanban/ }));

      expect(screen.getByRole("tab", { name: /Kanban/ }).getAttribute("aria-selected")).toBe("true");
      await waitFor(() => expect(screen.getByTestId("planner-view-persist-warning")).toBeDefined());
    });

    it("shows the same warning when setViewConfigAction rejects (transport)", async () => {
      const user = userEvent.setup();
      setViewConfigAction.mockRejectedValueOnce(new Error("network down"));

      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} />);
      await user.click(screen.getByRole("tab", { name: /Kanban/ }));

      expect(screen.getByRole("tab", { name: /Kanban/ }).getAttribute("aria-selected")).toBe("true");
      await waitFor(() => expect(screen.getByTestId("planner-view-persist-warning")).toBeDefined());
    });

    it("supersedes an in-flight preference write when the operator returns to the prior tab", async () => {
      const user = userEvent.setup();
      let resolveKanban: ((value: unknown) => void) | undefined;
      setViewConfigAction
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveKanban = resolve;
            }),
        )
        .mockResolvedValue({ ok: true, data: { instanceId: INSTANCE_ID } });

      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} initialView="timeline" />);

      await user.click(screen.getByRole("tab", { name: /Kanban/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(1));
      expect(setViewConfigAction).toHaveBeenLastCalledWith(INSTANCE_ID, { defaultView: "kanban" });

      // Return to Timeline while Kanban write is still pending — must not no-op.
      await user.click(screen.getByRole("tab", { name: /Timeline/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(2));
      expect(setViewConfigAction).toHaveBeenLastCalledWith(INSTANCE_ID, { defaultView: "timeline" });

      // Stale Kanban success must not become lastPersisted.
      resolveKanban?.({ ok: true, data: { instanceId: INSTANCE_ID } });
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(2));

      await user.click(screen.getByRole("tab", { name: /List/ }));
      await user.click(screen.getByRole("tab", { name: /Timeline/ }));
      // Timeline is the correct last persisted value — no third write.
      expect(setViewConfigAction).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("tab", { name: /Timeline/ }).getAttribute("aria-selected")).toBe("true");
    });

    it("no-ops re-selecting the in-flight target after a session-only detour", async () => {
      const user = userEvent.setup();
      let resolveKanban: ((value: unknown) => void) | undefined;
      setViewConfigAction.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveKanban = resolve;
          }),
      );

      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} initialView="timeline" />);

      await user.click(screen.getByRole("tab", { name: /Kanban/ }));
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(1));

      // List is session-only — must not clear pending kanban.
      await user.click(screen.getByRole("tab", { name: /List/ }));
      await user.click(screen.getByRole("tab", { name: /Kanban/ }));
      // Still one write — kanban was already the in-flight target.
      expect(setViewConfigAction).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("tab", { name: /Kanban/ }).getAttribute("aria-selected")).toBe("true");

      resolveKanban?.({ ok: true, data: { instanceId: INSTANCE_ID } });
      await waitFor(() => expect(setViewConfigAction).toHaveBeenCalledTimes(1));
    });

    it("initializes from initialView (getViewConfig)", () => {
      render(<PlannerWorkspaceShell instanceId={INSTANCE_ID} initialView="calendar" />);
      expect(screen.getByRole("tab", { name: /Calendar/ }).getAttribute("aria-selected")).toBe("true");
    });
  });
});
