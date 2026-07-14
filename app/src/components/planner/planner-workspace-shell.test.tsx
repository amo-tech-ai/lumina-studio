// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./planner-workspace-shell.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { PlannerWorkspaceShell } from "./planner-workspace-shell";

afterEach(() => cleanup());

describe("PlannerWorkspaceShell", () => {
  it("renders all 4 views in the correct order with real tab semantics", () => {
    render(<PlannerWorkspaceShell />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Timeline", "Kanban", "Calendar", "List"]);
  });

  it("defaults to the Timeline view and shows its placeholder", () => {
    render(<PlannerWorkspaceShell />);

    expect(screen.getByRole("tab", { name: /Timeline/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("planner-workspace-placeholder-timeline")).toBeDefined();
  });

  it("switching to Kanban shows only the Kanban placeholder — AC-A/AC-F", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell />);

    await user.click(screen.getByRole("tab", { name: /Kanban/ }));

    expect(screen.getByRole("tab", { name: /Kanban/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("planner-workspace-placeholder-kanban")).toBeDefined();
    expect(screen.queryByTestId("planner-workspace-placeholder-timeline")).toBeNull();
  });

  it("every view switches to its own stable, distinct placeholder id — AC-F stable extension points", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell />);

    for (const label of ["Timeline", "Kanban", "Calendar", "List"]) {
      await user.click(screen.getByRole("tab", { name: new RegExp(label) }));
      expect(screen.getByTestId(`planner-workspace-placeholder-${label.toLowerCase()}`)).toBeDefined();
    }
  });

  it("tabs are keyboard-operable via arrow keys — AC-D", async () => {
    const user = userEvent.setup();
    render(<PlannerWorkspaceShell />);

    const timelineTab = screen.getByRole("tab", { name: /Timeline/ });
    timelineTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Kanban/ }));
  });

  it("renders no nested aside/Sheet/Drawer — AC-B shell boundary", () => {
    const { container } = render(<PlannerWorkspaceShell />);
    expect(container.querySelectorAll("aside").length).toBe(0);
  });

  it("switching tabs does not remount the shell — AC-G, the h1/heading persists across a switch", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlannerWorkspaceShell />);
    const headingBefore = container.querySelector("h1");

    await user.click(screen.getByRole("tab", { name: /Calendar/ }));

    expect(screen.getByTestId("planner-workspace-placeholder-calendar")).toBeDefined();
    expect(container.querySelector("h1")).toBe(headingBefore);
  });
});
