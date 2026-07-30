// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./crm-list-workspace.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-avatar.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("./crm-create-dialog.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/entity-list.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/empty-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/error-state.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock("../ui/status-chip.module.css", () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }));

vi.mock("@/app/(operator)/app/crm/actions", () => ({
  createCompanyAction: vi.fn(),
  createContactAction: vi.fn(),
  createDealAction: vi.fn(),
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { CompaniesWorkspace } from "./companies-workspace";
import type { CompanyRow } from "@/lib/crm/queries";

afterEach(() => cleanup());

function company(overrides: Partial<CompanyRow> = {}): CompanyRow {
  return {
    id: "c1",
    org_id: "org-1",
    brand_id: null,
    name: "Acme Athletic",
    domain: "acme.com",
    industry: "Sportswear",
    owner: "owner-uuid-1",
    source: null,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const OWNER_NAMES = { "owner-uuid-1": "S. Kim" };

describe("CompaniesWorkspace", () => {
  it("renders a row per company with a real StatusChip label — no fabricated kind/deals/lastActivity", () => {
    render(<CompaniesWorkspace companies={[company()]} ownerNames={OWNER_NAMES} fetchError={null} />);
    expect(screen.getByRole("heading", { name: "Organizations" })).toBeDefined();
    expect(screen.getByText("1 company")).toBeDefined();
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Sportswear")).toBeDefined();
    expect(screen.getByText("S. Kim")).toBeDefined();
  });

  it("resolves owner (a uuid FK to profiles) to a display name — never renders the raw id", () => {
    render(<CompaniesWorkspace companies={[company({ owner: "owner-uuid-1" })]} ownerNames={OWNER_NAMES} fetchError={null} />);
    expect(screen.getByText("S. Kim")).toBeDefined();
    expect(screen.queryByText("owner-uuid-1")).toBeNull();
  });

  it("falls back to — when the owner id has no resolved profile name", () => {
    render(<CompaniesWorkspace companies={[company({ owner: "owner-uuid-missing" })]} ownerNames={OWNER_NAMES} fetchError={null} />);
    expect(screen.queryByText("owner-uuid-missing")).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("routes a row to the existing /app/crm/companies/[id] stub", () => {
    render(<CompaniesWorkspace companies={[company({ id: "c-42" })]} ownerNames={OWNER_NAMES} fetchError={null} />);
    const link = screen.getByText("Acme Athletic").closest("a");
    expect(link?.getAttribute("href")).toBe("/app/crm/companies/c-42");
  });

  it("filters client-side by name or domain", () => {
    const companies = [company({ id: "c1", name: "Acme Athletic", domain: "acme.com" }), company({ id: "c2", name: "Vega Studios", domain: "vega.io" })];
    render(<CompaniesWorkspace companies={companies} ownerNames={OWNER_NAMES} fetchError={null} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "vega" } });
    expect(screen.getByText("Vega Studios")).toBeDefined();
    expect(screen.queryByText("Acme Athletic")).toBeNull();
  });

  it("shows a genuine EmptyState with an Add-a-company create CTA", () => {
    render(<CompaniesWorkspace companies={[]} ownerNames={{}} fetchError={null} />);
    expect(screen.getByText("No companies yet")).toBeDefined();
    const cta = screen.getByRole("button", { name: /Add a company/ });
    expect(cta).toBeDefined();
    expect(cta).toHaveProperty("disabled", false);
  });

  it("shows a distinct no-match state when a search yields zero — not the same copy as genuine empty, no Add-a-company CTA", () => {
    render(<CompaniesWorkspace companies={[company()]} ownerNames={OWNER_NAMES} fetchError={null} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText(/No matches for/)).toBeDefined();
    expect(screen.queryByText("No companies yet")).toBeNull();
    expect(screen.queryByRole("button", { name: /Add a company/ })).toBeNull();
  });

  it("shows ErrorState with a working retry that re-runs the server fetch", () => {
    render(<CompaniesWorkspace companies={[]} ownerNames={{}} fetchError="Unable to load companies." />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("enables New organization and Status/Owner filter chips (IPI-562 Phase 2)", () => {
    render(
      <CompaniesWorkspace
        companies={[company(), company({ id: "c2", status: "prospect", owner: "owner-uuid-2", name: "Beta" })]}
        ownerNames={{ ...OWNER_NAMES, "owner-uuid-2": "A. Lee" }}
        fetchError={null}
      />,
    );
    const newBtn = screen.getByRole("button", { name: "New organization" });
    expect(newBtn.hasAttribute("disabled")).toBe(false);
    expect(newBtn.getAttribute("title")).not.toBe("Coming soon");

    const statusBtn = screen.getByRole("button", { name: "Status" });
    fireEvent.click(statusBtn);
    expect(screen.getByRole("button", { name: "Active" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Acme Athletic")).toBeDefined();
    expect(screen.queryByText("Beta")).toBeNull();
  });
});
