import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockServerFrom = vi.fn();
const mockServerRpc = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockServerFrom(...args),
    rpc: (...args: unknown[]) => mockServerRpc(...args),
  })),
}));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (...args: unknown[]) => mockAdminFrom(...args),
  }),
}));

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const BRAND = "33333333-3333-4333-8333-333333333333";
const ORG = "44444444-4444-4444-8444-444444444444";

function validDraftProfile(runId?: string) {
  return {
    schemaVersion: 2,
    name: "Nike",
    sourceUrl: "https://nike.example",
    tagline: {
      value: "Just Do It",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Just Do It" }],
    },
    category: {
      value: "Athletic",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Athletic" }],
    },
    targetAudience: {
      value: "Athletes",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Athletes" }],
    },
    visualIdentity: { colors: ["#111"], mood: "Bold" },
    scores: { visual: 80, audience: 80, consistency: 80, commerce_readiness: 70 },
    ...(runId ? { _workflow_run_id: runId } : {}),
  };
}

function brandChain(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => result,
      }),
    }),
  };
}

type AdminCalls = {
  selects: Array<{ brandId?: string }>;
  updates: Array<Record<string, unknown>>;
  inserts: Array<Record<string, unknown>>;
  upserts: Array<Record<string, unknown>>;
};

function installAdminMock(opts: {
  draftReads: Array<{ data: unknown; error: unknown }>;
  updateResult?: { data: unknown; error: unknown };
  insertResult?: { error: unknown };
}) {
  const calls: AdminCalls = { selects: [], updates: [], inserts: [], upserts: [] };
  let readIdx = 0;

  mockAdminFrom.mockImplementation((table: string) => {
    if (table !== "brand_intake_drafts") {
      return brandChain({ data: null, error: null });
    }
    return {
      select: () => ({
        eq: (_col: string, brandId: string) => ({
          maybeSingle: async () => {
            calls.selects.push({ brandId });
            const result = opts.draftReads[readIdx] ?? { data: null, error: null };
            readIdx += 1;
            return result;
          },
        }),
      }),
      update: (row: Record<string, unknown>) => {
        calls.updates.push(row);
        const chain = {
          eq: () => chain,
          neq: () => chain,
          select: () => ({
            maybeSingle: async () =>
              opts.updateResult ?? { data: { id: "d1" }, error: null },
          }),
        };
        return chain;
      },
      insert: async (row: Record<string, unknown>) => {
        calls.inserts.push(row);
        return opts.insertResult ?? { error: null };
      },
      upsert: async (row: Record<string, unknown>) => {
        calls.upserts.push(row);
        return { error: null };
      },
    };
  });

  return calls;
}

function installServerBrand(brand: Record<string, unknown> | null, brandErr: unknown = null) {
  let brandReads = 0;
  mockServerFrom.mockImplementation((table: string) => {
    if (table !== "brands") return brandChain({ data: null, error: null });
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            brandReads += 1;
            if (brandReads === 1) {
              return { data: brand, error: brandErr };
            }
            // Re-check reads intake_status only
            return {
              data: brand ? { intake_status: brand.intake_status } : null,
              error: null,
            };
          },
        }),
      }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  mockServerRpc.mockResolvedValue({ data: true, error: null });
});

describe("ensureOnboardingIntakeDraft", () => {
  it("fails closed when draft lookup errors (no insert/upsert)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: null,
      user_id: USER,
    });
    const calls = installAdminMock({
      draftReads: [{ data: null, error: { code: "57014", message: "timeout" } }],
    });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toEqual({
      ok: false,
      error: "We couldn’t load your Brand DNA. Please try again.",
    });
    expect(calls.inserts).toHaveLength(0);
    expect(calls.updates).toHaveLength(0);
    expect(calls.upserts).toHaveLength(0);
  });

  it("rejects when another operator owns the draft row", async () => {
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: ORG,
      user_id: OTHER,
    });
    const calls = installAdminMock({
      draftReads: [
        {
          data: {
            id: "d1",
            status: "pending_approval",
            user_id: OTHER,
            draft_profile: validDraftProfile("run-other"),
          },
          error: null,
        },
      ],
    });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(calls.inserts).toHaveLength(0);
    expect(calls.updates).toHaveLength(0);
    expect(calls.upserts).toHaveLength(0);
  });

  it("does not demote an approved draft (early return, no write)", async () => {
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: null,
      user_id: USER,
    });
    const calls = installAdminMock({
      draftReads: [
        {
          data: {
            id: "d1",
            status: "approved",
            user_id: USER,
            draft_profile: validDraftProfile("run-approved"),
          },
          error: null,
        },
      ],
    });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toMatchObject({
      ok: true,
      runId: "run-approved",
      intakeStatus: "draft_ready",
    });
    expect(calls.inserts).toHaveLength(0);
    expect(calls.updates).toHaveLength(0);
    expect(calls.upserts).toHaveLength(0);
  });

  it("CAS update skips write when status flipped to approved (TOCTOU)", async () => {
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: null,
      user_id: USER,
    });
    const calls = installAdminMock({
      draftReads: [
        // initial existing lookup — rejected so we proceed to write path
        {
          data: {
            id: "d1",
            status: "rejected",
            user_id: USER,
            draft_profile: {},
          },
          error: null,
        },
        // final CAS lookup — still rejected
        {
          data: {
            id: "d1",
            status: "rejected",
            user_id: USER,
            draft_profile: {},
          },
          error: null,
        },
        // after lost CAS — concurrent approve won
        {
          data: {
            status: "approved",
            user_id: USER,
            draft_profile: validDraftProfile("run-won"),
          },
          error: null,
        },
      ],
      updateResult: { data: null, error: null },
    });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toMatchObject({
      ok: true,
      runId: "run-won",
    });
    expect(calls.updates).toHaveLength(1);
    expect(calls.upserts).toHaveLength(0);
    expect(calls.updates[0]).toMatchObject({ status: "pending_approval" });
  });

  it("inserts a pending draft when none exists (no upsert)", async () => {
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: null,
      user_id: USER,
    });
    const calls = installAdminMock({
      draftReads: [
        { data: null, error: null }, // existing
        { data: null, error: null }, // CAS
      ],
      insertResult: { error: null },
    });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.runId).toBeTruthy();
    expect(result.intakeStatus).toBe("draft_ready");
    expect(calls.inserts).toHaveLength(1);
    expect(calls.upserts).toHaveLength(0);
    expect(calls.inserts[0]).toMatchObject({
      brand_id: BRAND,
      user_id: USER,
      status: "pending_approval",
    });
  });

  it("returns ready without writing when brand is already ready", async () => {
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "ready",
      ai_profile_draft: null,
      ai_profile: validDraftProfile(),
      org_id: null,
      user_id: USER,
    });
    const calls = installAdminMock({ draftReads: [] });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toMatchObject({ ok: true, intakeStatus: "ready", runId: null });
    expect(calls.inserts).toHaveLength(0);
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("forbids org viewers (editor RPC false)", async () => {
    mockServerRpc.mockResolvedValue({ data: false, error: null });
    installServerBrand({
      id: BRAND,
      name: "Nike",
      brand_url: "https://nike.example",
      intake_status: "draft_ready",
      ai_profile_draft: validDraftProfile(),
      ai_profile: null,
      org_id: ORG,
      user_id: OTHER,
    });
    const calls = installAdminMock({ draftReads: [] });

    const { ensureOnboardingIntakeDraft } = await import("./ensure-onboarding-intake-draft");
    const result = await ensureOnboardingIntakeDraft(BRAND);
    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(calls.inserts).toHaveLength(0);
  });
});
