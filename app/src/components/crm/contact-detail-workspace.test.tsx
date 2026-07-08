// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("./contact-detail-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-detail-shell.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-avatar.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./activity-timeline.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ContactDetailWorkspace } from "./contact-detail-workspace";
import type { ContactDetailPayload } from "@/lib/crm/get-contact-detail";
import type { ActivityRow, ContactRow, DealRow } from "@/lib/crm/queries";

afterEach(() => cleanup());

function contact(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "p1",
    org_id: "org-1",
    company_id: "c1",
    profile_id: null,
    name: "Dana Vale",
    email: [{ value: "dana@acme.com", type: "work", primary: true }],
    phone: [],
    role_title: "Brand Director",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as ContactRow;
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

function payload(overrides: Partial<ContactDetailPayload> = {}): ContactDetailPayload {
  return {
    contact: contact(),
    companyName: "Acme Athletic",
    deals: [],
    activities: [],
    ...overrides,
  };
}

describe("ContactDetailWorkspace", () => {
  it("renders the header with real data — name, static Contact badge, role, linked org", () => {
    render(<ContactDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByRole("heading", { name: "Dana Vale" })).toBeDefined();
    expect(screen.getByText("Contact")).toBeDefined();
    expect(screen.getByText("Brand Director")).toBeDefined();
    expect(screen.getByText("Acme Athletic")).toBeDefined();
  });

  it("shows 'No linked organization' when the contact has no company_id — never a raw id or fabricated name", () => {
    render(
      <ContactDetailWorkspace
        data={payload({ contact: contact({ company_id: null }), companyName: null })}
        fetchError={null}
      />,
    );
    expect(screen.getByText("No linked organization")).toBeDefined();
  });

  it("defaults to the Overview tab, showing real email entries with type + Primary badge", () => {
    render(<ContactDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByText("dana@acme.com")).toBeDefined();
    expect(screen.getByText("work")).toBeDefined();
    expect(screen.getByText("Primary")).toBeDefined();
  });

  it("shows an honest empty message for a field group with no entries — no fabricated phone", () => {
    render(<ContactDetailWorkspace data={payload()} fetchError={null} />);
    expect(screen.getByText("No phone on file.")).toBeDefined();
  });

  it("renders email/phone stored as plain strings, not just {value,type,primary} objects (real seed-data shape)", () => {
    render(
      <ContactDetailWorkspace
        data={payload({
          contact: contact({ email: ["maria.lopez@zara.com"], phone: ["+34-91-123-4567"] }),
        })}
        fetchError={null}
      />,
    );
    expect(screen.getByText("maria.lopez@zara.com")).toBeDefined();
    expect(screen.getByText("+34-91-123-4567")).toBeDefined();
  });

  it("switches tabs on click, keeping only one panel's content visible", () => {
    render(<ContactDetailWorkspace data={payload({ deals: [deal()] })} fetchError={null} />);
    expect(screen.queryByText(/Closes/)).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Deals/ }));
    expect(screen.getByText(/Closes/)).toBeDefined();
    expect(screen.queryByText("dana@acme.com")).toBeNull();
  });

  it("renders deals scoped by the contact's company — real stage/value/close date, no fabricated deal name", () => {
    render(<ContactDetailWorkspace data={payload({ deals: [deal()] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Deals/ }));
    expect(screen.getByText("Proposal")).toBeDefined();
    expect(screen.getByText("£8,000")).toBeDefined();
  });

  it("shows an honest EmptyState for the Deals tab with no data", () => {
    render(<ContactDetailWorkspace data={payload()} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Deals/ }));
    expect(screen.getByText("No deals yet")).toBeDefined();
  });

  it("renders ActivityTimeline in the Activity tab", () => {
    const activity: ActivityRow = {
      id: "a1",
      org_id: "org-1",
      company_id: null,
      contact_id: "p1",
      deal_id: null,
      type: "note",
      body: "Intro note",
      due_at: null,
      completed_at: null,
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    render(<ContactDetailWorkspace data={payload({ activities: [activity] })} fetchError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Activity/ }));
    expect(screen.getByText("Intro note")).toBeDefined();
  });

  it("shows a retryable ErrorState instead of the workspace when the fetch failed", () => {
    render(<ContactDetailWorkspace data={null} fetchError="Unable to load this contact. Try again in a moment." />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("tablist")).toBeNull();
    fireEvent.click(screen.getByText("Try again"));
    expect(refresh).toHaveBeenCalled();
  });
});
