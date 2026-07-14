import { describe, expect, it, vi } from "vitest";

import {
  getCompany,
  getCompanyNames,
  getContact,
  getCurrentOrgId,
  getDeal,
  getProfileNames,
  listActivities,
  listCompanies,
  listDeals,
} from "./queries";

function mockSupabase(rows: Record<string, unknown>[] | null, error: { message: string } | null = null) {
  const builder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(async () => ({ data: rows, error })),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  return { from: vi.fn(() => builder), _builder: builder };
}

/** org_members query chain is select→eq→order→limit→maybeSingle — a different
 *  shape from listCompanies/listContacts (no maybeSingle there). */
function mockOrgMembers(row: { org_id: string } | null, error: { message: string } | null = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  };
  return { from: vi.fn(() => builder), _builder: builder };
}

describe("listCompanies", () => {
  it("filters by status and search term, returning matched rows", async () => {
    const sb = mockSupabase([{ id: "1", name: "Acme Co." }]);
    const rows = await listCompanies(
      { orgId: "org-1", status: "prospect", search: "acme" },
      sb as never,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toMatch(/acme/i);
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
    expect(sb._builder.eq).toHaveBeenCalledWith("status", "prospect");
    expect(sb._builder.or).toHaveBeenCalledWith("name.ilike.%acme%,domain.ilike.%acme%");
  });

  it("sanitizes search terms before building the or() filter", async () => {
    const sb = mockSupabase([]);
    await listCompanies({ orgId: "org-1", search: "foo,bar%_" }, sb as never);
    expect(sb._builder.or).toHaveBeenCalledWith(
      "name.ilike.%foobar\\%\\_%,domain.ilike.%foobar\\%\\_%",
    );
  });

  it("returns an empty array when there are no rows", async () => {
    const sb = mockSupabase(null);
    const rows = await listCompanies({ orgId: "org-1" }, sb as never);
    expect(rows).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const sb = mockSupabase(null, { message: "boom" });
    await expect(listCompanies({ orgId: "org-1" }, sb as never)).rejects.toThrow("boom");
  });
});

describe("getCurrentOrgId", () => {
  it("orders by joined_at (not created_at — org_members has no created_at column)", async () => {
    const sb = mockOrgMembers({ org_id: "org-1" });
    const orgId = await getCurrentOrgId("user-1", sb as never);
    expect(orgId).toBe("org-1");
    expect(sb._builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(sb._builder.order).toHaveBeenCalledWith("joined_at", { ascending: true });
    expect(sb._builder.limit).toHaveBeenCalledWith(1);
  });

  it("returns null when the user belongs to no org", async () => {
    const sb = mockOrgMembers(null);
    expect(await getCurrentOrgId("user-1", sb as never)).toBeNull();
  });

  it("throws when the query errors — 42703 undefined-column is the regression this guards", async () => {
    const sb = mockOrgMembers(null, { message: "column org_members.created_at does not exist" });
    await expect(getCurrentOrgId("user-1", sb as never)).rejects.toThrow("does not exist");
  });
});

function mockProfiles(rows: Array<{ id: string; full_name: string | null; email: string }>) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return { from: vi.fn(() => builder), _builder: builder };
}

describe("getProfileNames", () => {
  it("maps id to full_name, falling back to email when full_name is null", async () => {
    const sb = mockProfiles([
      { id: "p1", full_name: "S. Kim", email: "s@x.com" },
      { id: "p2", full_name: null, email: "p2@x.com" },
    ]);
    const names = await getProfileNames(["p1", "p2"], sb as never);
    expect(names).toEqual({ p1: "S. Kim", p2: "p2@x.com" });
    expect(sb._builder.in).toHaveBeenCalledWith("id", ["p1", "p2"]);
  });

  it("dedupes ids and short-circuits without a query for an empty list", async () => {
    const sb = mockProfiles([]);
    expect(await getProfileNames([], sb as never)).toEqual({});
    expect(sb.from).not.toHaveBeenCalled();
  });
});

function mockCompanies(rows: Array<{ id: string; name: string }>) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return { from: vi.fn(() => builder), _builder: builder };
}

function mockSingleTable(row: Record<string, unknown> | null, error: { message: string } | null = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
  };
  return { from: vi.fn(() => builder), _builder: builder };
}

describe("getCompany", () => {
  it("scopes the lookup by id and org", async () => {
    const sb = mockSingleTable({ id: "c1", name: "Acme Co." });
    const row = await getCompany({ id: "c1", orgId: "org-1" }, sb as never);
    expect(row?.name).toBe("Acme Co.");
    expect(sb._builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
  });

  it("returns null when no row matches", async () => {
    const sb = mockSingleTable(null);
    expect(await getCompany({ id: "missing", orgId: "org-1" }, sb as never)).toBeNull();
  });

  it("throws when the query errors", async () => {
    const sb = mockSingleTable(null, { message: "boom" });
    await expect(getCompany({ id: "c1", orgId: "org-1" }, sb as never)).rejects.toThrow("boom");
  });
});

describe("getContact", () => {
  it("scopes the lookup by id and org", async () => {
    const sb = mockSingleTable({ id: "p1", name: "Sarah Lee" });
    const row = await getContact({ id: "p1", orgId: "org-1" }, sb as never);
    expect(row?.name).toBe("Sarah Lee");
    expect(sb._builder.eq).toHaveBeenCalledWith("id", "p1");
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
  });

  it("returns null when no row matches", async () => {
    const sb = mockSingleTable(null);
    expect(await getContact({ id: "missing", orgId: "org-1" }, sb as never)).toBeNull();
  });

  it("throws when the query errors", async () => {
    const sb = mockSingleTable(null, { message: "boom" });
    await expect(getContact({ id: "p1", orgId: "org-1" }, sb as never)).rejects.toThrow("boom");
  });
});

describe("getDeal", () => {
  it("scopes the lookup by id and org", async () => {
    const sb = mockSingleTable({ id: "d1", stage: "negotiation" });
    const row = await getDeal({ id: "d1", orgId: "org-1" }, sb as never);
    expect(row?.stage).toBe("negotiation");
    expect(sb._builder.eq).toHaveBeenCalledWith("id", "d1");
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
  });

  it("returns null when no row matches", async () => {
    const sb = mockSingleTable(null);
    expect(await getDeal({ id: "missing", orgId: "org-1" }, sb as never)).toBeNull();
  });

  it("throws when the query errors", async () => {
    const sb = mockSingleTable(null, { message: "boom" });
    await expect(getDeal({ id: "d1", orgId: "org-1" }, sb as never)).rejects.toThrow("boom");
  });
});

function mockListTable(rows: Record<string, unknown>[] | null, error: { message: string } | null = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(async () => ({ data: rows, error })),
  };
  return { from: vi.fn(() => builder), _builder: builder };
}

describe("listDeals", () => {
  it("filters by org, stage, and companyId when given", async () => {
    const sb = mockListTable([{ id: "d1", stage: "lead" }]);
    const rows = await listDeals({ orgId: "org-1", stage: "lead", companyId: "c1" }, sb as never);
    expect(rows).toHaveLength(1);
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
    expect(sb._builder.eq).toHaveBeenCalledWith("stage", "lead");
    expect(sb._builder.eq).toHaveBeenCalledWith("company_id", "c1");
  });

  it("returns an empty array when there are no rows", async () => {
    const sb = mockListTable(null);
    expect(await listDeals({ orgId: "org-1" }, sb as never)).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const sb = mockListTable(null, { message: "boom" });
    await expect(listDeals({ orgId: "org-1" }, sb as never)).rejects.toThrow("boom");
  });
});

describe("listActivities", () => {
  it("filters by org (defense-in-depth on top of RLS) and whichever anchor is set", async () => {
    const sb = mockListTable([{ id: "a1", type: "note" }]);
    const rows = await listActivities({ orgId: "org-1", dealId: "d1" }, sb as never);
    expect(rows).toHaveLength(1);
    expect(sb._builder.eq).toHaveBeenCalledWith("org_id", "org-1");
    expect(sb._builder.eq).toHaveBeenCalledWith("deal_id", "d1");
    expect(sb._builder.eq).not.toHaveBeenCalledWith("company_id", expect.anything());
  });

  it("throws when no anchor is provided — mirrors the DB's own check constraint", async () => {
    const sb = mockListTable([]);
    await expect(listActivities({ orgId: "org-1" }, sb as never)).rejects.toThrow(/at least one/);
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("returns an empty array when there are no rows", async () => {
    const sb = mockListTable(null);
    expect(await listActivities({ orgId: "org-1", companyId: "c1" }, sb as never)).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const sb = mockListTable(null, { message: "boom" });
    await expect(listActivities({ orgId: "org-1", contactId: "p1" }, sb as never)).rejects.toThrow("boom");
  });
});

describe("getCompanyNames", () => {
  it("maps id to name for only the requested ids", async () => {
    const sb = mockCompanies([{ id: "c1", name: "Acme Athletic" }]);
    const names = await getCompanyNames(["c1"], sb as never);
    expect(names).toEqual({ c1: "Acme Athletic" });
    expect(sb._builder.in).toHaveBeenCalledWith("id", ["c1"]);
  });

  it("dedupes ids and short-circuits without a query for an empty list", async () => {
    const sb = mockCompanies([]);
    expect(await getCompanyNames([], sb as never)).toEqual({});
    expect(sb.from).not.toHaveBeenCalled();
  });
});
