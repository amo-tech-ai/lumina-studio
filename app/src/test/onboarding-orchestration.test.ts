import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrgAndBrand, invokeBrandIntelligence } from "@/lib/onboarding";

const FORM = {
  brandName: "Maison Test",
  websiteUrl: "https://maison-test.com",
  instagramHandle: "@maison",
  industry: "Fashion",
  goal: "Brand Intelligence",
};

describe("onboarding orchestration (IPI-46)", () => {
  it("creates shell before edge invoke — single brand row path", async () => {
    const order: string[] = [];

    const supabase = {
      from: (table: string) => {
        if (table === "organizations") {
          return {
            insert: () => ({
              select: () => ({
                single: () => {
                  order.push("org");
                  return Promise.resolve({ data: { id: "org-1" }, error: null });
                },
              }),
            }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
          };
        }
        if (table === "brands") {
          return {
            insert: () => ({
              select: () => ({
                single: () => {
                  order.push("brand");
                  return Promise.resolve({ data: { id: "brand-1" }, error: null });
                },
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
      functions: {
        invoke: vi.fn(() => {
          order.push("edge");
          return Promise.resolve({ data: { brandId: "brand-1", scores: [] }, error: null });
        }),
      },
    } as unknown as SupabaseClient;

    const { brandId } = await createOrgAndBrand(supabase, "user-1", FORM);
    await invokeBrandIntelligence(supabase, brandId, FORM);

    expect(order).toEqual(["org", "brand", "edge"]);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("brand-intelligence", {
      body: {
        url: FORM.websiteUrl,
        brandId: "brand-1",
        brand_name: FORM.brandName,
      },
    });
  });

  it("does not call edge when shell creation fails", async () => {
    const invoke = vi.fn();
    const supabase = {
      from: (table: string) => {
        if (table === "organizations") {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: { message: "org fail" } }),
              }),
            }),
          };
        }
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      },
      functions: { invoke },
    } as unknown as SupabaseClient;

    await expect(createOrgAndBrand(supabase, "user-1", FORM)).rejects.toThrow("org fail");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("page calls createOrgAndBrand before invokeBrandIntelligence", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../app/(operator)/app/onboarding/page.tsx",
      ),
      "utf8",
    );
    const shellIdx = src.indexOf("createOrgAndBrand");
    const edgeIdx = src.indexOf("invokeBrandIntelligence");
    expect(shellIdx).toBeGreaterThan(-1);
    expect(edgeIdx).toBeGreaterThan(shellIdx);
    expect(src).not.toMatch(/invoke\("brand-intelligence"/);
    expect(src).toMatch(/setShell/);
  });
});
