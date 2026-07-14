// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./company-detail-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-detail-shell.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-avatar.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./activity-timeline.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { CompanyDetailWorkspace } from "./company-detail-workspace";
import type { CompanyDetailPayload } from "@/lib/crm/get-company-detail";
import type { ActivityRow, CompanyRow, ContactRow, DealRow } from "@/lib/crm/queries";

afterEach(() => cleanup());

function company(overrides: Partial<CompanyRow> = {}): CompanyRow {
  return {
    id: "c1",
    org_id: "org-1",
    brand_id: null,
    name: "Acme Athletic",
    domain: "acme.com",
    industry: "Sportswear",
    owner: "owner-1",
    source: null,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function contact(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "p1",
    org_id: "org-1",
    company_id: "c1",
    profile_id: null,
    name: "Dana Vale",
    email: [],
    phone: [],
    role_title: "Brand Director",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

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

function payload(overrides: Partial<CompanyDetailPayload> = {}): CompanyDetailPayload {
  return {
    company: company(),
    ownerName: "S. Kim",
    contacts: [],
    deals: [],
    activities: [],
    ...overrides,
  };
}

describe("CompanyDetailWorkspace", () => {
  it("renders the header with real data — no fabricated kind chip or logo", () => {
    render(<CompanyDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByRole("heading", { name: "Acme Athletic" })).toBeDefined();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("acme.com")).toBeDefined();
    expect(screen.getByText("Owner S. Kim")).toBeDefined();
    expect(screen.getAllByText("Not yet a brand").length).toBeGreaterThan(0);
  });

  it("shows an Open brand link only when brand_id is set", () => {
    render(<CompanyDetailWorkspace data={payload({ company: company({ brand_id: "brand-1" }) })} fetchError={null} />);
    expect(screen.getAllByText("Open brand").length).toBeGreaterThan(0);
    expect(screen.queryByText("Not yet a brand")).toBeNull();
  });

  it("switches tabs on click, keeping only one panel's content visible", () => {
    render(
      <CompanyDetailWorkspace
        data={payload({ contacts: [contact()], deals: [deal()] })}
        fetchError={null}
      />,
    );
    expect(screen.queryByText("Dana Vale")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Contacts/ }));
    expect(screen.getByText("Dana Vale")).toBeDefined();
    expect(screen.queryByText(/Closes/)).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Deals/ }));
    expect(screen.getByText(/Closes/)).toBeDefined();
    expect(screen.queryByText("Dana Vale")).toBeNull();
  });

  it("supports roving-tabindex keyboard navigation (WAI-ARIA APG Tabs pattern)", () => {
    render(<CompanyDetailWorkspace data={payload()} fetchError={null} />);
    const tabs = screen.getAllByRole("tab");
    const [overview, contacts] = tabs;
    const activity = tabs[tabs.length - 1];

    expect(overview.tabIndex).toBe(0);
    expect(contacts.tabIndex).toBe(-1);

    fireEvent.keyDown(overview, { key: "ArrowRight" });
    expect(contacts.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(contacts);
    expect(overview.tabIndex).toBe(-1);
    expect(contacts.tabIndex).toBe(0);

    fireEvent.keyDown(contacts, { key: "ArrowLeft" });
    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(overview);

    fireEvent.keyDown(overview, { key: "End" });
    expect(activity.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(activity);

    fireEvent.keyDown(activity, { key: "Home" });
    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(overview);

    // ArrowLeft from the first tab wraps to the last.
    fireEvent.keyDown(overview, { key: "ArrowLeft" });
    expect(activity.getAttribute("aria-selected")).toBe("true");
  });

  it("renders deals with real stage/value/close date — no fabricated deal name", () => {
    render(<CompanyDetailWorkspace data={payload({ deals: [deal()] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Deals/ }));
    expect(screen.getByText("Proposal")).toBeDefined();
    expect(screen.getByText("£8,000")).toBeDefined();
  });

  it("shows an honest EmptyState for a tab with no data", () => {
    render(<CompanyDetailWorkspace data={payload()} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Contacts/ }));
    expect(screen.getByText("No contacts yet")).toBeDefined();
  });

  it("renders ActivityTimeline in the Activity tab", () => {
    const activity: ActivityRow = {
      id: "a1",
      org_id: "org-1",
      company_id: "c1",
      contact_id: null,
      deal_id: null,
      type: "note",
      body: "Intro note",
      due_at: null,
      completed_at: null,
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    render(<CompanyDetailWorkspace data={payload({ activities: [activity] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Activity/ }));
    expect(screen.getByText("Intro note")).toBeDefined();
  });

  it("shows a retryable ErrorState instead of the workspace when the fetch failed", () => {
    render(<CompanyDetailWorkspace data={null} fetchError="Unable to load this company. Try again in a moment." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("tablist")).toBeNull();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });
});
