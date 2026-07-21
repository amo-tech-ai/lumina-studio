// @vitest-environment jsdom
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("./pipeline-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./deal-stage-control.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { PipelineWorkspace } from "./pipeline-workspace";
import type { DealRow } from "@/lib/crm/queries";

// Passed explicitly as the `now` prop (never Date.now() inside the
// component) — see the hydration-mismatch fix in pipeline-workspace.tsx.
const NOW = new Date("2026-07-08T12:00:00.000Z").getTime();

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
const OWNER_NAMES = { u1: "Alex Owner" };

function stubMatchMedia(matches: boolean) {
  return vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches,
    media: String(query),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }) as unknown as MediaQueryList);
}

describe("PipelineWorkspace", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders all 6 stage columns with correct labels", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />);
    for (const label of ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]) {
      // Column headers + DealStageControl buttons both use these labels.
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("renders a deal card with resolved company name, real value, and relative update time", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />);
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    // Exactly 3: the header total, the card value, and the (single-deal)
    // Proposal column total — all identical since there's only one deal.
    expect(screen.getAllByText("£8,000")).toHaveLength(3);
    expect(screen.getByText("Updated 1d ago")).toBeDefined();
  });

  it("renders the pipeline total as the sum of all deal values when every deal shares one currency", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "d1", value: 8000 }), deal({ id: "d2", stage: "lead", value: 2000 })]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    expect(screen.getByText("£10,000")).toBeDefined();
  });

  it("groups the total by currency instead of silently summing mismatched currencies", () => {
    render(
      <PipelineWorkspace
        deals={[
          deal({ id: "gbp", value: 8000, currency: "GBP" }),
          deal({ id: "usd", stage: "lead", value: 5000, currency: "USD" }),
        ]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    expect(screen.getByText("£8,000 + $5,000")).toBeDefined();
  });

  it("excludes null-value deals from totals instead of coercing them to 0", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "unknown-value", value: null })]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    // The card itself honestly shows "—" for the unknown value (formatMoney's
    // own null handling); the header total must also read "—", not a false,
    // precise-looking "$0" implying the value is known and zero.
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.getByText("—", { selector: "p.total" })).toBeDefined();
  });

  it("shows a dash (not a blank line) for the header total when the at-risk filter matches zero deals", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "fresh", updated_at: "2026-07-07T00:00:00.000Z" })]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "At risk only" }));
    expect(screen.getByText(/0 deals/)).toBeDefined();
    expect(screen.getByText("—", { selector: "p.total" })).toBeDefined();
  });

  it("flags a stale, still-open deal as at risk, but never a won/lost deal", () => {
    render(
      <PipelineWorkspace
        deals={[
          deal({ id: "stale", updated_at: "2026-06-01T00:00:00.000Z" }), // 37 days before NOW
          deal({ id: "fresh", updated_at: "2026-07-07T00:00:00.000Z" }), // 1 day before NOW
          deal({ id: "stale-but-won", stage: "won", updated_at: "2026-06-01T00:00:00.000Z" }),
        ]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
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
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.getByText("Vega Studios")).toBeDefined();
    expect(screen.getByText(/2 deals/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "At risk only" }));
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.queryByText("Vega Studios")).toBeNull();
    // Header count must reflect the filtered set, not silently keep showing
    // the unfiltered total (the bug this test now guards against).
    expect(screen.getByText(/1 deal\b/)).toBeDefined();
  });

  it("shows the real deal count and an honest approval-gate hint in the subtitle", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "d1" }), deal({ id: "d2" })]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    expect(screen.getByText(/2 deals/)).toBeDefined();
    expect(screen.getByText("Won / Lost require approval")).toBeDefined();
  });

  it("enables an Owner select populated from ownerNames", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ owner: "u1" })]}
        companyNames={COMPANY_NAMES}
        ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    const ownerSelect = screen.getByRole("combobox", { name: "Owner" });
    expect(ownerSelect.hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("option", { name: "Alex Owner" })).toBeDefined();
  });

  it("filters the board by owner", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "d1", owner: "u1" }), deal({ id: "d2", owner: null, company_id: "c2" })]}
        companyNames={COMPANY_NAMES}
        ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Owner" }), { target: { value: "u1" } });
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.queryByText("Vega Studios")).toBeNull();
  });

  it("renders DealStageControl on open-stage cards", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ stage: "lead" })]}
        companyNames={COMPANY_NAMES}
        ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    expect(screen.getByRole("group", { name: "Deal stage" })).toBeDefined();
  });

  it("shows a dash for a column with no deals, rather than omitting the total line", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />);
    // Proposal (this deal's stage) has a real total; the other 5 stages are
    // empty and must each show exactly one "—" total.
    expect(screen.getAllByText("—")).toHaveLength(5);
  });

  it("renders each stage money total inside the column header (SCR-30), not below the cards", () => {
    const { container } = render(
      <PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />,
    );
    const headers = container.querySelectorAll(".columnHeader");
    expect(headers).toHaveLength(6);
    for (const header of headers) {
      expect(header.querySelector(".columnTotal")).not.toBeNull();
    }
    for (const col of container.querySelectorAll(".column")) {
      const orphanTotals = [...col.children].filter((el) => el.classList.contains("columnTotal"));
      expect(orphanTotals).toHaveLength(0);
    }
  });

  it("uses native details accordion with exclusive name on narrow viewports (IPI-572)", async () => {
    stubMatchMedia(true);

    const { container } = render(
      <PipelineWorkspace
        deals={[deal({ stage: "proposal" }), deal({ id: "d2", stage: "lead", value: 1000 })]}
        companyNames={COMPANY_NAMES}
        ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll("details[name='crm-pipeline']")).toHaveLength(6);
    });

    expect(container.querySelector("[data-pipeline-layout='accordion']")).not.toBeNull();

    const lead = container.querySelector("details[data-stage='lead']") as HTMLDetailsElement;
    const proposal = container.querySelector("details[data-stage='proposal']") as HTMLDetailsElement;

    // Seed opens first stage with deals (Lead).
    await waitFor(() => {
      expect(lead.open).toBe(true);
    });
    expect(proposal.open).toBe(false);

    for (const el of container.querySelectorAll("details[name='crm-pipeline']")) {
      expect(el.getAttribute("name")).toBe("crm-pipeline");
    }
    expect(lead.querySelector("summary.columnHeader")).not.toBeNull();
    expect(lead.querySelector(".cards")).not.toBeNull();
  });

  it("shows a locked badge on Won and Lost columns only", () => {
    render(<PipelineWorkspace deals={[deal()]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />);
    expect(screen.getAllByText("Enter via approval only")).toHaveLength(2);
  });

  it("links a deal card to the existing pipeline/[id] route", () => {
    render(
      <PipelineWorkspace deals={[deal({ id: "d-42" })]} companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES} fetchError={null} now={NOW} />,
    );
    const link = screen.getByText("Acme Athletic").closest("a");
    expect(link?.getAttribute("href")).toBe("/app/crm/pipeline/d-42");
  });

  it("buckets an unrecognized stage value into Lead instead of silently dropping the deal", () => {
    render(
      <PipelineWorkspace
        deals={[deal({ id: "weird", stage: "backfilled-legacy-stage" })]}
        companyNames={COMPANY_NAMES} ownerNames={OWNER_NAMES}
        fetchError={null}
        now={NOW}
      />,
    );
    // Still visible (in Lead), still counted — not vanished from the board.
    expect(screen.getByText("Acme Athletic")).toBeDefined();
  });

  it("shows an honest EmptyState when there are zero deals — not a fabricated pipeline", () => {
    render(<PipelineWorkspace deals={[]} companyNames={{}} ownerNames={{}} fetchError={null} now={NOW} />);
    expect(screen.getByText("No deals yet")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Pipeline" })).toBeNull();
  });

  it("shows a retryable ErrorState instead of the board when the fetch failed", () => {
    render(<PipelineWorkspace deals={[]} companyNames={{}} ownerNames={{}} fetchError="Unable to load the pipeline." now={NOW} />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });
});
