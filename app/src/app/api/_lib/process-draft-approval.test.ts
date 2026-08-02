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
          return chain({ data: null, error: { message: "not found" } });
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

  it("rejects a non-owner on the idempotent path", async () => {
    let draftsCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        draftsCalls += 1;
        if (draftsCalls === 1) {
          return chain({ data: null, error: { message: "not found" } });
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
