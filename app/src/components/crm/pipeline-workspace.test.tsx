// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./pipeline-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { PipelineWorkspace } from "./pipeline-workspace";
import type { DealRow } from "@/lib/crm/queries";

const NOW = new Date("2026-07-08T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

function deal(overrides: Partial<DealRow> = {}): DealRow {
  return {
    id: "d1",
    org_id: "org-1",
    company_id: "c1",
    stage: "proposal",
    value: 8000,
    currency: "GBP",
    shoot_id: null,
    campaign_id: null,
    owner: null,
    expected_close_date: "2026-08-15",
    closed_at: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z", // 1 day before NOW
    ...overrides,
  };
}

const COMPANY_NAMES = { c1: "Acme Athletic", c2: "Vega Studios" };

describe("PipelineWorkspace", () => {
  it("renders all 6 stage columns with correct labels", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} fetchError={null} />);
    for (const label of ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("renders a deal card with resolved company name, real value, and relative update time", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} fetchError={null} />);
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    // £8,000 appears twice: the card value and the (single-deal) column total.
    expect(screen.getAllByText("£8,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Updated 1d ago")).toBeDefined();
  });

  it("renders the pipeline total as the sum of all deal values", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "d1", value: 8000 }), deal({ id: "d2", stage: "lead", value: 2000 })]}
        companyNames={COMPANY_NAMES}
        fetchError={null}
      />,
    );
    expect(screen.getByText("£10,000")).toBeDefined();
  });

  it("flags a stale, still-open deal as at risk, but never a won/lost deal", () => {
    render(
      <PipelineWorkspace
        deals={[
          deal({ id: "stale", updated_at: "2026-06-01T00:00:00.000Z" }), // 37 days ago
          deal({ id: "fresh", updated_at: "2026-07-07T00:00:00.000Z" }), // 1 day ago
          deal({ id: "stale-but-won", stage: "won", updated_at: "2026-06-01T00:00:00.000Z" }),
        ]}
        companyNames={COMPANY_NAMES}
        fetchError={null}
      />,
    );
    expect(screen.getAllByText("At risk")).toHaveLength(1);
  });

  it("'At risk only' toggle narrows the board to at-risk deals", () => {
    render(
      <PipelineWorkspace
        deals={[
          deal({ id: "stale", company_id: "c1", updated_at: "2026-06-01T00:00:00.000Z" }),
          deal({ id: "fresh", company_id: "c2", updated_at: "2026-07-07T00:00:00.000Z" }),
        ]}
        companyNames={COMPANY_NAMES}
        fetchError={null}
      />,
    );
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.getByText("Vega Studios")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "At risk only" }));
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.queryByText("Vega Studios")).toBeNull();
  });

  it("shows a locked badge on Won and Lost columns only", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} fetchError={null} />);
    expect(screen.getAllByText("Enter via approval only")).toHaveLength(2);
  });

  it("links a deal card to the existing pipeline/[id] route", () => {
    render(<PipelineWorkspace deals={[deal({ id: "d-42" })]} companyNames={COMPANY_NAMES} fetchError={null} />);
    const link = screen.getByText("Acme Athletic").closest("a");
    expect(link?.getAttribute("href")).toBe("/app/crm/pipeline/d-42");
  });

  it("shows an honest EmptyState when there are zero deals — not a fabricated pipeline", () => {
    render(<PipelineWorkspace deals={[]} companyNames={{}} fetchError={null} />);
    expect(screen.getByText("No deals yet")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Pipeline" })).toBeNull();
  });

  it("shows a retryable ErrorState instead of the board when the fetch failed", () => {
    render(<PipelineWorkspace deals={[]} companyNames={{}} fetchError="Unable to load the pipeline." />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });
});
