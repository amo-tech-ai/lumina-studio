import { describe, expect, it, vi, afterEach } from "vitest";

const getCompany = vi.fn();
const listContacts = vi.fn();
const listDeals = vi.fn();
const listActivities = vi.fn();
const getProfileNames = vi.fn();

vi.mock("./queries", () => ({
  getCompany: (...args: unknown[]) => getCompany(...args),
  listContacts: (...args: unknown[]) => listContacts(...args),
  listDeals: (...args: unknown[]) => listDeals(...args),
  listActivities: (...args: unknown[]) => listActivities(...args),
  getProfileNames: (...args: unknown[]) => getProfileNames(...args),
}));

import { getCompanyDetail } from "./get-company-detail";

const client = {} as never;

afterEach(() => vi.clearAllMocks());

describe("getCompanyDetail", () => {
  it("returns null when the company doesn't exist or belongs to another org", async () => {
    getCompany.mockResolvedValueOnce(null);
    const result = await getCompanyDetail(client, "org-1", "missing");
    expect(result).toBeNull();
    expect(listContacts).not.toHaveBeenCalled();
    expect(listDeals).not.toHaveBeenCalled();
    expect(listActivities).not.toHaveBeenCalled();
  });

  it("assembles the full payload, scoping every sub-list to this company", async () => {
    getCompany.mockResolvedValueOnce({ id: "c1", owner: "owner-1", name: "Acme Co." });
    listContacts.mockResolvedValueOnce([{ id: "p1", name: "Dana Vale" }]);
    listDeals.mockResolvedValueOnce([{ id: "d1", stage: "proposal" }]);
    listActivities.mockResolvedValueOnce([{ id: "a1", type: "note" }]);
    getProfileNames.mockResolvedValueOnce({ "owner-1": "S. Kim" });

    const result = await getCompanyDetail(client, "org-1", "c1");

    expect(result?.company.name).toBe("Acme Co.");
    expect(result?.ownerName).toBe("S. Kim");
    expect(result?.contacts).toHaveLength(1);
    expect(result?.deals).toHaveLength(1);
    expect(result?.activities).toHaveLength(1);
    expect(listContacts).toHaveBeenCalledWith({ orgId: "org-1", companyId: "c1" }, client);
    expect(listDeals).toHaveBeenCalledWith({ orgId: "org-1", companyId: "c1" }, client);
    expect(listActivities).toHaveBeenCalledWith({ companyId: "c1" }, client);
  });

  it("skips owner-name resolution when the company has no owner, without a query", async () => {
    getCompany.mockResolvedValueOnce({ id: "c1", owner: null, name: "Acme Co." });
    listContacts.mockResolvedValueOnce([]);
    listDeals.mockResolvedValueOnce([]);
    listActivities.mockResolvedValueOnce([]);

    const result = await getCompanyDetail(client, "org-1", "c1");

    expect(result?.ownerName).toBeNull();
    expect(getProfileNames).not.toHaveBeenCalled();
  });

  it("lets a real query error propagate instead of masking it as a 404", async () => {
    getCompany.mockRejectedValueOnce(new Error("boom"));
    await expect(getCompanyDetail(client, "org-1", "c1")).rejects.toThrow("boom");
  });
});
