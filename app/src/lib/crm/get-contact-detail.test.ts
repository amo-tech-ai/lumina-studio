import { describe, expect, it, vi, afterEach } from "vitest";

const getContact = vi.fn();
const listDeals = vi.fn();
const listActivities = vi.fn();
const getCompanyNames = vi.fn();

vi.mock("./queries", () => ({
  getContact: (...args: unknown[]) => getContact(...args),
  listDeals: (...args: unknown[]) => listDeals(...args),
  listActivities: (...args: unknown[]) => listActivities(...args),
  getCompanyNames: (...args: unknown[]) => getCompanyNames(...args),
}));

import { getContactDetail } from "./get-contact-detail";

const client = {} as never;

afterEach(() => vi.clearAllMocks());

describe("getContactDetail", () => {
  it("returns null when the contact doesn't exist or belongs to another org", async () => {
    getContact.mockResolvedValueOnce(null);
    const result = await getContactDetail(client, "org-1", "missing");
    expect(result).toBeNull();
    expect(listDeals).not.toHaveBeenCalled();
    expect(listActivities).not.toHaveBeenCalled();
  });

  it("assembles the full payload, scoping deals by the contact's linked company (crm_deals has no contact_id)", async () => {
    getContact.mockResolvedValueOnce({ id: "p1", name: "Dana Vale", company_id: "c1" });
    listDeals.mockResolvedValueOnce([{ id: "d1", stage: "proposal" }]);
    listActivities.mockResolvedValueOnce([{ id: "a1", type: "note" }]);
    getCompanyNames.mockResolvedValueOnce({ c1: "Acme Athletic" });

    const result = await getContactDetail(client, "org-1", "p1");

    expect(result?.contact.name).toBe("Dana Vale");
    expect(result?.companyName).toBe("Acme Athletic");
    expect(result?.deals).toHaveLength(1);
    expect(result?.activities).toHaveLength(1);
    expect(listDeals).toHaveBeenCalledWith({ orgId: "org-1", companyId: "c1" }, client);
    expect(listActivities).toHaveBeenCalledWith({ orgId: "org-1", contactId: "p1" }, client);
    expect(getCompanyNames).toHaveBeenCalledWith(["c1"], client);
  });

  it("skips deals and company-name resolution when the contact has no linked company, without a query", async () => {
    getContact.mockResolvedValueOnce({ id: "p1", name: "Dana Vale", company_id: null });
    listActivities.mockResolvedValueOnce([]);

    const result = await getContactDetail(client, "org-1", "p1");

    expect(result?.companyName).toBeNull();
    expect(result?.deals).toEqual([]);
    expect(listDeals).not.toHaveBeenCalled();
    expect(getCompanyNames).not.toHaveBeenCalled();
  });

  it("lets a real query error propagate instead of masking it as a 404", async () => {
    getContact.mockRejectedValueOnce(new Error("boom"));
    await expect(getContactDetail(client, "org-1", "p1")).rejects.toThrow("boom");
  });
});
