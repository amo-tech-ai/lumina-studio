import { describe, expect, it, vi } from "vitest";

import { listCompanies } from "./queries";

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
