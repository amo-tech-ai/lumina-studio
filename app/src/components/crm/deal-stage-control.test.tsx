// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./deal-stage-control.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

import { DealStageControl } from "./deal-stage-control";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DealStageControl", () => {
  it("renders all 6 stages with the current one active", () => {
    render(<DealStageControl stage="proposal" onStageChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Deal stage" })).toBeDefined();
    for (const label of ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("calls onStageChange immediately for a non-terminal move — no approval gate", () => {
    const onStageChange = vi.fn();
    render(<DealStageControl stage="lead" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Negotiation"));
    expect(onStageChange).toHaveBeenCalledWith("negotiation");
    // No approval dialog for a non-terminal move.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the approval gate for Won instead of writing immediately", () => {
    const onStageChange = vi.fn();
    render(<DealStageControl stage="negotiation" onStageChange={onStageChange} />);
    fireEvent.click(screen.getByText("Won"));
    expect(onStageChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /Mark this deal as Won/ })).toBeDefined();
  });

  it("Cancel closes the Won approval gate with no write", () => {
    render(<DealStageControl stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
    // Back to the stage row.
    expect(screen.getByRole("group", { name: "Deal stage" })).toBeDefined();
  });

  it("Approve on Won never optimistically succeeds — shows an honest error and reverts", () => {
    render(<DealStageControl stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    fireEvent.click(screen.getByText(/Approve · Mark Won/));
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("pending IPI-367"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the approval gate for Lost and Cancel reverts with no write", () => {
    render(<DealStageControl stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Lost"));
    expect(screen.getByRole("dialog", { name: /Mark this deal as Lost/ })).toBeDefined();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Approve on Lost also shows an honest error, never a fake success", () => {
    render(<DealStageControl stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Lost"));
    fireEvent.click(screen.getByText(/Approve · Mark Lost/));
    expect(toastError).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape closes the approval gate, same as Cancel", () => {
    render(<DealStageControl stage="negotiation" onStageChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Won"));
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders nothing (no row, no gate) once terminal and settled", () => {
    const { container } = render(<DealStageControl stage="won" onStageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
