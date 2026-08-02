import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockGetMastra = vi.fn();
const mockPromote = vi.fn();
const mockDiscard = vi.fn();

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

vi.mock("@/lib/brand/promote-draft", () => ({
  promoteBrandDraft: (...args: unknown[]) => mockPromote(...args),
}));

vi.mock("@/lib/brand/discard-draft", () => ({
  discardBrandDraft: (...args: unknown[]) => mockDiscard(...args),
}));

vi.mock("@/mastra", () => ({
  getMastra: () => mockGetMastra(),
}));

const OPERATOR = "55555555-5555-4555-8555-555555555555";
const OTHER = "66666666-6666-4666-8666-666666666666";
const BRAND = "77777777-7777-4777-8777-777777777777";
const RUN = "run-abc";

/** Thenable chain that also exposes terminal methods used by the approval helper. */
function chain(result: { data: unknown; error: unknown }) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.update = () => self;
  self.eq = () => self;
  self.single = async () => result;
  self.maybeSingle = async () => result;
  return self;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPromote.mockResolvedValue({ ok: true });
  mockDiscard.mockResolvedValue({ ok: true });
  mockGetMastra.mockReturnValue({
    getWorkflow: () => ({
      createRun: async () => ({
        resume: async () => undefined,
      }),
    }),
  });
});

describe("processBrandIntelligenceDraftApproval idempotency (IPI-835 · D)", () => {
  it("returns ok on repeat approve when draft is already approved and brand is ready", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "approved",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: true, approved: true, brandId: BRAND });
    expect(mockPromote).not.toHaveBeenCalled();
  });

  it("retries promote when draft is approved but brand is not yet ready", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "approved",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
    mockPromote.mockResolvedValue({ ok: true });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: true, approved: true, brandId: BRAND });
    expect(mockPromote).toHaveBeenCalledWith(expect.anything(), BRAND);
  });

  it("does not return success when approved draft cannot be promoted to ready", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "approved",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
    mockPromote.mockResolvedValue({ ok: false, error: "Brand DNA is incomplete or invalid" });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Brand DNA is incomplete or invalid",
    });
  });

  it("rejects a non-owner on the idempotent path", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "approved",
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OTHER,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: false, error: "Forbidden" });
  });

  it("does not treat non-PGRST116 lookup errors as idempotent success", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        return chain({
          data: null,
          error: { code: "57014", message: "statement timeout" },
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: false, error: "Failed to load draft" });
    expect(mockPromote).not.toHaveBeenCalled();
  });

  it("retries discard when draft is rejected but brand is still draft_ready", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "rejected",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
    mockDiscard.mockResolvedValue({ ok: true });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: true, approved: false, brandId: BRAND });
    expect(mockDiscard).toHaveBeenCalledWith(expect.anything(), BRAND);
  });

  it("does not return reject success while brand is still draft_ready and discard fails", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "rejected",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
    mockDiscard.mockResolvedValue({ ok: false, error: "discard failed" });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Unable to reject Brand DNA right now",
    });
  });

  it("does not treat idempotent draft lookup errors as not-found", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: null,
          error: { code: "57014", message: "statement timeout" },
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: false, error: "Failed to load draft" });
    expect(mockPromote).not.toHaveBeenCalled();
  });

  it("does not report reject success when brand intake_status lookup fails", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "rejected",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({
          data: null,
          error: { code: "57014", message: "statement timeout" },
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: false, error: "Failed to load brand status" });
    expect(mockDiscard).not.toHaveBeenCalled();
  });

  it("rejects a non-owner on the pending path", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        return chain({
          data: { id: "d1", brand_id: BRAND, user_id: OPERATOR },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OTHER,
    });
    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(mockPromote).not.toHaveBeenCalled();
  });
});

describe("sanitizeDraftActionError / no raw Supabase leakage (IPI-835 · D)", () => {
  const RAW_PROMOTE =
    'duplicate key value violates unique constraint "brands_pkey" on table brands';
  const RAW_DISCARD =
    'update or delete on table "brands" violates foreign key constraint "fk_org"';

  function pendingDraftThenUpdate() {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: { id: "d1", brand_id: BRAND, user_id: OPERATOR },
            error: null,
          });
        }
        // status update CAS success
        return chain({ data: { id: "d1" }, error: null });
      }
      return chain({ data: null, error: null });
    });
  }

  function idempotentApprovedStillDraftReady() {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "approved",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
  }

  function idempotentRejectedStillDraftReady() {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({
            data: null,
            error: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            },
          });
        }
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND,
            user_id: OPERATOR,
            status: "rejected",
          },
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: { intake_status: "draft_ready" }, error: null });
      }
      return chain({ data: null, error: null });
    });
  }

  it("sanitizeDraftActionError preserves known approve domain errors", async () => {
    const { sanitizeDraftActionError } = await import("./process-draft-approval");
    expect(
      sanitizeDraftActionError("promote", BRAND, "No draft to apply"),
    ).toBe("No draft to apply");
    expect(
      sanitizeDraftActionError(
        "promote",
        BRAND,
        "Brand DNA is incomplete or invalid",
      ),
    ).toBe("Brand DNA is incomplete or invalid");
    expect(
      sanitizeDraftActionError(
        "promote",
        BRAND,
        "Brand is not in draft_ready state",
      ),
    ).toBe("Brand is not in draft_ready state");
  });

  it("sanitizeDraftActionError maps raw SQL to generic approve/reject copy", async () => {
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sanitizeDraftActionError } = await import("./process-draft-approval");
    expect(sanitizeDraftActionError("promote", BRAND, RAW_PROMOTE)).toBe(
      "Unable to approve Brand DNA right now",
    );
    expect(sanitizeDraftActionError("discard", BRAND, RAW_DISCARD)).toBe(
      "Unable to reject Brand DNA right now",
    );
    expect(logSpy).toHaveBeenCalled();
    const logged = JSON.stringify(logSpy.mock.calls);
    expect(logged).toContain("brands_pkey");
    expect(logged).toContain(BRAND);
    logSpy.mockRestore();
  });

  it("does not return raw Supabase promote error on idempotent approve", async () => {
    idempotentApprovedStillDraftReady();
    mockPromote.mockResolvedValue({ ok: false, error: RAW_PROMOTE });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Unable to approve Brand DNA right now",
    });
    expect(JSON.stringify(result)).not.toMatch(/constraint|brands_pkey|violates/i);
    expect(logSpy.mock.calls.some((c) => JSON.stringify(c).includes("brands_pkey"))).toBe(
      true,
    );
    logSpy.mockRestore();
  });

  it("does not return raw Supabase promote error on normal approve", async () => {
    pendingDraftThenUpdate();
    mockPromote.mockResolvedValue({ ok: false, error: RAW_PROMOTE });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Unable to approve Brand DNA right now",
    });
    expect(JSON.stringify(result)).not.toMatch(/constraint|brands_pkey|violates/i);
    logSpy.mockRestore();
  });

  it("preserves known safe approve validation error on normal approve", async () => {
    pendingDraftThenUpdate();
    mockPromote.mockResolvedValue({
      ok: false,
      error: "Brand DNA is incomplete or invalid",
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: true,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Brand DNA is incomplete or invalid",
    });
  });

  it("does not return raw Supabase discard error on idempotent reject", async () => {
    idempotentRejectedStillDraftReady();
    mockDiscard.mockResolvedValue({ ok: false, error: RAW_DISCARD });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Unable to reject Brand DNA right now",
    });
    expect(JSON.stringify(result)).not.toMatch(/foreign key|fk_org|violates/i);
    logSpy.mockRestore();
  });

  it("does not return raw Supabase discard error on normal reject", async () => {
    pendingDraftThenUpdate();
    mockDiscard.mockResolvedValue({ ok: false, error: RAW_DISCARD });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "Unable to reject Brand DNA right now",
    });
    expect(JSON.stringify(result)).not.toMatch(/foreign key|fk_org|violates/i);
    logSpy.mockRestore();
  });

  it("preserves known safe discard message (FORBIDDEN) on reject", async () => {
    pendingDraftThenUpdate();
    mockDiscard.mockResolvedValue({
      ok: false,
      error: "You do not have permission to perform this action.",
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to perform this action.",
    });
  });

  it("NOT_DRAFT_READY on discard is soft-success (not an error leak path)", async () => {
    pendingDraftThenUpdate();
    mockDiscard.mockResolvedValue({
      ok: false,
      error: "Brand is not in draft_ready state",
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: RUN,
      approved: false,
      operatorId: OPERATOR,
      expectedBrandId: BRAND,
    });
    expect(result).toEqual({ ok: true, approved: false, brandId: BRAND });
  });
});
