import { describe, expect, it } from "vitest";
import {
  routeCrmCompanyId,
  routeCrmContactId,
  routeCrmDealId,
} from "./normalize-route-path";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("CRM route id extractors (IPI-368)", () => {
  it("extracts company id from company detail routes", () => {
    expect(routeCrmCompanyId(`/app/crm/companies/${UUID}`)).toBe(UUID);
    expect(routeCrmCompanyId("/app/crm/companies")).toBeNull();
    expect(routeCrmCompanyId("/app/crm/contacts/" + UUID)).toBeNull();
  });

  it("extracts contact id from contact detail routes", () => {
    expect(routeCrmContactId(`/app/crm/contacts/${UUID}`)).toBe(UUID);
    expect(routeCrmContactId("/app/crm/contacts")).toBeNull();
  });

  it("extracts deal id from pipeline detail routes", () => {
    expect(routeCrmDealId(`/app/crm/pipeline/${UUID}`)).toBe(UUID);
    expect(routeCrmDealId("/app/crm/pipeline")).toBeNull();
  });

  it("rejects non-uuid segments", () => {
    expect(routeCrmCompanyId("/app/crm/companies/not-a-uuid")).toBeNull();
  });
});
