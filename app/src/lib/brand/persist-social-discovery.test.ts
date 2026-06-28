import { describe, it, expect, vi, beforeEach } from "vitest";
import { persistSocialDiscovery } from "./persist-social-discovery";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

function makeAdminMock(opts: {
  upsertError?: { message: string } | null;
  logError?: { message: string } | null;
} = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: opts.upsertError ?? null });
  const insert = vi.fn().mockResolvedValue({ error: opts.logError ?? null });

  return {
    from: vi.fn((table: string) => {
      if (table === "brand_social_channels") {
        return { upsert };
      }
      if (table === "brand_agent_results") {
        return { insert };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    upsert,
    insert,
  };
}

describe("persistSocialDiscovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts channels and logs complete run", async () => {
    const admin = makeAdminMock();
    const result = await persistSocialDiscovery(admin as never, {
      brandId: BRAND_ID,
      startedAt: "2026-06-28T00:00:00.000Z",
      channels: [
        {
          platform: "instagram",
          url: "https://instagram.com/glossier",
          handle: "@glossier",
          verified: true,
          verification_reason: "Official site link",
          content_themes: ["beauty"],
          posting_frequency: "daily",
        },
      ],
    });

    expect(result).toEqual({ ok: true, count: 1, status: "complete" });
    expect(admin.upsert).toHaveBeenCalledOnce();
    expect(admin.insert).toHaveBeenCalledOnce();
  });

  it("returns failed when upsert errors", async () => {
    const admin = makeAdminMock({ upsertError: { message: "RLS denied" } });
    const result = await persistSocialDiscovery(admin as never, {
      brandId: BRAND_ID,
      channels: [
        {
          platform: "tiktok",
          url: "https://tiktok.com/@brand",
          handle: "@brand",
          verified: true,
          verification_reason: "verified",
          content_themes: [],
          posting_frequency: null,
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("upsert failed");
      expect(result.count).toBe(1);
    }
  });

  it("logs failed upstream status with zero channels", async () => {
    const admin = makeAdminMock();
    const result = await persistSocialDiscovery(admin as never, {
      brandId: BRAND_ID,
      channels: [],
      status: "failed",
      error: "Gemini quota exceeded",
    });

    expect(result.ok).toBe(false);
    expect(admin.upsert).not.toHaveBeenCalled();
    expect(admin.insert).toHaveBeenCalledOnce();
  });

  it("returns failed when agent log insert errors", async () => {
    const admin = makeAdminMock({ logError: { message: "insert failed" } });
    const result = await persistSocialDiscovery(admin as never, {
      brandId: BRAND_ID,
      channels: [
        {
          platform: "instagram",
          url: "https://instagram.com/glossier",
          handle: "@glossier",
          verified: true,
          verification_reason: "Official site link",
          content_themes: ["beauty"],
          posting_frequency: "daily",
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("brand_agent_results insert failed");
    }
  });
});
