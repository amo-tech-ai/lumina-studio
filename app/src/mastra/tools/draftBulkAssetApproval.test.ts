// IPI-261 · DESIGN-077 — draftBulkAssetApproval unit tests
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

import { draftBulkAssetApproval } from "./draftBulkAssetApproval";

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
});

describe("draftBulkAssetApproval", () => {
  it("returns a draft proposal for a valid single-brand selection and performs zero writes", async () => {
    mockIn.mockResolvedValueOnce({
      data: [
        { id: ASSET_A, brand_id: "brand-1" },
        { id: ASSET_B, brand_id: "brand-1" },
      ],
      error: null,
    });

    const result = await draftBulkAssetApproval.execute!(
      { assetIds: [ASSET_A, ASSET_B], action: "approve", note: "Looks good" },
      {} as never,
    );

    expect(result!.ok).toBe(true);
    expect(result!.proposal).toMatchObject({
      status: "draft",
      action: "approve",
      assetIds: [ASSET_A, ASSET_B],
      assetCount: 2,
      brandId: "brand-1",
      note: "Looks good",
      requiresHumanApproval: true,
    });
    assertNoWrites();
  });

  it("rejects a selection containing an unauthorized/missing asset", async () => {
    mockIn.mockResolvedValueOnce({
      data: [{ id: ASSET_A, brand_id: "brand-1" }],
      error: null,
    });

    const result = await draftBulkAssetApproval.execute!(
      { assetIds: [ASSET_A, ASSET_MISSING], action: "approve" },
      {} as never,
    );

    expect(result!.ok).toBe(false);
    expect(result!.proposal).toBeNull();
    expect(result!.invalidAssetIds).toEqual([ASSET_MISSING]);
    expect(result!.reason).toMatch(/not found or not accessible/);
    assertNoWrites();
  });

  it("rejects a mixed-brand selection", async () => {
    mockIn.mockResolvedValueOnce({
      data: [
        { id: ASSET_A, brand_id: "brand-1" },
        { id: ASSET_B, brand_id: "brand-2" },
      ],
      error: null,
    });

    const result = await draftBulkAssetApproval.execute!(
      { assetIds: [ASSET_A, ASSET_B], action: "reject" },
      {} as never,
    );

    expect(result!.ok).toBe(false);
    expect(result!.proposal).toBeNull();
    expect(result!.reason).toMatch(/multiple brands/);
    assertNoWrites();
  });

  it("rejects assets with no brand association", async () => {
    mockIn.mockResolvedValueOnce({
      data: [{ id: ASSET_A, brand_id: null }],
      error: null,
    });

    const result = await draftBulkAssetApproval.execute!(
      { assetIds: [ASSET_A], action: "request_retake" },
      {} as never,
    );

    expect(result!.ok).toBe(false);
    expect(result!.reason).toMatch(/no brand association/);
    assertNoWrites();
  });

  it("surfaces a DB error without writing anything", async () => {
    mockIn.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

    await expect(
      draftBulkAssetApproval.execute!({ assetIds: [ASSET_A], action: "approve" }, {} as never),
    ).rejects.toThrow(/permission denied/);
    assertNoWrites();
  });

  it("throws when the access token is missing, without writing anything", async () => {
    mockGetStore.mockReturnValueOnce(undefined as never);

    await expect(
      draftBulkAssetApproval.execute!({ assetIds: [ASSET_A], action: "approve" }, {} as never),
    ).rejects.toThrow(/Access token not available/);
    assertNoWrites();
  });
});
