// IPI-156 · CAMP-001 — draftCampaignBrief unit tests
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMaybeSingle = vi.fn();
const mockEqBrand = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelectBrand = vi.fn(() => ({ eq: mockEqBrand }));
const mockEqScores = vi.fn();
const mockSelectScores = vi.fn(() => ({ eq: mockEqScores }));
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn((table: string) => {
  if (table === "brands") return { select: mockSelectBrand };
  if (table === "brand_scores") return { select: mockSelectScores };
  return {};
});
const mockGetStore = vi.fn(() => "tok");

vi.mock("@/lib/shoot/commit-shoot-draft", () => ({
  createUserScopedClient: vi.fn(() => ({ from: mockFrom })),
}));
vi.mock("@/lib/request-token", () => ({
  requestToken: { getStore: (...args: unknown[]) => mockGetStore(...args) },
}));
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

import { generateObject } from "ai";
import {
  draftCampaignBrief,
  formatBrandDnaContext,
} from "./draftCampaignBrief";

const BRAND_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const MOCK_DRAFT = {
  mood: "Warm editorial minimalism",
  visualDirection: "Soft natural light, neutral palette, clean product focus",
  channelStrategy: "Hero imagery for Instagram and TikTok, detail crops for Pinterest",
  contentPillars: ["Everyday elegance", "Skin-first beauty", "Sustainable craft"],
  heroMessage: "Beauty that feels effortless",
  moodboardNotes: "Golden-hour window light, linen textures, dewy skin close-ups",
};

function assertNoWrites() {
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockUpsert).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStore.mockReturnValue("tok");
  mockEqScores.mockResolvedValue({
    data: [
      { score_type: "visual", score: 78 },
      { score_type: "audience", score: 65 },
    ],
    error: null,
  });
  mockMaybeSingle.mockResolvedValue({
    data: {
      id: BRAND_ID,
      name: "Lumina",
      brand_url: "https://lumina.test",
      ai_profile: {
        overview: "DTC skincare",
        tagline: "Glow naturally",
        brandVoice: "Warm, confident",
        contentPillars: ["Science-backed", "Clean beauty"],
        visualIdentity: { mood: "Fresh minimal", colors: ["#F5E6D3", "#2C3E50"] },
      },
    },
    error: null,
  });
  vi.mocked(generateObject).mockResolvedValue({
    object: MOCK_DRAFT,
  } as Awaited<ReturnType<typeof generateObject>>);
});

describe("formatBrandDnaContext", () => {
  it("includes profile fields and DNA scores", () => {
    const text = formatBrandDnaContext(
      { name: "Lumina", brand_url: "https://lumina.test" },
      {
        overview: "DTC skincare",
        tagline: "Glow naturally",
        brandVoice: "Warm",
        contentPillars: ["Clean beauty"],
        visualIdentity: { mood: "Fresh", colors: ["#fff"] },
      },
      [{ score_type: "visual", score: 80 }],
    );
    expect(text).toContain("Brand: Lumina");
    expect(text).toContain("Overview: DTC skincare");
    expect(text).toContain("Visual: 80");
  });
});

describe("draftCampaignBrief", () => {
  it("returns a draft proposal without persisting", async () => {
    const result = await draftCampaignBrief.execute!(
      {
        brandId: BRAND_ID,
        campaignName: "Spring Glow",
        channels: ["instagram", "tiktok"],
        goal: "Launch new serum line",
      },
      {} as never,
    );

    expect(result?.ok).toBe(true);
    expect(result?.draft?.status).toBe("draft");
    expect(result?.draft?.requiresHumanApproval).toBe(true);
    expect(result?.draft?.persisted).toBe(false);
    expect(result?.draft?.mood).toBe(MOCK_DRAFT.mood);
    expect(result?.draft?.summary).toMatch(/Awaiting operator review/);
    expect(generateObject).toHaveBeenCalled();
    assertNoWrites();
  });

  it("fails when brand is not accessible", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await draftCampaignBrief.execute!(
      { brandId: BRAND_ID, campaignName: "Test" },
      {} as never,
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/not found/i);
    expect(result?.draft).toBeNull();
    expect(generateObject).not.toHaveBeenCalled();
    assertNoWrites();
  });

  it("fails without access token", async () => {
    mockGetStore.mockReturnValue(undefined);

    const result = await draftCampaignBrief.execute!(
      { brandId: BRAND_ID, campaignName: "Test" },
      {} as never,
    );

    expect(result?.ok).toBe(false);
    expect(result?.error).toMatch(/Access token/);
    expect(generateObject).not.toHaveBeenCalled();
  });
});
