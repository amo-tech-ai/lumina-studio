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

const KEY = "orch-idem-key";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const BRAND_ID = "22222222-2222-4222-8222-222222222222";

const sessionRow = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: "44444444-4444-4444-8444-444444444444",
  idempotency_key: KEY,
  status: "draft" as const,
  current_screen: 1,
  draft_answers: {},
  organization_id: null,
  brand_id: null,
};

describe("onboarding orchestration (IPI-46 / IPI-832)", () => {
  it("materializes via RPC before edge invoke — single brand row path", async () => {
    const order: string[] = [];

    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => {
        order.push("session");
        return Promise.resolve({ data: sessionRow, error: null });
      },
    };

    const supabase = {
      from: (table: string) => {
        if (table === "brands") {
          order.push("shell_ai_profile");
          return {
            update: () => ({
              eq: () => Promise.resolve({ data: null, error: null }),
            }),
          };
        }
        if (table !== "onboarding_sessions") throw new Error(`unexpected table ${table}`);
        return {
          select: () => selectChain,
          insert: () => ({ select: () => selectChain }),
        };
      },
      rpc: vi.fn((name: string) => {
        order.push(name);
        return Promise.resolve({
          data: { organization_id: ORG_ID, brand_id: BRAND_ID },
          error: null,
        });
      }),
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
            data: { ok: true, data: { brandId: BRAND_ID, scores: [] } },
            error: null,
          });
        }),
      },
    } as unknown as SupabaseClient;

    const { brandId } = await createOrgAndBrand(supabase, sessionRow.user_id, FORM, {
      idempotencyKey: KEY,
    });
    await invokeStartBrandCrawl(supabase, brandId, FORM.websiteUrl, {
      idempotencyKey: `onboarding-${brandId}`,
    });
    await invokeBrandIntelligence(supabase, brandId, FORM, { crawlResultId: "crawl-1" });

    expect(order).toEqual([
      "session",
      "materialize_onboarding_session",
      "shell_ai_profile",
      "crawl",
      "edge",
    ]);
    expect(supabase.rpc).toHaveBeenCalledWith("materialize_onboarding_session", {
      p_idempotency_key: KEY,
      p_brand_name: FORM.brandName,
      p_brand_url: FORM.websiteUrl,
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("start-brand-crawl", {
      body: {
        brandId: BRAND_ID,
        websiteUrl: FORM.websiteUrl,
        idempotencyKey: `onboarding-${BRAND_ID}`,
        workflowId: undefined,
        requestId: undefined,
      },
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("brand-intelligence", {
      body: {
        url: FORM.websiteUrl,
        brandId: BRAND_ID,
        brand_name: FORM.brandName,
        crawlResultId: "crawl-1",
      },
    });
  });

  it("does not call edge when materialize RPC fails", async () => {
    const invoke = vi.fn();
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: () => Promise.resolve({ data: sessionRow, error: null }),
      single: () => Promise.resolve({ data: sessionRow, error: null }),
    };
    const supabase = {
      from: () => ({
        select: () => selectChain,
        insert: () => ({ select: () => selectChain }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "session not found" } }),
      functions: { invoke },
    } as unknown as SupabaseClient;

    await expect(
      createOrgAndBrand(supabase, "user-1", FORM, { idempotencyKey: KEY }),
    ).rejects.toThrow("session not found");
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

  it("page calls createOrgAndBrand (RPC) before invokeBrandIntelligence", async () => {
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
    expect(runBlock).toMatch(/idempotencyKey/);
    expect(runBlock).toMatch(/start-brand-crawl failed, continuing with brand intelligence/);
    expect(src).not.toMatch(/invoke\("brand-intelligence"/);
    expect(src).toMatch(/setShell/);
    expect(src).toMatch(/setIdempotencyKey/);
  });
});
