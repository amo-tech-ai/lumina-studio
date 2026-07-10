import { describe, expect, it, vi, afterEach } from "vitest";

const getDeal = vi.fn();
const listActivities = vi.fn();

vi.mock("./queries", () => ({
  getDeal: (...args: unknown[]) => getDeal(...args),
  listActivities: (...args: unknown[]) => listActivities(...args),
}));

import { getDealDetail } from "./get-deal-detail";

/** Table-keyed client stub for the module's one raw `.from()` call
 *  (org-scoped crm_companies name + brand_id lookup). */
function mockClient(response: { data: unknown; error: { message: string } | null }) {
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => response),
  }));
  return { from } as never;
}

afterEach(() => vi.clearAllMocks());

describe("getDealDetail", () => {
  it("returns null when the deal doesn't exist or belongs to another org — no further queries fire", async () => {
    getDeal.mockResolvedValueOnce(null);
    const client = mockClient({ data: null, error: null });
    const result = await getDealDetail(client, "org-1", "missing");
    expect(result).toBeNull();
    expect(listActivities).not.toHaveBeenCalled();
  });

  it("scopes the deal lookup and the company lookup by org (organization isolation)", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "proposal" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ data: { name: "Acme Athletic", brand_id: null }, error: null });
    const from = client.from as unknown as ReturnType<typeof vi.fn>;

    await getDealDetail(client, "org-1", "d1");

    expect(getDeal).toHaveBeenCalledWith({ id: "d1", orgId: "org-1" }, client);
    expect(listActivities).toHaveBeenCalledWith({ orgId: "org-1", dealId: "d1" }, client);
    expect(from).toHaveBeenCalledWith("crm_companies");
    const builder = from.mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(builder.eq).toHaveBeenCalledWith("org_id", "org-1");
  });

  it("resolves company name and brand_id from the org-scoped lookup", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "proposal" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ data: { name: "Acme Athletic", brand_id: "brand-1" }, error: null });

    const result = await getDealDetail(client, "org-1", "d1");

    expect(result?.companyName).toBe("Acme Athletic");
    expect(result?.companyBrandId).toBe("brand-1");
  });

  it("returns an honest empty activity list rather than fabricating rows", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "lead" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ data: null, error: null });

    const result = await getDealDetail(client, "org-1", "d1");
    expect(result?.activities).toEqual([]);
    expect(result?.companyName).toBeNull();
  });

  it("lets a real query error propagate instead of masking it as a 404", async () => {
    getDeal.mockResolvedValueOnce({ id: "d1", org_id: "org-1", company_id: "c1", shoot_id: null, stage: "lead" });
    listActivities.mockResolvedValueOnce([]);
    const client = mockClient({ data: null, error: { message: "boom" } });

    await expect(getDealDetail(client, "org-1", "d1")).rejects.toThrow("boom");
  });
});
