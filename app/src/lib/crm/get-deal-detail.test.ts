import { describe, expect, it, vi, afterEach } from "vitest";

const getDeal = vi.fn();
const getCompanyNames = vi.fn();
const listActivities = vi.fn();

vi.mock("./queries", () => ({
  getDeal: (...args: unknown[]) => getDeal(...args),
  getCompanyNames: (...args: unknown[]) => getCompanyNames(...args),
  listActivities: (...args: unknown[]) => listActivities(...args),
}));

import { getDealDetail } from "./get-deal-detail";

/** Table-keyed client stub for the two raw `.from()` calls this module makes
 *  beyond the mocked queries.ts helpers (crm_companies.brand_id lookup,
 *  shoot_portfolio_view name lookup). */
function mockClient(responses: Record<string, { data: unknown; error: { message: string } | null }>) {
  const from = vi.fn((table: string) => {
    const response = responses[table] ?? { data: null, error: null };
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => response),
    };
    return builder;
  });
  return { from } as never;
}

afterEach(() => vi.clearAllMocks());

describe("getDealDetail", () => {
  it("returns null when the deal doesn't exist or belongs to another org — no further queries fire", async () => {
    getDeal.mockResolvedValueOnce(null);
    const client = mockClient({});
    const result = await getDealDetail(client, "org-1", "missing");
    expect(result).toBeNull();
    expect(getCompanyNames).not.toHaveBeenCalled();
    expect(listActivities).not.toHaveBeenCalled();
  });

  it("scopes the deal lookup and every sub-fetch by org (organization isolation)", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "proposal" });
    getCompanyNames.mockResolvedValueOnce({ c1: "Acme Athletic" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ crm_companies: { data: { brand_id: null }, error: null } });

    await getDealDetail(client, "org-1", "d1");

    expect(getDeal).toHaveBeenCalledWith({ id: "d1", orgId: "org-1" }, client);
    expect(getCompanyNames).toHaveBeenCalledWith(["c1"], client);
    expect(listActivities).toHaveBeenCalledWith({ orgId: "org-1", dealId: "d1" }, client);
  });

  it("resolves company name, brand_id, and honest nulls for an unlinked shoot", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "proposal" });
    getCompanyNames.mockResolvedValueOnce({ c1: "Acme Athletic" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ crm_companies: { data: { brand_id: "brand-1" }, error: null } });

    const result = await getDealDetail(client, "org-1", "d1");

    expect(result?.companyName).toBe("Acme Athletic");
    expect(result?.companyBrandId).toBe("brand-1");
    expect(result?.shootName).toBeNull();
  });

  it("resolves a real shoot name when shoot_id is set — never a fabricated one", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: "s1", stage: "proposal" });
    getCompanyNames.mockResolvedValueOnce({ c1: "Acme Athletic" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({
      crm_companies: { data: { brand_id: null }, error: null },
      shoot_portfolio_view: { data: { name: "SS26 Editorial" }, error: null },
    });

    const result = await getDealDetail(client, "org-1", "d1");
    expect(result?.shootName).toBe("SS26 Editorial");
  });

  it("returns an honest empty activity list rather than fabricating rows", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "lead" });
    getCompanyNames.mockResolvedValueOnce({});
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ crm_companies: { data: { brand_id: null }, error: null } });

    const result = await getDealDetail(client, "org-1", "d1");
    expect(result?.activities).toEqual([]);
    expect(result?.companyName).toBeNull();
  });

  it("lets a real query error propagate instead of masking it as a 404", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "lead" });
    getCompanyNames.mockResolvedValueOnce({});
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ crm_companies: { data: null, error: { message: "boom" } } });

    await expect(getDealDetail(client, "org-1", "d1")).rejects.toThrow("boom");
  });
});
