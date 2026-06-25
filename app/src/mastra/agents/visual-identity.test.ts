import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.GEMINI_API_KEY = "test-gemini-key";

const MOCK_VISUAL = {
  primaryColors: ["#E87C4D"],
  secondaryColors: ["#F3B93C"],
  typographyStyle: "serif",
  logoDescription: "Minimal wordmark",
  layoutStyle: "editorial",
  imageAesthetic: "lifestyle",
  brandMood: "luxury",
  designPatterns: ["clean lines"],
  colorTemperature: "warm",
  visualPersonality: "Premium fashion brand.",
};

vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({ object: MOCK_VISUAL }),
}));

const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockMaybeSingle = vi.fn().mockResolvedValue({
  data: { ai_profile: { tagline: "Existing", _lifecycle: "scores_complete" } },
});
const mockSelectEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate });

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const BRAND_ID = "00000000-0000-0000-0000-000000000001";

describe("visual-identity agent", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.FIRECRAWL_API_KEY;
    // Re-wire mocks after clearAllMocks
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockMaybeSingle.mockResolvedValue({ data: { ai_profile: { tagline: "Existing", _lifecycle: "scores_complete" } } });
    mockSelectEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
    const { generateObject } = await import("ai");
    vi.mocked(generateObject).mockResolvedValue({ object: MOCK_VISUAL } as Awaited<ReturnType<typeof generateObject>>);
  });

  it("exports visualIdentityAgent with correct id", async () => {
    const { visualIdentityAgent } = await import("./visual-identity");
    expect(visualIdentityAgent).toBeDefined();
    expect((visualIdentityAgent as { id: string }).id).toBe("visual-identity");
  });

  it("uses text-only prompt when no FIRECRAWL_API_KEY (no screenshot)", async () => {
    const { generateObject } = await import("ai");
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await extractVisualIdentityTool.execute({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never);
    expect(generateObject).toHaveBeenCalled();
    const call = vi.mocked(generateObject).mock.calls[0][0];
    const content = (call.messages as { role: string; content: unknown }[])?.[0]?.content;
    expect(typeof content).toBe("string");
  });

  it("merges visualIdentity into existing ai_profile without overwriting other fields", async () => {
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await extractVisualIdentityTool.execute({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never);
    expect(mockUpdate).toHaveBeenCalled();
    const updatedProfile = mockUpdate.mock.calls[0]?.[0]?.ai_profile as Record<string, unknown>;
    expect(updatedProfile.tagline).toBe("Existing");
    expect(updatedProfile._lifecycle).toBe("scores_complete");
    expect(updatedProfile.visualIdentity).toMatchObject(MOCK_VISUAL);
  });

  it("returns merged: true on success", async () => {
    const { extractVisualIdentityTool } = await import("./visual-identity");
    const result = await extractVisualIdentityTool.execute({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never) as { merged: boolean };
    expect(result.merged).toBe(true);
  });

  it("throws when Supabase update fails", async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: "DB error" } });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
    const { extractVisualIdentityTool } = await import("./visual-identity");
    await expect(
      extractVisualIdentityTool.execute({ brandId: BRAND_ID, homepageUrl: "https://example.com" }, {} as never)
    ).rejects.toThrow("Failed to merge visual identity: DB error");
  });
});
