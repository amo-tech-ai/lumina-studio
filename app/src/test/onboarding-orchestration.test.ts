import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrgAndBrand, invokeStartBrandCrawl, invokeBrandIntelligence } from "@/lib/onboarding";

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
        invoke: vi.fn((name: string) => {
          order.push(name === "start-brand-crawl" ? "crawl" : "edge");
          if (name === "start-brand-crawl") {
            return Promise.resolve({
              data: { ok: true, data: { crawlId: "crawl-1" } },
              error: null,
            });
          }
          return Promise.resolve({
            data: { ok: true, data: { brandId: "brand-1", scores: [] } },
            error: null,
          });
        }),
      },
    } as unknown as SupabaseClient;

    const { brandId } = await createOrgAndBrand(supabase, "user-1", FORM);
    await invokeStartBrandCrawl(supabase, brandId, FORM.websiteUrl, {
      idempotencyKey: `onboarding-${brandId}`,
    });
    await invokeBrandIntelligence(supabase, brandId, FORM, { crawlResultId: "crawl-1" });

    expect(order).toEqual(["org", "brand", "crawl", "edge"]);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("start-brand-crawl", {
      body: {
        brandId: "brand-1",
        websiteUrl: FORM.websiteUrl,
        idempotencyKey: "onboarding-brand-1",
        workflowId: undefined,
        requestId: undefined,
      },
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("brand-intelligence", {
      body: {
        url: FORM.websiteUrl,
        brandId: "brand-1",
        brand_name: FORM.brandName,
        crawlResultId: "crawl-1",
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

  it("continues to brand intelligence when crawl start fails", async () => {
    const order: string[] = [];

    const supabase = {
      functions: {
        invoke: vi.fn((name: string) => {
          order.push(name);
          if (name === "start-brand-crawl") {
            return Promise.resolve({
              data: { ok: false, error: { code: "config_error", message: "missing key" } },
              error: null,
            });
          }
          return Promise.resolve({
            data: { ok: true, data: { brandId: "brand-1", scores: [] } },
            error: null,
          });
        }),
      },
    } as unknown as SupabaseClient;

    try {
      await invokeStartBrandCrawl(supabase, "brand-1", FORM.websiteUrl, {
        idempotencyKey: "onboarding-brand-1",
      });
    } catch {
      // non-fatal in onboarding page
    }

    await invokeBrandIntelligence(supabase, "brand-1", FORM);

    expect(order).toEqual(["start-brand-crawl", "brand-intelligence"]);
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
    const runBlock = src.match(/const runAnalysis = async \(\) => \{[\s\S]*?\n  \};/)?.[0];
    expect(runBlock).toBeTruthy();
    if (!runBlock) return;
    const shellIdx = runBlock.indexOf("await createOrgAndBrand");
    const crawlIdx = runBlock.indexOf("await invokeStartBrandCrawl");
    const edgeIdx = runBlock.indexOf("await invokeBrandIntelligence");
    expect(shellIdx).toBeGreaterThan(-1);
    expect(crawlIdx).toBeGreaterThan(shellIdx);
    expect(edgeIdx).toBeGreaterThan(crawlIdx);
    expect(runBlock).toMatch(/start-brand-crawl failed, continuing with brand intelligence/);
    expect(src).not.toMatch(/invoke\("brand-intelligence"/);
    expect(src).toMatch(/setShell/);
  });
});
