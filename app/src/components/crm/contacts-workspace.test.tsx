// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./crm-list-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-avatar.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ContactsWorkspace } from "./contacts-workspace";
import type { ContactRow } from "@/lib/crm/queries";

afterEach(() => cleanup());

function contact(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "p1",
    org_id: "org-1",
    company_id: "c1",
    name: "Dana Vale",
    role_title: "Brand Director",
    email: [{ value: "dana@acme.com", type: "work", primary: true }],
    phone: [],
    profile_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as ContactRow;
}

const COMPANY_NAMES = { c1: "Acme Athletic" };

describe("ContactsWorkspace", () => {
  it("renders a row with real fields — organization via lookup, primary email from the jsonb array", () => {
    render(<ContactsWorkspace contacts={[contact()]} companyNames={COMPANY_NAMES} fetchError={null} />);
    expect(screen.getByRole("heading", { name: "People" })).toBeDefined();
    expect(screen.getByText("1 contact")).toBeDefined();
    expect(screen.getByText("Dana Vale")).toBeDefined();
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.getByText("Brand Director")).toBeDefined();
    expect(screen.getByText("dana@acme.com")).toBeDefined();
  });

  it("shows a dash for a contact with no linked company rather than inventing one", () => {
    render(
      <ContactsWorkspace
        contacts={[contact({ id: "p2", company_id: null })]}
        companyNames={COMPANY_NAMES}
        fetchError={null}
      />,
    );
    const cells = screen.getAllByText("—");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("routes a row to the existing /app/crm/contacts/[id] stub", () => {
    render(<ContactsWorkspace contacts={[contact({ id: "p-9" })]} companyNames={COMPANY_NAMES} fetchError={null} />);
    const link = screen.getByText("Dana Vale").closest("a");
    expect(link?.getAttribute("href")).toBe("/app/crm/contacts/p-9");
  });

  it("filters client-side by name", () => {
    const contacts = [contact({ id: "p1", name: "Dana Vale" }), contact({ id: "p2", name: "Kit Rho" })];
    render(<ContactsWorkspace contacts={contacts} companyNames={COMPANY_NAMES} fetchError={null} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "kit" } });
    expect(screen.getByText("Kit Rho")).toBeDefined();
    expect(screen.queryByText("Dana Vale")).toBeNull();
  });

  it("also filters by role, email, and organization, not just name", () => {
    const contacts = [
      contact({ id: "p1", name: "Dana Vale", company_id: "c1", role_title: "Brand Director", email: [{ value: "dana@acme.com", type: "work", primary: true }] }),
      contact({ id: "p2", name: "Kit Rho", company_id: null, role_title: "Photographer", email: [{ value: "kit@vega.io", type: "work", primary: true }] }),
    ];
    render(<ContactsWorkspace contacts={contacts} companyNames={COMPANY_NAMES} fetchError={null} />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "photographer" } });
    expect(screen.getByText("Kit Rho")).toBeDefined();
    expect(screen.queryByText("Dana Vale")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "dana@acme.com" } });
    expect(screen.getByText("Dana Vale")).toBeDefined();
    expect(screen.queryByText("Kit Rho")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "acme athletic" } });
    expect(screen.getByText("Dana Vale")).toBeDefined();
    expect(screen.queryByText("Kit Rho")).toBeNull();
  });

  it("shows a genuine EmptyState with a disabled New-person CTA (DC parity — no create flow wired yet)", () => {
    render(<ContactsWorkspace contacts={[]} companyNames={{}} fetchError={null} />);
    expect(screen.getByText("No contacts yet")).toBeDefined();
    // Two "New person" buttons exist now: the header's (already-existing) and the
    // new empty-state CTA. Both are disabled — assert on the pair, not just one.
    const ctas = screen.getAllByRole("button", { name: /New person/ });
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) expect(cta).toHaveProperty("disabled", true);
  });

  it("shows ErrorState with a working retry that re-runs the server fetch", () => {
    render(<ContactsWorkspace contacts={[]} companyNames={{}} fetchError="Unable to load contacts." />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
