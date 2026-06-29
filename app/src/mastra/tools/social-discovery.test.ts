import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/brand/persist-social-discovery", () => ({
  persistSocialDiscovery: vi.fn().mockResolvedValue({ ok: true, count: 0, status: "complete" }),
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model")),
}));

import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { persistSocialDiscovery } from "@/lib/brand/persist-social-discovery";
import { generateObject } from "ai";
import { discoverSocialChannelsTool } from "./social-discovery";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

function makeMockSupabase() {
  const fromMock = vi.fn((table: string) => {
    if (table === "brands") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: BRAND_ID,
            name: "Glossier",
            brand_url: "https://glossier.com",
            ai_profile: { category: "beauty", description: "Skin-first beauty" },
          },
          error: null,
        }),
      };
    }
    if (table === "brand_crawls") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ raw_data: {}, job_status: "complete", pages_crawled: 12 }],
          error: null,
        }),
      };
    }
    return {};
  });
  return { from: fromMock };
}

const origEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  origEnv.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  origEnv.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  origEnv.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  vi.mocked(createSupabaseAdminClient).mockReturnValue(
    makeMockSupabase() as ReturnType<typeof createSupabaseAdminClient>,
  );
  vi.mocked(persistSocialDiscovery).mockResolvedValue({
    ok: true,
    count: 0,
    status: "complete",
  });
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = origEnv.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = origEnv.SUPABASE_SERVICE_ROLE_KEY;
  process.env.GEMINI_API_KEY = origEnv.GEMINI_API_KEY;
});

describe("discoverSocialChannelsTool", () => {
  it("persists discovered channels via shared lib", async () => {
    vi.mocked(persistSocialDiscovery).mockResolvedValue({
      ok: true,
      count: 2,
      status: "complete",
    });
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        channels: [
          {
            platform: "instagram",
            url: "https://instagram.com/glossier",
            handle: "@glossier",
            verified: true,
            verification_reason: "Linked from official website",
            content_themes: ["beauty", "skincare"],
            posting_frequency: "daily",
          },
          {
            platform: "tiktok",
            url: "https://tiktok.com/@glossier",
            handle: "@glossier",
            verified: true,
            verification_reason: "Verified badge and brand name match",
            content_themes: ["beauty", "tutorials"],
            posting_frequency: "weekly",
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const result = (await discoverSocialChannelsTool.execute!(
      { brandId: BRAND_ID },
      {} as never,
    )) as { channelsFound: number; status: string };

    expect(result.channelsFound).toBe(2);
    expect(result.status).toBe("complete");
    expect(persistSocialDiscovery).toHaveBeenCalledOnce();
    expect(persistSocialDiscovery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        brandId: BRAND_ID,
        channels: expect.arrayContaining([
          expect.objectContaining({ platform: "instagram" }),
          expect.objectContaining({ platform: "tiktok" }),
        ]),
      }),
    );
  });

  it("is idempotent — persist called on each run (upsert in lib)", async () => {
    vi.mocked(persistSocialDiscovery).mockResolvedValue({
      ok: true,
      count: 1,
      status: "complete",
    });
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        channels: [
          {
            platform: "instagram",
            url: "https://instagram.com/glossier",
            handle: "@glossier",
            verified: true,
            verification_reason: "Official link",
            content_themes: ["beauty"],
            posting_frequency: "daily",
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    await discoverSocialChannelsTool.execute!({ brandId: BRAND_ID }, {} as never);
    await discoverSocialChannelsTool.execute!({ brandId: BRAND_ID }, {} as never);

    expect(persistSocialDiscovery).toHaveBeenCalledTimes(2);
  });

  it("persists failed status when Gemini throws", async () => {
    vi.mocked(generateObject).mockRejectedValue(new Error("Gemini quota exceeded"));

    const result = (await discoverSocialChannelsTool.execute!(
      { brandId: BRAND_ID },
      {} as never,
    )) as { channelsFound: number; status: string };

    expect(result.status).toBe("failed");
    expect(result.channelsFound).toBe(0);
    expect(persistSocialDiscovery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        brandId: BRAND_ID,
        channels: [],
        status: "failed",
      }),
    );
  });

  it("propagates persist failure when upsert fails", async () => {
    vi.mocked(persistSocialDiscovery).mockResolvedValue({
      ok: false,
      count: 2,
      status: "failed",
      error: "brand_social_channels upsert failed: RLS denied",
    });
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        channels: [
          {
            platform: "instagram",
            url: "https://instagram.com/glossier",
            handle: "@glossier",
            verified: true,
            verification_reason: "Official",
            content_themes: ["beauty"],
            posting_frequency: "daily",
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const result = (await discoverSocialChannelsTool.execute!(
      { brandId: BRAND_ID },
      {} as never,
    )) as { status: string; error?: string };

    expect(result.status).toBe("failed");
    expect(result.error).toContain("upsert failed");
  });

  it("rejects non-https URLs via Zod schema", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        channels: [
          {
            platform: "instagram",
            url: "javascript:alert(1)",
            handle: "@evil",
            verified: true,
            verification_reason: "test",
            content_themes: [],
            posting_frequency: "unknown",
          },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const result = (await discoverSocialChannelsTool.execute!(
      { brandId: BRAND_ID },
      {} as never,
    )) as { status: string; channelsFound: number };

    expect(result.channelsFound).toBe(0);
  });
});
