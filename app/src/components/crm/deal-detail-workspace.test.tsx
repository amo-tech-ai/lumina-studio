// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./deal-detail-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./deal-stage-control.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-detail-shell.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./activity-timeline.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { DealDetailWorkspace } from "./deal-detail-workspace";
import type { DealDetailPayload } from "@/lib/crm/get-deal-detail";
import type { ActivityRow, DealRow } from "@/lib/crm/queries";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
    expected_close_date: "2026-04-20",
    closed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function payload(overrides: Partial<DealDetailPayload> = {}): DealDetailPayload {
  return {
    deal: deal(),
    companyName: "Acme Athletic",
    shootName: null,
    companyBrandId: null,
    activities: [],
    ...overrides,
  };
}

describe("DealDetailWorkspace", () => {
  it("renders real header data — company, value, stage — with a derived title, not a fabricated deal name", () => {
    render(<DealDetailWorkspace data={payload()} fetchError={null} />);
    // crm_deals has no name/title column — the derived title falls back to a company-based label.
    expect(screen.getByRole("heading", { name: "Acme Athletic deal" })).toBeDefined();
    // £8,000 appears twice by design — header mono value + Overview grid Value field (matches DC).
    expect(screen.getAllByText("£8,000").length).toBe(2);
    expect(screen.getAllByText("Proposal").length).toBeGreaterThan(0);
  });

  it("uses the linked shoot's real name as the title when one exists", () => {
    render(
      <DealDetailWorkspace
        data={payload({ deal: deal({ shoot_id: "s1" }), shootName: "SS26 Editorial" })}
        fetchError={null}
      />,
    );
    expect(screen.getByRole("heading", { name: "SS26 Editorial" })).toBeDefined();
  });

  it('shows "Not linked" for an honestly-null shoot, never a fake link', () => {
    render(<DealDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByText("Not linked")).toBeDefined();
  });

  it("does not render a Primary contact field — crm_deals has no such column", () => {
    render(<DealDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.queryByText(/Primary contact/i)).toBeNull();
  });

  it("shows an honest empty activity state when there is none", () => {
    render(<DealDetailWorkspace data={payload({ activities: [] })} fetchError={null} />);
    expect(screen.getByText("No activity yet")).toBeDefined();
  });

  it("renders real activity rows when present", () => {
    const activity: ActivityRow = {
      id: "a1",
      org_id: "org-1",
      company_id: null,
      contact_id: null,
      deal_id: "d1",
      type: "note",
      body: "Sent proposal",
      due_at: null,
      completed_at: null,
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    render(<DealDetailWorkspace data={payload({ activities: [activity] })} fetchError={null} />);
    expect(screen.getByText("Sent proposal")).toBeDefined();
  });

  it("shows the Won banner with a real brand link only when the company actually has one", () => {
    render(
      <DealDetailWorkspace
        data={payload({ deal: deal({ stage: "won" }), companyBrandId: "brand-1" })}
        fetchError={null}
      />,
    );
    expect(screen.getByText("Converted to brand")).toBeDefined();
    expect(screen.getByText("View brand")).toBeDefined();
  });

  it("shows an honest 'not yet linked' Won state instead of a fake brand link when brand_id is null", () => {
    render(<DealDetailWorkspace data={payload({ deal: deal({ stage: "won" }) })} fetchError={null} />);
    expect(screen.getByText("Won — not yet linked to a brand")).toBeDefined();
    expect(screen.queryByText("View brand")).toBeNull();
  });

  it("shows a retryable ErrorState instead of the workspace when the fetch failed", () => {
    render(<DealDetailWorkspace data={null} fetchError="Unable to load this deal. Try again in a moment." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("group", { name: "Deal stage" })).toBeNull();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });
});
