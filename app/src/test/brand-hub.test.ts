import { describe, it, expect } from "vitest";
import { computeDnaScore } from "@/lib/brand-scores";
import {
  buildActivityTimeline,
  filterDisplayScores,
  formatBrandHubDateTime,
  formatInstagramHandle,
  hasMeaningfulProfile,
  hubTabLabel,
  intakeStatusLabel,
  isReAnalyzeDisabled,
  normalizeDisplayScore,
  parseAiProfile,
} from "@/lib/brand-hub";
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
  it("formats dna_readiness with DNA acronym", () => {
    expect(scoreLabel("dna_readiness")).toBe("DNA Readiness");
    expect(scoreLabel("Dna_readiness")).toBe("DNA Readiness");
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

  it("DNA score uses average of base four scores", () => {
    const dna = computeDnaScore([
      { score_type: "visual", score: 70 },
      { score_type: "audience", score: 80 },
      { score_type: "consistency", score: 90 },
      { score_type: "commerce_readiness", score: 60 },
    ]);
    expect(dna).toBe(75);
  });

  it("DNA score is 0 when base scores missing", () => {
    expect(computeDnaScore([])).toBe(0);
    expect(computeDnaScore(null)).toBe(0);
  });

  it("DNA score ignores dna_readiness row", () => {
    const dna = computeDnaScore([
      { score_type: "visual", score: 80 },
      { score_type: "audience", score: 80 },
      { score_type: "consistency", score: 80 },
      { score_type: "commerce_readiness", score: 80 },
      { score_type: "dna_readiness", score: 10 },
    ]);
    expect(dna).toBe(80);
  });
});

describe("brand-hub helpers", () => {
  it("hubTabLabel returns human labels", () => {
    expect(hubTabLabel("overview")).toBe("Overview");
    expect(hubTabLabel("scores")).toBe("Scores");
  });

  it("intakeStatusLabel maps known statuses", () => {
    expect(intakeStatusLabel("ready")).toBe("Ready");
    expect(intakeStatusLabel("failed")).toBe("Failed");
  });

  it("isReAnalyzeDisabled during running states", () => {
    expect(isReAnalyzeDisabled("analysis_running")).toBe(true);
    expect(isReAnalyzeDisabled("ready")).toBe(false);
  });

  it("filterDisplayScores removes dna_readiness", () => {
    const filtered = filterDisplayScores([
      { score_type: "visual", score: 70 },
      { score_type: "dna_readiness", score: 99 },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].score_type).toBe("visual");
  });

  it("parseAiProfile and hasMeaningfulProfile", () => {
    expect(hasMeaningfulProfile(parseAiProfile({}))).toBe(false);
    expect(hasMeaningfulProfile(parseAiProfile({ tagline: "Hi" }))).toBe(true);
    expect(hasMeaningfulProfile(parseAiProfile({ _error: "x" }))).toBe(false);
    expect(hasMeaningfulProfile(parseAiProfile({ tagline: "" }))).toBe(false);
    expect(hasMeaningfulProfile(parseAiProfile({ tagline: null }))).toBe(false);
    expect(hasMeaningfulProfile(parseAiProfile({ visualIdentity: {} }))).toBe(false);
  });

  it("parseAiProfile drops non-array chip fields from malformed LLM output", () => {
    const profile = parseAiProfile({
      values: "Sustainability",
      contentPillars: 42,
      recommendedServices: { foo: "bar" },
      evidenceSources: "https://example.com",
      competitorSignals: null,
      visualIdentity: { colors: "not-an-array" },
    });
    expect(profile.values).toBeUndefined();
    expect(profile.contentPillars).toBeUndefined();
    expect(profile.recommendedServices).toBeUndefined();
    expect(profile.evidenceSources).toBeUndefined();
    expect(profile.competitorSignals).toBeUndefined();
    expect(profile.visualIdentity?.colors).toBeUndefined();
  });

  it("parseAiProfile keeps valid string arrays", () => {
    const profile = parseAiProfile({
      values: ["Craft", "Quality"],
      visualIdentity: { colors: ["#111", "#eee"] },
    });
    expect(profile.values).toEqual(["Craft", "Quality"]);
    expect(profile.visualIdentity?.colors).toEqual(["#111", "#eee"]);
  });

  it("buildActivityTimeline omits completed while analysis_running", () => {
    const events = buildActivityTimeline({
      createdAt: "2026-01-01T00:00:00Z",
      intakeStatus: "analysis_running",
      profile: { analyzedAt: "2026-01-02T00:00:00Z" },
    });
    expect(events.some((e) => e.label === "Analysis completed")).toBe(false);
    expect(events.some((e) => e.label === "Analysis started")).toBe(true);
  });

  it("buildActivityTimeline includes failure detail", () => {
    const events = buildActivityTimeline({
      createdAt: "2026-01-01T00:00:00Z",
      intakeStatus: "failed",
      profile: { _error: "Gemini timeout" },
    });
    expect(events.some((e) => e.id === "failed")).toBe(true);
    expect(events.find((e) => e.id === "failed")?.detail).toBe("Gemini timeout");
  });

  it("formatBrandHubDateTime uses fixed locale and rejects invalid input", () => {
    const formatted = formatBrandHubDateTime("2026-06-24T12:00:00Z");
    expect(formatted).toContain("2026-06-24");
    expect(formatted).toMatch(/12:00/);
    expect(formatBrandHubDateTime("not-a-date")).toBeNull();
  });

  it("formatInstagramHandle strips duplicate leading at-signs", () => {
    expect(formatInstagramHandle("@maison")).toBe("@maison");
    expect(formatInstagramHandle("maison")).toBe("@maison");
    expect(formatInstagramHandle("@@maison")).toBe("@maison");
    expect(formatInstagramHandle("   ")).toBe("");
  });

  it("normalizeDisplayScore clamps and handles invalid values", () => {
    expect(normalizeDisplayScore(150)).toBe(100);
    expect(normalizeDisplayScore(-5)).toBe(0);
    expect(normalizeDisplayScore("72.5")).toBe(72.5);
    expect(normalizeDisplayScore("nope")).toBe(0);
    expect(normalizeDisplayScore(Number.NaN)).toBe(0);
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
    expect(src).toMatch(/computeDnaScore/);
    expect(src).toMatch(/brand_scores/);
    expect(src).toMatch(/organizations/);
    expect(src).toMatch(/intake_status/);
    expect(src).toMatch(/BrandDetailWorkspace/);
    expect(src).toMatch(/getBaseScores/);
  });

  it("brand list page surfaces brand_scores errors instead of zeroing DNA", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../app/(operator)/app/brand/page.tsx",
      ),
      "utf8",
    );
    expect(src).toMatch(/scoresError/);
    expect(src).toMatch(/Unable to load brand scores/);
    expect(src).toMatch(/fetchError/);
  });
});
