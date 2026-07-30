import { describe, expect, it, vi } from "vitest";

import { createCompany, createContact, createDeal, normalizeDomain, normalizeEmail } from "./creates";

type QueryResult = { data: unknown; error: { message: string } | null };

function makeClient(handlers: {
  onSelect?: (table: string) => QueryResult | Promise<QueryResult>;
  onMaybeSingle?: (table: string) => QueryResult | Promise<QueryResult>;
  onInsert?: (table: string, payload: unknown) => QueryResult | Promise<QueryResult>;
}) {
  const from = vi.fn((table: string) => {
    const state: { payload?: unknown } = {};
    const builder: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn((payload: unknown) => {
        state.payload = payload;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => {
        if (handlers.onMaybeSingle) return handlers.onMaybeSingle(table);
        return { data: null, error: null };
      }),
      single: vi.fn(async () => {
        if (handlers.onInsert) return handlers.onInsert(table, state.payload);
        return { data: null, error: { message: "no insert handler" } };
      }),
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        const run = handlers.onSelect?.(table) ?? { data: [], error: null };
        return Promise.resolve(run).then(resolve, reject);
      },
    };
    return builder;
  });
  return { from } as never;
}

describe("normalizeDomain / normalizeEmail", () => {
  it("strips protocol, www, and trailing slash", () => {
    expect(normalizeDomain("https://WWW.Acme.com/")).toBe("acme.com");
  });
  it("lowercases emails", () => {
    expect(normalizeEmail(" Dana@Acme.COM ")).toBe("dana@acme.com");
  });
});

describe("createCompany", () => {
  it("rejects empty name", async () => {
    const client = makeClient({});
    const result = await createCompany({ name: "  " }, { orgId: "org-1", client });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("rejects duplicate normalized domain in the same org", async () => {
    const client = makeClient({
      onSelect: () => ({ data: [{ id: "c1", domain: "https://www.acme.com" }], error: null }),
    });
    const result = await createCompany(
      { name: "Acme Two", domain: "ACME.com" },
      { orgId: "org-1", client },
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: "DUPLICATE",
        message: "A company with this domain already exists in your organization.",
      },
    });
  });

  it("allows duplicate names when domain is null", async () => {
    const inserted = {
      id: "c2",
      org_id: "org-1",
      name: "Acme",
      domain: null,
      status: "prospect",
      industry: null,
      owner: null,
      brand_id: null,
      source: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    const client = makeClient({
      onInsert: () => ({ data: inserted, error: null }),
    });
    const result = await createCompany({ name: "Acme" }, { orgId: "org-1", client });
    expect(result).toEqual({ ok: true, data: inserted });
  });
});

describe("createContact", () => {
  it("rejects duplicate email already in another contact's jsonb array", async () => {
    const client = makeClient({
      onSelect: () => ({
        data: [{ id: "p1", email: [{ value: "dana@acme.com", primary: true }] }],
        error: null,
      }),
    });
    const result = await createContact(
      { name: "Dana 2", email: "Dana@Acme.com" },
      { orgId: "org-1", client },
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: "DUPLICATE",
        message: "A contact with this email already exists in your organization.",
      },
    });
  });

  it("rejects invalid email", async () => {
    const client = makeClient({});
    const result = await createContact({ name: "Dana", email: "not-an-email" }, { orgId: "org-1", client });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });
});

describe("createDeal", () => {
  it("requires a valid company_id uuid (no contact_id field)", async () => {
    const client = makeClient({});
    const result = await createDeal({ company_id: "not-a-uuid" } as never, { orgId: "org-1", client });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("rejects terminal won/lost stages at validation", async () => {
    const client = makeClient({});
    for (const stage of ["won", "lost"] as const) {
      const result = await createDeal(
        { company_id: "11111111-1111-1111-1111-111111111111", stage },
        { orgId: "org-1", client },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    }
  });
});
