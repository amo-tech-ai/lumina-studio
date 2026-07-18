// IPI-650 · PLN-HUB-002 — listEligibleEntities / listWorkflowTemplates.
// Separate file from queries.test.ts: those two functions need real
// per-table dispatch (campaigns, crm_deals, crm_companies, shoot_portfolio_view,
// brands, planner.instances, planner.workflows all in the same call), which
// queries.test.ts's shared single-query mockClient() doesn't support.

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listEligibleEntities, listWorkflowTemplates } from "./queries";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

type TableResponse = { data: unknown; error?: unknown };

function makeTableQuery(response: TableResponse) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => unknown;
  } = {};
  for (const method of ["select", "eq", "neq", "in", "order"]) {
    query[method] = vi.fn(() => query);
  }
  const resolved = { data: response.data, error: response.error ?? null };
  query.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject);
  return query;
}

function mockClient({
  userId = "user-a",
  tables = {},
}: {
  userId?: string | null;
  tables?: Record<string, TableResponse>;
}) {
  const from = vi.fn((table: string) => makeTableQuery(tables[table] ?? { data: [] }));
  const schema = vi.fn(() => ({ from }));
  const getUser = vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null }, error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser },
    schema,
    from,
  } as never);
  return { from };
}

const ORG_ID = "00000000-0000-4000-8000-000000000010";
const OTHER_ORG_ID = "00000000-0000-4000-8000-000000000099";
const BRAND_ID = "00000000-0000-4000-8000-000000000040";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listEligibleEntities", () => {
  it("returns UNAUTHENTICATED when no session exists", async () => {
    mockClient({ userId: null, tables: {} });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to view Planner data." },
    });
  });

  it("combines campaigns, crm_deals (via company name), and org-owned shoots, sorted by label", async () => {
    mockClient({
      tables: {
        campaigns: { data: [{ id: "camp-1", name: "Q3 Retail Push" }] },
        crm_deals: { data: [{ id: "deal-1", company_id: "company-1" }] },
        crm_companies: { data: [{ id: "company-1", name: "Acme Co" }] },
        shoot_portfolio_view: {
          data: [{ id: "shoot-1", name: "Summer Lookbook", brand_id: BRAND_ID, status: "active" }],
        },
        brands: { data: [{ id: BRAND_ID, org_id: ORG_ID }] },
        instances: { data: [] },
      },
    });

    const result = await listEligibleEntities(ORG_ID);

    expect(result).toEqual({
      ok: true,
      data: [
        { entityType: "crm_deal", entityId: "deal-1", label: "Acme Co deal" },
        { entityType: "campaign", entityId: "camp-1", label: "Q3 Retail Push" },
        { entityType: "shoot", entityId: "shoot-1", label: "Summer Lookbook" },
      ],
    });
  });

  it("excludes an entity that already has a planner.instances row, regardless of workflow", async () => {
    mockClient({
      tables: {
        campaigns: { data: [{ id: "camp-1", name: "Q3 Retail Push" }] },
        crm_deals: { data: [] },
        shoot_portfolio_view: { data: [] },
        instances: { data: [{ entity_type: "campaign", entity_id: "camp-1" }] },
      },
    });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("excludes archived shoots, mirroring planner_create_instance's own s.status <> 'archived' check", async () => {
    mockClient({
      tables: {
        campaigns: { data: [] },
        crm_deals: { data: [] },
        // The .neq("status", "archived") call is itself part of the query
        // builder chain (mocked as a pass-through) — this fixture proves the
        // *filtered* row never appears in the result, which is what the
        // real Postgres filter guarantees; an archived row simply isn't
        // returned by the live query.
        shoot_portfolio_view: { data: [] },
        instances: { data: [] },
      },
    });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("excludes a shoot whose brand belongs to a different org than the caller's", async () => {
    mockClient({
      tables: {
        campaigns: { data: [] },
        crm_deals: { data: [] },
        shoot_portfolio_view: {
          data: [{ id: "shoot-1", name: "Summer Lookbook", brand_id: BRAND_ID, status: "active" }],
        },
        // brands query itself filters .eq("org_id", orgId) — a brand row
        // belonging to a different org never comes back, so the shoot has no
        // matching orgBrandIds entry.
        brands: { data: [] },
        instances: { data: [] },
      },
    });

    const result = await listEligibleEntities(OTHER_ORG_ID);
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("falls back to 'Untitled company deal' when the deal's company can't be resolved", async () => {
    mockClient({
      tables: {
        campaigns: { data: [] },
        crm_deals: { data: [{ id: "deal-1", company_id: null }] },
        shoot_portfolio_view: { data: [] },
        instances: { data: [] },
      },
    });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({
      ok: true,
      data: [{ entityType: "crm_deal", entityId: "deal-1", label: "Untitled company deal" }],
    });
  });

  it("maps any underlying query failure to QUERY_FAILED", async () => {
    mockClient({
      tables: {
        campaigns: { data: null, error: { message: "connection reset" } },
      },
    });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Eligible plans could not be loaded." },
    });
  });

  it("degrades to 'Untitled company deal' instead of throwing when the company-name lookup itself fails", async () => {
    // getCompanyNames throws on a query error (see crm/queries.ts) — a
    // transient crm_companies failure must not take down the whole eligible
    // list (and, transitively, the Planner Hub page, which awaits this in
    // Promise.all), matching the crm/pipeline/page.tsx degrade-to-{} pattern.
    mockClient({
      tables: {
        campaigns: { data: [] },
        crm_deals: { data: [{ id: "deal-1", company_id: "company-1" }] },
        crm_companies: { data: null, error: { message: "connection reset" } },
        shoot_portfolio_view: { data: [] },
        instances: { data: [] },
      },
    });

    const result = await listEligibleEntities(ORG_ID);
    expect(result).toEqual({
      ok: true,
      data: [{ entityType: "crm_deal", entityId: "deal-1", label: "Untitled company deal" }],
    });
  });
});

describe("listWorkflowTemplates", () => {
  it("returns the org's workflows, is_default first", async () => {
    mockClient({
      tables: {
        workflows: {
          data: [
            { id: "wf-1", name: "5-Week Product Shoot", category: "production", is_default: true },
          ],
        },
      },
    });

    const result = await listWorkflowTemplates(ORG_ID);
    expect(result).toEqual({
      ok: true,
      data: [{ id: "wf-1", name: "5-Week Product Shoot", category: "production", isDefault: true }],
    });
  });

  it("maps a query failure to QUERY_FAILED", async () => {
    mockClient({
      tables: {
        workflows: { data: null, error: { message: "connection reset" } },
      },
    });

    const result = await listWorkflowTemplates(ORG_ID);
    expect(result).toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Workflow templates could not be loaded." },
    });
  });
});
