/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShootDetailBudgetTab } from "@/components/shoot/detail/shoot-detail-budget-tab";
import { ShootDetailEmpty } from "@/components/shoot/detail/shoot-detail-empty";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";

vi.mock("../shoot-detail.module.css", () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

afterEach(() => cleanup());

const basePayload: ShootDetailPayload = {
  shoot: {
    id: "s1",
    name: "Spring",
    status: "planning",
    brief: null,
    target_channels: [],
    estimated_budget: 15000,
    actual_cost: 9300,
    currency: "USD",
    budget_breakdown: { studio: 5000, talent: 4300 },
    start_date: null,
    end_date: null,
    location: null,
    dna_score: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    brand_id: "b1",
  },
  brand: { id: "b1", name: "Acme" },
  deliverables: [],
  shots: [],
  assets: [],
  crew: [],
  approvals: [],
  activity: [],
};

describe("ShootDetailBudgetTab", () => {
  it("shows budget used when data exists", () => {
    render(<ShootDetailBudgetTab data={basePayload} />);
    expect(screen.getByText(/Budget used/i)).toBeTruthy();
    expect(screen.getByText(/62%/)).toBeTruthy();
  });

  it("shows empty state when no budget", () => {
    render(
      <ShootDetailBudgetTab
        data={{
          ...basePayload,
          shoot: {
            ...basePayload.shoot,
            estimated_budget: null,
            actual_cost: null,
            budget_breakdown: null,
          },
        }}
      />,
    );
    expect(screen.getByText(/No budget recorded/i)).toBeTruthy();
  });
});

describe("ShootDetailEmpty", () => {
  it("renders message", () => {
    render(<ShootDetailEmpty message="No crew assigned yet." />);
    expect(screen.getByText(/No crew assigned yet/i)).toBeTruthy();
  });
});
