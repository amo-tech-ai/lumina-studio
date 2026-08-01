import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateUrl,
  slugify,
  createOrgAndBrand,
  buildShellAiProfile,
  invokeBrandIntelligence,
  waitForCrawlCompletion,
} from "@/lib/onboarding";

// IPI-46 / IPI-832 — onboarding unit tests

describe("validateUrl", () => {
  it("accepts https URLs", () => {
    expect(validateUrl("https://example.com")).toBeNull();
  });

  it("accepts http URLs", () => {
    expect(validateUrl("http://mybrand.co")).toBeNull();
  });

  it("rejects missing protocol", () => {
    expect(validateUrl("not-a-url")).not.toBeNull();
    expect(validateUrl("example.com")).not.toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateUrl("")).not.toBeNull();
    expect(validateUrl("  ")).not.toBeNull();
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("My Brand Name")).toBe("my-brand-name");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugify("  Brand  ")).toBe("brand");
  });

  it("accepts an optional deterministic suffix (no Math.random)", () => {
    expect(slugify("test", "abc12")).toBe("test-abc12");
    expect(slugify("test", "abc12")).toBe(slugify("test", "abc12"));
  });

  it("truncates base to 50 chars", () => {
    const long = "a".repeat(80);
    expect(slugify(long).length).toBe(50);
  });
});

describe("buildShellAiProfile", () => {
  it("includes form metadata and lifecycle", () => {
    const profile = buildShellAiProfile({
      brandName: "X",
      websiteUrl: "https://x.com",
      instagramHandle: "@x",
      industry: "Fashion",
      goal: "All of the above",
    });
    expect(profile).toMatchObject({
      instagram_handle: "x",
      industry: "Fashion",
      goal: "All of the above",
      _lifecycle: "brand_created",
    });
  });
});

const FORM = {
  brandName: "Test Brand",
  websiteUrl: "https://testbrand.com",
  instagramHandle: "@testbrand",
  industry: "Fashion",
  goal: "All of the above",
};

const KEY = "idem-test-key";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const BRAND_ID = "22222222-2222-4222-8222-222222222222";

const makeMaterializeMock = ({
  orgId = ORG_ID,
  brandId = BRAND_ID,
  sessionError = null as { message: string; code?: string } | null,
  rpcError = null as { message: string } | null,
  rpcData = null as { organization_id: string; brand_id: string } | null,
} = {}) => {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: sessionError ? null : null,
    error: sessionError,
  });
  // First select: no existing session → insert path
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
    single: vi.fn().mockResolvedValue({
      data: {
        id: "sess-1",
        user_id: "user-123",
        idempotency_key: KEY,
        status: "draft",
        current_screen: 1,
        draft_answers: {},
        organization_id: null,
        brand_id: null,
      },
      error: null,
    }),
  };

  const insert = vi.fn().mockReturnValue({
    select: () => selectChain,
  });

  const brandUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const from = vi.fn((table: string) => {
    if (table === "brands") {
      return { update: brandUpdate };
    }
    if (table !== "onboarding_sessions") throw new Error(`unexpected table: ${table}`);
    return {
      select: () => selectChain,
      insert,
    };
  });

  const rpc = vi.fn().mockResolvedValue({
    data: rpcError
      ? null
      : (rpcData ?? { organization_id: orgId, brand_id: brandId }),
    error: rpcError,
  });

  return { from, rpc, insert, selectChain, brandUpdate } as unknown as SupabaseClient & {
    from: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    brandUpdate: ReturnType<typeof vi.fn>;
  };
};

describe("createOrgAndBrand", () => {
  it("ensures a draft session then materializes via RPC", async () => {
    const supabase = makeMaterializeMock();
    const result = await createOrgAndBrand(supabase, "user-123", FORM, { idempotencyKey: KEY });
    expect(result.orgId).toBe(ORG_ID);
    expect(result.brandId).toBe(BRAND_ID);
    expect(supabase.rpc).toHaveBeenCalledWith("materialize_onboarding_session", {
      p_idempotency_key: KEY,
      p_brand_name: FORM.brandName,
      p_brand_url: FORM.websiteUrl,
    });
    expect(supabase.from).toHaveBeenCalledWith("onboarding_sessions");
    expect(supabase.from).toHaveBeenCalledWith("brands");
    expect(supabase.from).not.toHaveBeenCalledWith("organizations");
    expect(supabase.brandUpdate).toHaveBeenCalledWith({
      ai_profile: {
        instagram_handle: "testbrand",
        industry: FORM.industry,
        goal: FORM.goal,
        _lifecycle: "brand_created",
      },
    });
  });

  it("throws if the materialize RPC fails", async () => {
    const supabase = makeMaterializeMock({ rpcError: { message: "session not found" } });
    await expect(
      createOrgAndBrand(supabase, "user-abc", FORM, { idempotencyKey: KEY }),
    ).rejects.toThrow("session not found");
  });

  it("throws if RPC returns an unexpected payload", async () => {
    const supabase = makeMaterializeMock({
      rpcData: { organization_id: "not-a-uuid", brand_id: "also-bad" } as never,
    });
    // Override rpc to return garbage
    supabase.rpc = vi.fn().mockResolvedValue({
      data: { organization_id: "x", brand_id: "y" },
      error: null,
    });
    await expect(
      createOrgAndBrand(supabase, "user-abc", FORM, { idempotencyKey: KEY }),
    ).rejects.toThrow("unexpected payload");
  });
});

describe("invokeBrandIntelligence", () => {
  it("passes brandId and throws on edge error", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { message: "timeout" } });
    const supabase = { functions: { invoke } } as unknown as SupabaseClient;
    await expect(invokeBrandIntelligence(supabase, "brand-1", FORM)).rejects.toThrow("timeout");
    expect(invoke).toHaveBeenCalledWith("brand-intelligence", {
      body: { url: FORM.websiteUrl, brandId: "brand-1", brand_name: FORM.brandName },
    });
  });

  it("returns payload when brandId present", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { brandId: "brand-1", scores: [{ score_type: "visual", score: 80 }] },
      error: null,
    });
    const supabase = { functions: { invoke } } as unknown as SupabaseClient;
    const result = await invokeBrandIntelligence(supabase, "brand-1", FORM);
    expect(result.brandId).toBe("brand-1");
  });

  it("throws when edge returns mismatched brandId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { brandId: "other-brand", scores: [] },
      error: null,
    });
    const supabase = { functions: { invoke } } as unknown as SupabaseClient;
    await expect(invokeBrandIntelligence(supabase, "brand-1", FORM)).rejects.toThrow(
      "mismatched brandId",
    );
  });
});

describe("waitForCrawlCompletion — IPI-738", () => {
  const makeCrawlSupabase = (statuses: string[]) => {
    let call = 0;
    const maybeSingle = vi.fn(() => {
      const status = statuses[Math.min(call, statuses.length - 1)];
      call += 1;
      return Promise.resolve({ data: { job_status: status }, error: null });
    });
    return {
      supabase: {
        from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
      } as unknown as SupabaseClient,
      maybeSingle,
    };
  };

  it("returns complete as soon as job_status flips to complete", async () => {
    const { supabase, maybeSingle } = makeCrawlSupabase(["running", "complete"]);
    const result = await waitForCrawlCompletion(supabase, "crawl-1", { pollIntervalMs: 1, timeoutMs: 1000 });
    expect(result).toBe("complete");
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("returns failed without waiting out the full timeout", async () => {
    const { supabase } = makeCrawlSupabase(["failed"]);
    const result = await waitForCrawlCompletion(supabase, "crawl-1", { pollIntervalMs: 1, timeoutMs: 1000 });
    expect(result).toBe("failed");
  });

  it("returns timeout when job_status never resolves within the window", async () => {
    const { supabase } = makeCrawlSupabase(["queued", "running"]);
    const result = await waitForCrawlCompletion(supabase, "crawl-1", { pollIntervalMs: 5, timeoutMs: 30 });
    expect(result).toBe("timeout");
  });
});

describe("routing contract — /app/page.tsx", () => {
  it("imports createSupabaseServerClient and redirect", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "../app/(operator)/app/page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/createSupabaseServerClient/);
    expect(src).toMatch(/redirect.*\/app\/onboarding/);
    expect(src).toMatch(/count.*===.*0/);
  });
});
