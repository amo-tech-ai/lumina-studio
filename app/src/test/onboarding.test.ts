import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateUrl, slugify, createOrgAndBrand, buildShellAiProfile, invokeBrandIntelligence } from "@/lib/onboarding";

// IPI-46 — onboarding unit tests

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
    const slug = slugify("My Brand Name");
    expect(slug).toMatch(/^my-brand-name-[a-z0-9]{5}$/);
  });

  it("strips leading/trailing hyphens", () => {
    const slug = slugify("  Brand  ");
    expect(slug).toMatch(/^brand-/);
  });

  it("appends 5-char random suffix for uniqueness", () => {
    const rand = vi.spyOn(Math, "random").mockReturnValueOnce(0.111111).mockReturnValueOnce(0.999999);
    const slugA = slugify("test");
    const slugB = slugify("test");
    expect(slugA).not.toBe(slugB);
    rand.mockRestore();
  });

  it("truncates to 50 chars before suffix", () => {
    const long = "a".repeat(80);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(56);
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

type DbError = { message: string } | null;

const makeSingle = (data: { id: string } | null, error: DbError = null) =>
  ({ data, error });

const makeSupabaseMock = ({
  orgId = "org-123",
  brandId = "brand-456",
  orgError = null,
  brandError = null,
}: {
  orgId?: string;
  brandId?: string;
  orgError?: DbError;
  brandError?: DbError;
} = {}) => {
  const orgInsert = vi.fn(() => chainOrg);
  const brandInsert = vi.fn(() => chainBrand);

  const chainOrg = {
    insert: orgInsert,
    select: () => chainOrg,
    single: () => Promise.resolve(makeSingle(orgError ? null : { id: orgId }, orgError)),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  };

  const chainBrand = {
    insert: brandInsert,
    select: () => chainBrand,
    single: () => Promise.resolve(makeSingle(brandError ? null : { id: brandId }, brandError)),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") return chainOrg;
      if (table === "brands") return chainBrand;
      throw new Error(`unexpected table: ${table}`);
    }),
    orgInsert,
    brandInsert,
  };
};

const FORM = {
  brandName: "Test Brand",
  websiteUrl: "https://testbrand.com",
  instagramHandle: "@testbrand",
  industry: "Fashion",
  goal: "All of the above",
};

describe("createOrgAndBrand", () => {
  it("creates org and brand shell, returns their IDs", async () => {
    const supabase = makeSupabaseMock({ orgId: "org-1", brandId: "brand-2" });
    const result = await createOrgAndBrand(supabase as unknown as SupabaseClient, "user-123", FORM);
    expect(result.orgId).toBe("org-1");
    expect(result.brandId).toBe("brand-2");
  });

  it("inserts org with owner_id, brand with org_id and shell ai_profile", async () => {
    const supabase = makeSupabaseMock({ orgId: "org-abc" });
    await createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM);
    expect(supabase.orgInsert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: "user-abc" }));
    expect(supabase.brandInsert).toHaveBeenCalledWith(expect.objectContaining({
      org_id: "org-abc",
      brand_url: FORM.websiteUrl,
      ai_profile: expect.objectContaining({ industry: FORM.industry, goal: FORM.goal, _lifecycle: "brand_created" }),
    }));
    expect(supabase.from).not.toHaveBeenCalledWith("brand_scores");
  });

  it("throws if org creation fails", async () => {
    const supabase = makeSupabaseMock({ orgError: { message: "unique violation" } });
    await expect(
      createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM),
    ).rejects.toThrow("unique violation");
  });

  it("throws if brand creation fails", async () => {
    const supabase = makeSupabaseMock({ brandError: { message: "brand insert fail" } });
    await expect(
      createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM),
    ).rejects.toThrow("brand insert fail");
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
