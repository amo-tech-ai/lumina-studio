// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/components/shoot/shoot-wizard.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => String(k) }),
}));

import { BudgetApprovalCard } from "./BudgetApprovalCard";

afterEach(() => cleanup());

const BUDGET = { crew: 2000, studio: 1500, equipment: 500, post: 1000, total: 5000 };

describe("BudgetApprovalCard", () => {
  it("renders every line item and the total", () => {
    render(<BudgetApprovalCard budget={BUDGET} override="" onOverrideChange={vi.fn()} />);
    expect(screen.getByText("$2,000")).toBeDefined();
    expect(screen.getByText("$1,500")).toBeDefined();
    expect(screen.getByText("$500")).toBeDefined();
    expect(screen.getByText("$1,000")).toBeDefined();
    expect(screen.getByText("$5,000")).toBeDefined();
    expect(screen.queryByText("Override active")).toBeNull();
  });

  it("typing an override calls onOverrideChange with the raw string", () => {
    const onOverrideChange = vi.fn();
    render(<BudgetApprovalCard budget={BUDGET} override="" onOverrideChange={onOverrideChange} />);
    fireEvent.change(screen.getByLabelText("Override total (optional)"), { target: { value: "4200" } });
    expect(onOverrideChange).toHaveBeenCalledWith("4200");
  });

  it("a positive numeric override replaces the displayed total and shows the active badge", () => {
    render(<BudgetApprovalCard budget={BUDGET} override="4200" onOverrideChange={vi.fn()} />);
    expect(screen.getByText("Override active")).toBeDefined();
    expect(screen.getAllByText("$4,200").length).toBeGreaterThan(0);
  });

  it("a zero or non-numeric override is ignored — total falls back to the computed budget", () => {
    render(<BudgetApprovalCard budget={BUDGET} override="0" onOverrideChange={vi.fn()} />);
    expect(screen.queryByText("Override active")).toBeNull();
    expect(screen.getByText("$5,000")).toBeDefined();
  });
});
