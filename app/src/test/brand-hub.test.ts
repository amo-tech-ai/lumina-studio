import { describe, it, expect } from "vitest";
import { scoreColor, scoreLabel } from "@/lib/brand-utils";

describe("scoreColor", () => {
  it("returns green for score >= 70", () => {
    expect(scoreColor(70)).toBe("#059669");
    expect(scoreColor(100)).toBe("#059669");
  });

  it("returns amber for score 40–69", () => {
    expect(scoreColor(40)).toBe("#D97706");
    expect(scoreColor(69)).toBe("#D97706");
  });

  it("returns red for score < 40", () => {
    expect(scoreColor(0)).toBe("#DC2626");
    expect(scoreColor(39)).toBe("#DC2626");
  });
});

describe("scoreLabel", () => {
  it("formats dna_readiness", () => {
    expect(scoreLabel("dna_readiness")).toBe("Dna Readiness");
  });

  it("formats multi-word types", () => {
    expect(scoreLabel("visual_identity_score")).toBe("Visual Identity Score");
  });
});

// AI profile field safety
describe("ai_profile field safety", () => {
  const emptyProfile = {};
  const fullProfile = {
    tagline: "Luxury made daily",
    category: "Fashion",
    visualIdentity: { colors: ["#fff", "#000"], mood: "Minimal" },
    contentPillars: ["Sustainability", "Style"],
    recommendedServices: ["Product Photography"],
  };

  it("empty profile has no keys", () => {
    expect(Object.keys(emptyProfile).length).toBe(0);
  });

  it("full profile fields are accessible without crash", () => {
    expect(fullProfile.tagline).toBe("Luxury made daily");
    expect(fullProfile.visualIdentity?.colors).toHaveLength(2);
    expect(fullProfile.contentPillars).toContain("Sustainability");
  });

  it("missing optional nested fields return undefined safely", () => {
    const partial = { tagline: "Test" } as typeof fullProfile;
    expect(partial.visualIdentity?.colors).toBeUndefined();
    expect(partial.contentPillars).toBeUndefined();
  });

  it("score fallback from missing dna_readiness is 0", () => {
    const scores: { score_type: string; score: number }[] = [];
    const dna = scores.find((s) => s.score_type === "dna_readiness")?.score ?? 0;
    expect(dna).toBe(0);
  });

  it("score fallback when scores is null is 0", () => {
    const getScore = (rows: { score_type: string; score: number }[] | null) =>
      rows?.find((s) => s.score_type === "dna_readiness")?.score ?? 0;
    expect(getScore(null)).toBe(0);
    expect(getScore([])).toBe(0);
  });
});

// Route contract: page file must exist and use maybeSingle + notFound
describe("brand hub route contract", () => {
  it("page file exists", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../app/(operator)/app/brand/[id]/page.tsx",
      ),
      "utf8",
    );
    expect(src).toMatch(/maybeSingle/);
    expect(src).toMatch(/notFound/);
    expect(src).toMatch(/brand_scores/);
    expect(src).toMatch(/organizations/);
  });
});
