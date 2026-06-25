import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @supabase/supabase-js before importing the module
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

// Mock ai generateObject
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

// Mock @ai-sdk/google
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model")),
}));

import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { discoverSocialChannels } from "./social-discovery";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const insertMock = vi.fn().mockResolvedValue({ error: null });

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
    if (table === "brand_crawl_results") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ raw_data: {}, status: "complete", pages_crawled: 12 }],
          error: null,
        }),
      };
    }
    if (table === "brand_social_channels") {
      return { upsert: upsertMock };
    }
    if (table === "brand_agent_results") {
      return { insert: insertMock };
    }
    return {};
  });

  return { from: fromMock, _upsertMock: upsertMock, _insertMock: insertMock, ...overrides };
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
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = origEnv.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = origEnv.SUPABASE_SERVICE_ROLE_KEY;
  process.env.GEMINI_API_KEY = origEnv.GEMINI_API_KEY;
});

describe("discoverSocialChannels tool", () => {
  it("upserts discovered channels and logs run", async () => {
    const mockSupabase = makeMockSupabase();
    vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>);

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

    // @ts-expect-error Mastra execute requires context arg at runtime; undefined is safe in unit tests
    const result = await discoverSocialChannels.execute!({ brandId: BRAND_ID }) as { channelsFound: number; status: string; channels: unknown[] };

    expect(result.channelsFound).toBe(2);
    expect(result.status).toBe("complete");
    expect(mockSupabase._upsertMock).toHaveBeenCalledOnce();
    expect(mockSupabase._upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ platform: "instagram", brand_id: BRAND_ID }),
        expect.objectContaining({ platform: "tiktok", brand_id: BRAND_ID }),
      ]),
      { onConflict: "brand_id,platform" },
    );
    expect(mockSupabase._insertMock).toHaveBeenCalledOnce();
    expect(mockSupabase._insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ agent_name: "social-discovery", status: "complete" }),
    );
  });

  it("is idempotent — upsert on conflict, not insert", async () => {
    const mockSupabase = makeMockSupabase();
    vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>);

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

    // Run twice — upsert should be called both times (not error on duplicate)
    // @ts-expect-error Mastra execute requires context arg at runtime; undefined is safe in unit tests
    await discoverSocialChannels.execute!({ brandId: BRAND_ID });
    // @ts-expect-error Mastra execute requires context arg at runtime; undefined is safe in unit tests
    await discoverSocialChannels.execute!({ brandId: BRAND_ID });

    expect(mockSupabase._upsertMock).toHaveBeenCalledTimes(2);
    // Both calls use onConflict — no duplicate rows created at DB level
    for (const call of mockSupabase._upsertMock.mock.calls) {
      expect(call[1]).toEqual({ onConflict: "brand_id,platform" });
    }
  });

  it("logs failed status when Gemini throws", async () => {
    const mockSupabase = makeMockSupabase();
    vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>);
    vi.mocked(generateObject).mockRejectedValue(new Error("Gemini quota exceeded"));

    // @ts-expect-error Mastra execute requires context arg at runtime; undefined is safe in unit tests
    const result = await discoverSocialChannels.execute!({ brandId: BRAND_ID }) as { channelsFound: number; status: string };

    expect(result.status).toBe("failed");
    expect(result.channelsFound).toBe(0);
    // No upsert attempted on failure
    expect(mockSupabase._upsertMock).not.toHaveBeenCalled();
    // But run is still logged
    expect(mockSupabase._insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });
});
