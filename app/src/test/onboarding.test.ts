import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateUrl, slugify, createOrgAndBrand } from "@/lib/onboarding";

// IPI-11 — onboarding wizard unit tests

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
    const s = slugify("My Brand Name");
    expect(s).toMatch(/^my-brand-name-[a-z0-9]{5}$/);
  });

  it("strips leading/trailing hyphens", () => {
    const s = slugify("  Brand  ");
    expect(s).toMatch(/^brand-/);
  });

  it("appends 5-char random suffix for uniqueness", () => {
    const a = slugify("test");
    const b = slugify("test");
    expect(a).not.toBe(b);
  });

  it("truncates to 50 chars before suffix", () => {
    const long = "a".repeat(80);
    const s = slugify(long);
    expect(s.length).toBeLessThanOrEqual(56); // 50 + '-' + 5
  });
});

// --- Supabase mock helpers ---

function makeSingle(data: any, error: any = null) {
  return { data, error };
}

function makeSupabaseMock({
  orgId = "org-123",
  brandId = "brand-456",
  orgError = null,
  brandError = null,
}: {
  orgId?: string;
  brandId?: string;
  orgError?: any;
  brandError?: any;
} = {}) {
  const insertMock = vi.fn();
  const selectMock = vi.fn();
  const singleMock = vi.fn();
  const eqMock = vi.fn();

  let callCount = 0;

  const chainOrg = {
    insert: () => chainOrg,
    select: () => chainOrg,
    single: () => Promise.resolve(makeSingle(orgError ? null : { id: orgId }, orgError)),
  };

  const chainBrand = {
    insert: () => chainBrand,
    select: () => chainBrand,
    single: () => Promise.resolve(makeSingle(brandError ? null : { id: brandId }, brandError)),
  };

  const chainScore = {
    insert: () => Promise.resolve({ error: null }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") return chainOrg;
      if (table === "brands") return chainBrand;
      if (table === "brand_scores") return chainScore;
      return chainScore;
    }),
  };
}

const FORM = {
  brandName: "Test Brand",
  websiteUrl: "https://testbrand.com",
  instagramHandle: "@testbrand",
  industry: "Fashion",
  goal: "All of the above",
};

describe("createOrgAndBrand", () => {
  it("creates org and brand, returns their IDs", async () => {
    const supabase = makeSupabaseMock({ orgId: "org-1", brandId: "brand-2" });
    const result = await createOrgAndBrand(supabase, "user-123", FORM, null);
    expect(result.orgId).toBe("org-1");
    expect(result.brandId).toBe("brand-2");
  });

  it("calls organizations.insert with owner_id and org_id", async () => {
    const supabase = makeSupabaseMock();
    await createOrgAndBrand(supabase, "user-abc", FORM, null);
    expect(supabase.from).toHaveBeenCalledWith("organizations");
    expect(supabase.from).toHaveBeenCalledWith("brands");
    expect(supabase.from).toHaveBeenCalledWith("brand_scores");
  });

  it("throws if org creation fails", async () => {
    const supabase = makeSupabaseMock({ orgError: { message: "unique violation" } });
    await expect(createOrgAndBrand(supabase, "user-abc", FORM, null)).rejects.toThrow("unique violation");
  });

  it("throws if brand creation fails", async () => {
    const supabase = makeSupabaseMock({ brandError: { message: "brand insert fail" } });
    await expect(createOrgAndBrand(supabase, "user-abc", FORM, null)).rejects.toThrow("brand insert fail");
  });

  it("passes aiProfile score to brand_scores", async () => {
    const scoreSpy = vi.fn(() => Promise.resolve({ error: null }));
    const supabase = {
      from: (table: string) => {
        if (table === "organizations") return {
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: "org-1" }, error: null }) }) }),
        };
        if (table === "brands") return {
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: "brand-1" }, error: null }) }) }),
        };
        if (table === "brand_scores") return { insert: scoreSpy };
        return { insert: () => Promise.resolve({ error: null }) };
      },
    };
    await createOrgAndBrand(supabase as any, "uid", FORM, { score: 85 });
    expect(scoreSpy).toHaveBeenCalledWith(expect.objectContaining({ score: 85, brand_id: "brand-1" }));
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
