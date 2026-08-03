import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DRAFT_ACTION_MESSAGES,
  failure,
  isUniqueViolationSignal,
  logDraftActionError,
  mapDraftActionDbError,
} from "./draft-action-errors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mapDraftActionDbError", () => {
  it("never returns raw Supabase message/details/hint to the client", () => {
    const mapped = mapDraftActionDbError("promote", "brand-1", {
      code: "42P01",
      message: 'relation "brands" does not exist',
      details: "Key (brand_id)=(x) already exists on brand_intake_drafts_pkey.",
      hint: "Check the schema cache for rpc approve_brand_draft.",
    });
    expect(isUniqueViolationSignal(mapped)).toBe(false);
    if ("uniqueViolation" in mapped) throw new Error("expected failure");
    expect(mapped.ok).toBe(false);
    expect(mapped.error).toBe(DRAFT_ACTION_MESSAGES.UNKNOWN);
    expect(JSON.stringify(mapped)).not.toMatch(
      /brands|brand_intake_drafts|approve_brand_draft|pkey|schema|relation|rpc/i,
    );
    expect(mapped.error).not.toContain("does not exist");
    expect(mapped.error).not.toContain("Key (");
  });

  it("maps 42501 to a safe FORBIDDEN response", () => {
    const mapped = mapDraftActionDbError("discard", "brand-1", {
      code: "42501",
      message: 'permission denied for table brands',
      details: "policy brands_update_org_member",
      hint: "GRANT UPDATE ON brands",
    });
    expect(mapped).toEqual(failure("FORBIDDEN"));
    expect(JSON.stringify(mapped)).not.toMatch(/brands|policy|GRANT|permission denied/i);
  });

  it("maps P0002 to a safe NOT_FOUND response", () => {
    const mapped = mapDraftActionDbError("promote", "brand-1", {
      code: "P0002",
      message: "no rows found in brands for brand_id",
    });
    expect(mapped).toEqual(failure("NOT_FOUND"));
    expect(JSON.stringify(mapped)).not.toMatch(/brands|brand_id|no rows/i);
  });

  it("signals 23505 for idempotent resolution (not a raw conflict string)", () => {
    const mapped = mapDraftActionDbError("promote", "brand-1", {
      code: "23505",
      message: 'duplicate key value violates unique constraint "brands_pkey"',
      details: "Key (id)=(uuid) already exists.",
    });
    expect(mapped).toEqual({ uniqueViolation: true });
    expect(isUniqueViolationSignal(mapped)).toBe(true);
  });

  it("maps unknown codes to the generic fallback", () => {
    const mapped = mapDraftActionDbError("discard", "brand-1", {
      code: "57014",
      message: "canceling statement due to statement timeout on brands",
    });
    expect(mapped).toEqual(failure("UNKNOWN"));
  });

  it("logs raw error details server-side without returning them", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mapDraftActionDbError("promote", "brand-99", {
      code: "42501",
      message: "permission denied for table brands",
      details: "policy xyz",
      hint: "use service role",
    });
    expect(spy).toHaveBeenCalledWith(
      "[draft-action:promote]",
      expect.objectContaining({
        brandId: "brand-99",
        code: "42501",
        message: "permission denied for table brands",
        details: "policy xyz",
        hint: "use service role",
      }),
    );
  });

  it("logDraftActionError is shared by promote and discard action labels", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logDraftActionError("discard", "b2", { code: "P0002", message: "no_data" });
    expect(spy.mock.calls[0]?.[0]).toBe("[draft-action:discard]");
    logDraftActionError("promote", "b2", { code: "P0002", message: "no_data" });
    expect(spy.mock.calls[1]?.[0]).toBe("[draft-action:promote]");
  });
});
