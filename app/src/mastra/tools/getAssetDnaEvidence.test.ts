// IPI-261 · DESIGN-077 — getAssetDnaEvidence unit tests
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIn = vi.fn();
const mockSelect = vi.fn(() => ({ in: mockIn }));
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
  upsert: mockUpsert,
  delete: mockDelete,
}));
const mockGetStore = vi.fn(() => "tok");

vi.mock("@/lib/shoot/commit-shoot-draft", () => ({
  createUserScopedClient: vi.fn(() => ({ from: mockFrom })),
}));
vi.mock("@/lib/request-token", () => ({
  requestToken: { getStore: (...args: unknown[]) => mockGetStore(...args) },
}));

import { getAssetDnaEvidence, parseDnaPillars } from "./getAssetDnaEvidence";

const ASSET_A = "11111111-1111-4111-8111-111111111111";
const ASSET_B = "22222222-2222-4222-8222-222222222222";
const ASSET_MISSING = "33333333-3333-4333-8333-333333333333";

function assertNoWrites() {
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockUpsert).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStore.mockReturnValue("tok");
  mockSelect.mockImplementation(() => ({ in: mockIn }));
});

describe("parseDnaPillars", () => {
  it("returns null pillars, not malformed, for null/undefined", () => {
    expect(parseDnaPillars(null)).toEqual({ pillars: null, malformed: false });
    expect(parseDnaPillars(undefined)).toEqual({ pillars: null, malformed: false });
  });

  it("returns null pillars, not malformed, for an empty object (never audited)", () => {
    expect(parseDnaPillars({})).toEqual({ pillars: null, malformed: false });
  });

  it("parses a well-formed pillars object", () => {
    const { pillars, malformed } = parseDnaPillars({
      brandConsistency: 82,
      compositionQuality: 74,
      channelReadiness: 90,
      productClarity: 65,
      rationale: "Solid product shot",
    });
    expect(malformed).toBe(false);
    expect(pillars).toEqual({
      brandConsistency: 82,
      compositionQuality: 74,
      channelReadiness: 90,
      productClarity: 65,
      rationale: "Solid product shot",
    });
  });

  it("flags an array payload as malformed", () => {
    const { pillars, malformed } = parseDnaPillars([1, 2, 3]);
    expect(malformed).toBe(true);
    expect(pillars).toBeNull();
  });

  it("flags a non-empty object with no recognizable pillar keys as malformed", () => {
    const { pillars, malformed } = parseDnaPillars({ foo: "bar" });
    expect(malformed).toBe(true);
    expect(pillars?.brandConsistency).toBeNull();
  });

  it("flags wrong-typed pillar values as malformed but keeps valid ones", () => {
    const { pillars, malformed } = parseDnaPillars({
      brandConsistency: "high",
      compositionQuality: 74,
    });
    expect(malformed).toBe(true);
    expect(pillars?.compositionQuality).toBe(74);
    expect(pillars?.brandConsistency).toBeNull();
  });

  it("flags a non-string rationale as malformed", () => {
    const { malformed } = parseDnaPillars({ brandConsistency: 80, rationale: 123 });
    expect(malformed).toBe(true);
  });
});

describe("getAssetDnaEvidence", () => {
  it("returns evidence for RLS-visible assets and performs zero writes", async () => {
    mockIn.mockResolvedValueOnce({
      data: [
        {
          id: ASSET_A,
          brand_id: "brand-1",
          dna_score: "82.5",
          dna_status: "approved",
          dna_pillars: {
            brandConsistency: 82,
            compositionQuality: 74,
            channelReadiness: 90,
            productClarity: 65,
            rationale: "Solid",
          },
        },
      ],
      error: null,
    });

    const result = await getAssetDnaEvidence.execute!({ assetIds: [ASSET_A] }, {} as never);

    expect(result!.evidence).toHaveLength(1);
    expect(result!.evidence[0]).toMatchObject({
      assetId: ASSET_A,
      brandId: "brand-1",
      found: true,
      dnaScore: 82.5,
      dnaStatus: "approved",
      pillarsMalformed: false,
    });
    expect(result!.notFoundCount).toBe(0);
    assertNoWrites();
  });

  it("marks assets not returned by the RLS-scoped query as not found (covers both missing and unauthorized)", async () => {
    mockIn.mockResolvedValueOnce({
      data: [{ id: ASSET_A, brand_id: "brand-1", dna_score: null, dna_status: null, dna_pillars: {} }],
      error: null,
    });

    const result = await getAssetDnaEvidence.execute!(
      { assetIds: [ASSET_A, ASSET_MISSING] },
      {} as never,
    );

    expect(result!.evidence).toHaveLength(2);
    const missing = result!.evidence.find((e) => e.assetId === ASSET_MISSING);
    expect(missing).toMatchObject({ found: false, error: "Asset not found or not accessible" });
    expect(result!.notFoundCount).toBe(1);
    assertNoWrites();
  });

  it("returns evidence spanning multiple brands without objecting (read-only, no domain gate)", async () => {
    mockIn.mockResolvedValueOnce({
      data: [
        { id: ASSET_A, brand_id: "brand-1", dna_score: 80, dna_status: "approved", dna_pillars: {} },
        { id: ASSET_B, brand_id: "brand-2", dna_score: 55, dna_status: "review", dna_pillars: {} },
      ],
      error: null,
    });

    const result = await getAssetDnaEvidence.execute!(
      { assetIds: [ASSET_A, ASSET_B] },
      {} as never,
    );

    const brandIds = result!.evidence.map((e) => e.brandId);
    expect(brandIds).toEqual(["brand-1", "brand-2"]);
    assertNoWrites();
  });

  it("handles malformed dna_pillars gracefully instead of throwing", async () => {
    mockIn.mockResolvedValueOnce({
      data: [{ id: ASSET_A, brand_id: "brand-1", dna_score: 40, dna_status: "blocked", dna_pillars: "not-an-object" }],
      error: null,
    });

    const result = await getAssetDnaEvidence.execute!({ assetIds: [ASSET_A] }, {} as never);

    expect(result!.evidence[0].pillarsMalformed).toBe(true);
    expect(result!.evidence[0].pillars).toBeNull();
    assertNoWrites();
  });

  it("surfaces a Postgres/RLS error without writing anything", async () => {
    mockIn.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

    await expect(
      getAssetDnaEvidence.execute!({ assetIds: [ASSET_A] }, {} as never),
    ).rejects.toThrow(/permission denied/);
    assertNoWrites();
  });

  it("throws when the access token is missing from request context, without writing anything", async () => {
    mockGetStore.mockReturnValueOnce(undefined as never);

    await expect(
      getAssetDnaEvidence.execute!({ assetIds: [ASSET_A] }, {} as never),
    ).rejects.toThrow(/Access token not available/);
    assertNoWrites();
  });
});
