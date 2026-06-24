import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
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
    const slug = slugify("My Brand Name");
    expect(slug).toMatch(/^my-brand-name-[a-z0-9]{5}$/);
  });

  it("strips leading/trailing hyphens", () => {
    const slug = slugify("  Brand  ");
    expect(slug).toMatch(/^brand-/);
  });

  it("appends 5-char random suffix for uniqueness", () => {
    const slugA = slugify("test");
    const slugB = slugify("test");
    expect(slugA).not.toBe(slugB);
  });

  it("truncates to 50 chars before suffix", () => {
    const long = "a".repeat(80);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(56); // 50 + '-' + 5
  });
});

// --- Supabase mock helpers ---

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

  const chainScore = {
    insert: () => Promise.resolve({ error: null }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") return chainOrg;
      if (table === "brands") return chainBrand;
      return chainScore;
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
  it("creates org and brand, returns their IDs", async () => {
    const supabase = makeSupabaseMock({ orgId: "org-1", brandId: "brand-2" });
    const result = await createOrgAndBrand(supabase as unknown as SupabaseClient, "user-123", FORM, null);
    expect(result.orgId).toBe("org-1");
    expect(result.brandId).toBe("brand-2");
  });

  it("inserts org with owner_id, brand with org_id and form fields", async () => {
    const supabase = makeSupabaseMock({ orgId: "org-abc" });
    await createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM, null);
    expect(supabase.orgInsert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: "user-abc" }));
    expect(supabase.brandInsert).toHaveBeenCalledWith(expect.objectContaining({
      org_id: "org-abc",
      brand_url: FORM.websiteUrl,
      ai_profile: expect.objectContaining({ industry: FORM.industry, goal: FORM.goal }),
    }));
    expect(supabase.from).toHaveBeenCalledWith("brand_scores");
  });

  it("throws if org creation fails", async () => {
    const supabase = makeSupabaseMock({ orgError: { message: "unique violation" } });
    await expect(
      createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM, null),
    ).rejects.toThrow("unique violation");
  });

  it("throws if brand creation fails", async () => {
    const supabase = makeSupabaseMock({ brandError: { message: "brand insert fail" } });
    await expect(
      createOrgAndBrand(supabase as unknown as SupabaseClient, "user-abc", FORM, null),
    ).rejects.toThrow("brand insert fail");
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
    await createOrgAndBrand(supabase as unknown as SupabaseClient, "uid", FORM, { score: 85 });
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
