// IPI-261 · DESIGN-077 — suggestAssetRetakes unit tests
import { beforeEach, describe, expect, it, vi } from "vitest";

// suggestAssetRetakes should never touch Supabase — mock it anyway and assert
// the mutating methods are never called, proving the "zero writes" guarantee
// holds even if a future edit accidentally wires up a client.
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn(() => ({
  update: mockUpdate,
  insert: mockInsert,
  upsert: mockUpsert,
  delete: mockDelete,
}));

vi.mock("@/lib/shoot/commit-shoot-draft", () => ({
  createUserScopedClient: vi.fn(() => ({ from: mockFrom })),
}));
vi.mock("@/lib/request-token", () => ({
  requestToken: { getStore: vi.fn(() => "tok") },
}));

import {
  computeRetakeSuggestions,
  severityFromScore,
  suggestAssetRetakes,
} from "./suggestAssetRetakes";
import type { AssetDnaEvidence } from "./asset-intelligence-schemas";

function assertNoWrites() {
  expect(mockFrom).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockUpsert).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("severityFromScore", () => {
  it("maps score bands deterministically", () => {
    expect(severityFromScore(null)).toBe("none");
    expect(severityFromScore(0)).toBe("critical");
    expect(severityFromScore(49)).toBe("critical");
    expect(severityFromScore(50)).toBe("moderate");
    expect(severityFromScore(69)).toBe("moderate");
    expect(severityFromScore(70)).toBe("minor");
    expect(severityFromScore(84)).toBe("minor");
    expect(severityFromScore(85)).toBe("none");
    expect(severityFromScore(100)).toBe("none");
  });
});

describe("computeRetakeSuggestions", () => {
  it("returns an empty array when pillars are null", () => {
    expect(computeRetakeSuggestions(null)).toEqual([]);
  });

  it("maps each weak pillar to concrete, non-empty advice", () => {
    const suggestions = computeRetakeSuggestions({
      brandConsistency: 30,
      compositionQuality: 60,
      channelReadiness: 78,
      productClarity: 95,
      rationale: null,
    });
    expect(suggestions).toHaveLength(4);
    const byPillar = Object.fromEntries(suggestions.map((s) => [s.pillar, s]));
    expect(byPillar.brandConsistency.severity).toBe("critical");
    expect(byPillar.compositionQuality.severity).toBe("moderate");
    expect(byPillar.channelReadiness.severity).toBe("minor");
    expect(byPillar.productClarity.severity).toBe("none");
    for (const s of suggestions) {
      expect(s.advice.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic — same input always produces the same output", () => {
    const pillars = {
      brandConsistency: 42,
      compositionQuality: null,
      channelReadiness: 88,
      productClarity: 61,
      rationale: null,
    };
    expect(computeRetakeSuggestions(pillars)).toEqual(computeRetakeSuggestions(pillars));
  });
});

describe("suggestAssetRetakes tool", () => {
  const FOUND_EVIDENCE: AssetDnaEvidence = {
    assetId: "asset-1",
    brandId: "brand-1",
    found: true,
    dnaScore: 55,
    dnaStatus: "review",
    pillars: {
      brandConsistency: 30,
      compositionQuality: 60,
      channelReadiness: 78,
      productClarity: 95,
      rationale: null,
    },
    pillarsMalformed: false,
    error: null,
  };

  it("maps evidence to EvidenceBlockProps-compatible output with retake suggestions, and never writes", async () => {
    const result = await suggestAssetRetakes.execute!({ evidence: [FOUND_EVIDENCE] }, {} as never);

    expect(result!.results).toHaveLength(1);
    const [entry] = result!.results;
    expect(entry.assetId).toBe("asset-1");
    expect(entry.title).toBe("Retake Suggestions");
    expect(entry.score).toBe(55);
    expect(entry.suggestions?.length).toBeGreaterThan(0);
    expect(entry.suggestions?.every((s) => typeof s.text === "string" && typeof s.gain === "number")).toBe(true);
    expect(entry.retakeSuggestions).toHaveLength(4);
    assertNoWrites();
  });

  it("degrades gracefully for a not-found asset (no pillars)", async () => {
    const notFound: AssetDnaEvidence = {
      assetId: "missing",
      brandId: null,
      found: false,
      dnaScore: null,
      dnaStatus: null,
      pillars: null,
      pillarsMalformed: false,
      error: "Asset not found or not accessible",
    };

    const result = await suggestAssetRetakes.execute!({ evidence: [notFound] }, {} as never);

    expect(result!.results[0].retakeSuggestions).toEqual([]);
    expect(result!.results[0].why).toMatch(/not found or not accessible/i);
    assertNoWrites();
  });

  it("degrades gracefully for an asset found but never audited (empty pillars)", async () => {
    const neverAudited: AssetDnaEvidence = {
      assetId: "asset-2",
      brandId: "brand-1",
      found: true,
      dnaScore: null,
      dnaStatus: null,
      pillars: null,
      pillarsMalformed: false,
      error: null,
    };

    const result = await suggestAssetRetakes.execute!({ evidence: [neverAudited] }, {} as never);

    expect(result!.results[0].retakeSuggestions).toEqual([]);
    expect(result!.results[0].why).toMatch(/no dna pillar data/i);
    assertNoWrites();
  });

  it("handles a mixed-brand batch (multiple assets across brands) without error", async () => {
    const otherBrand: AssetDnaEvidence = { ...FOUND_EVIDENCE, assetId: "asset-3", brandId: "brand-2" };
    const result = await suggestAssetRetakes.execute!(
      { evidence: [FOUND_EVIDENCE, otherBrand] },
      {} as never,
    );
    expect(result!.results).toHaveLength(2);
    assertNoWrites();
  });

  it("lowers confidence when pillars were malformed", async () => {
    const malformed: AssetDnaEvidence = { ...FOUND_EVIDENCE, assetId: "asset-4", pillarsMalformed: true };
    const result = await suggestAssetRetakes.execute!({ evidence: [malformed] }, {} as never);
    expect(result!.results[0].confidence).toBe(40);
    assertNoWrites();
  });
});
