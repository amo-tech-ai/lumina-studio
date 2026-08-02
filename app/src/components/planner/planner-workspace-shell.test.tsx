// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./planner-workspace-shell.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

// IPI-551 — the shell now mounts AdaptivePanel. Its own behavior (URL
// resolution, Escape handling, context publishing) is fully covered by
// adaptive-panel.test.tsx; stubbed here so this file stays focused on tab
// switching and doesn't need an IntelligenceDetailProvider/router context.
vi.mock("./adaptive-panel", () => ({
  AdaptivePanel: () => null,
}));

import { PlannerWorkspaceShell } from "./planner-workspace-shell";

afterEach(() => cleanup());

const INSTANCE_ID = "i1";

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
});
