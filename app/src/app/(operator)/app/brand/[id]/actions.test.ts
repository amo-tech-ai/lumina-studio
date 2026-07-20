import { afterEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockInvokeStartBrandCrawl = vi.fn();
const mockWaitForCrawlCompletion = vi.fn();
const mockInvokeBrandIntelligence = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/onboarding", () => ({
  invokeStartBrandCrawl: (...args: unknown[]) => mockInvokeStartBrandCrawl(...args),
  waitForCrawlCompletion: (...args: unknown[]) => mockWaitForCrawlCompletion(...args),
  invokeBrandIntelligence: (...args: unknown[]) => mockInvokeBrandIntelligence(...args),
}));

vi.mock("@/lib/brand/discard-draft", () => ({ discardBrandDraft: vi.fn() }));
vi.mock("@/app/api/_lib/process-draft-approval", () => ({ processBrandIntelligenceDraftApproval: vi.fn() }));
vi.mock("@/lib/brand/promote-draft", () => ({ promoteBrandDraft: vi.fn() }));

type BrandRow = { id: string; name: string; brand_url: string | null; intake_status: string | null };

function makeSupabase(brand: BrandRow) {
  const updates: Record<string, unknown>[] = [];
  const brandsTable = {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: brand, error: null }),
      }),
    }),
    update: (patch: Record<string, unknown>) => {
      updates.push(patch);
      return {
        eq: () => ({
          not: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: { id: brand.id }, error: null }),
            }),
          }),
          // restoreBrandStatus path: .update().eq() with no further chain
          then: undefined,
        }),
      };
    },
  };

  return {
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table !== "brands") throw new Error(`unexpected table: ${table}`);
      return brandsTable;
    },
    updates,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => mockSupabase,
}));

let mockSupabase: ReturnType<typeof makeSupabase>;

async function importActions() {
  return import("./actions");
}

const BRAND: BrandRow = {
  id: "brand-1",
  name: "Nike",
  brand_url: "https://www.nike.com",
  intake_status: "brand_created",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("reanalyzeBrand — IPI-738 crawl-first path", () => {
  it("starts a crawl, waits for it, and passes crawlResultId to invokeBrandIntelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockResolvedValue({ brandId: BRAND.id });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeStartBrandCrawl).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      BRAND.brand_url,
      expect.objectContaining({ idempotencyKey: `reanalyze-${BRAND.id}` }),
    );
    expect(mockWaitForCrawlCompletion).toHaveBeenCalledWith(mockSupabase, "crawl-1");
    expect(mockInvokeBrandIntelligence).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      expect.objectContaining({ websiteUrl: BRAND.brand_url }),
      expect.objectContaining({ draftMode: true, crawlResultId: "crawl-1" }),
    );
    expect(result).toEqual({ ok: true, hasDraft: true });
  });

  it("returns a specific actionable error when the crawl fails, without calling brand-intelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("failed");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeBrandIntelligence).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
  });

  it("returns a specific actionable error on crawl timeout, without calling brand-intelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("timeout");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeBrandIntelligence).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/taking longer than expected/i);
  });

  it("falls through to invokeBrandIntelligence without crawlResultId when start-brand-crawl itself throws", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockRejectedValue(new Error("Firecrawl is not configured"));
    mockInvokeBrandIntelligence.mockResolvedValue({ brandId: BRAND.id });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockWaitForCrawlCompletion).not.toHaveBeenCalled();
    expect(mockInvokeBrandIntelligence).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      expect.anything(),
      expect.objectContaining({ draftMode: true, crawlResultId: undefined }),
    );
    expect(result).toEqual({ ok: true, hasDraft: true });
  });
});
