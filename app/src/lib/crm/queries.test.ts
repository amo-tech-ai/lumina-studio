import { describe, expect, it, vi } from "vitest";

import { getCurrentOrgId, getProfileNames, listCompanies } from "./queries";

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
