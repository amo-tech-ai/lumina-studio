// IPI-348 · MODELGATE-10 — booking agent tools unit tests
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.fn();
const mockGetStore = vi.fn(() => "tok");

vi.mock("@/lib/shoot/commit-shoot-draft", () => ({
  createUserScopedClient: vi.fn(() => ({ rpc: mockRpc })),
}));
vi.mock("@/lib/request-token", () => ({
  requestToken: { getStore: (...args: unknown[]) => mockGetStore(...args) },
}));

import {
  buildQuoteDraft,
  checkTalentAvailability,
  createBookingDraft,
  draftBookingQuote,
} from "./booking-tools";

const TALENT_ID = "22222222-2222-4222-8222-222222222222";
const BRAND_ORG_ID = "33333333-3333-4333-8333-333333333333";
const BOOKING_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  mockRpc.mockReset();
  mockGetStore.mockReturnValue("tok");
});

describe("buildQuoteDraft", () => {
  it("uses tier midpoint when rateQuoted omitted", () => {
    const draft = buildQuoteDraft({
      displayName: "Alex",
      dateStart: "2026-08-01",
      dateEnd: "2026-08-03",
      rateTier: "$$",
      shootType: "editorial",
    });
    expect(draft.suggestedRate).toBe(1000);
    expect(draft.messageDraft).toContain("Alex");
    expect(draft.messageDraft).toContain("editorial");
  });

  it("does not double the closing period, with or without shootType", () => {
    const withShoot = buildQuoteDraft({
      displayName: "Alex",
      dateStart: "2026-08-01",
      dateEnd: "2026-08-03",
      rateTier: "$$",
      shootType: "editorial",
    });
    expect(withShoot.messageDraft).not.toMatch(/\.\./);
    expect(withShoot.messageDraft).toContain("for your editorial shoot. Please");

    const withoutShoot = buildQuoteDraft({
      displayName: "Jordan",
      dateStart: "2026-08-01",
      dateEnd: "2026-08-03",
      rateTier: "$$",
    });
    expect(withoutShoot.messageDraft).not.toMatch(/\.\./);
    expect(withoutShoot.messageDraft).toContain("2026-08-03. Please");
  });

  it("rejects a reversed date range", () => {
    expect(() =>
      buildQuoteDraft({
        displayName: "Alex",
        dateStart: "2026-08-05",
        dateEnd: "2026-08-01",
        rateTier: "$$",
      }),
    ).toThrow(/dateStart must be on or before dateEnd/);
  });
});

describe("checkTalentAvailability", () => {
  it("returns available when RPC reports no calendar conflict", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        id: TALENT_ID,
        display_name: "Alex",
        bio: null,
        measurements: {},
        languages: [],
        travel_ready: true,
        verification_status: "verified",
        ai_tags: {},
        is_agency_represented: false,
        rate_tier: "$$",
        is_available: true,
      },
      error: null,
    });

    const result = await checkTalentAvailability.execute!(
      { talentProfileId: TALENT_ID, dateStart: "2026-08-01", dateEnd: "2026-08-03" },
      {} as never,
    );

    expect(result!.isAvailable).toBe(true);
    expect(result!.displayName).toBe("Alex");
    expect(result!.rateTier).toBe("$$");
    expect(result!.reason).toMatch(/No blocked, tentative, or booked availability conflicts/i);
    expect(mockRpc).toHaveBeenCalledWith("check_talent_availability", {
      p_talent_profile_id: TALENT_ID,
      p_date_start: "2026-08-01",
      p_date_end: "2026-08-03",
    });
  });

  it("returns unavailable when talent has calendar conflict", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        id: TALENT_ID,
        display_name: "Alex",
        bio: null,
        measurements: {},
        languages: [],
        travel_ready: true,
        verification_status: "verified",
        ai_tags: {},
        is_agency_represented: false,
        rate_tier: "$$",
        is_available: false,
      },
      error: null,
    });

    const result = await checkTalentAvailability.execute!(
      { talentProfileId: TALENT_ID, dateStart: "2026-08-01", dateEnd: "2026-08-03" },
      {} as never,
    );

    expect(result!.isAvailable).toBe(false);
    expect(result!.displayName).toBe("Alex");
    expect(result!.reason).toMatch(/blocked, tentative, or booked/i);
    expect(mockRpc).toHaveBeenCalledWith("check_talent_availability", {
      p_talent_profile_id: TALENT_ID,
      p_date_start: "2026-08-01",
      p_date_end: "2026-08-03",
    });
  });

  it("throws when access token is missing", async () => {
    mockGetStore.mockReturnValueOnce(undefined as never);

    await expect(
      checkTalentAvailability.execute!(
        { talentProfileId: TALENT_ID, dateStart: "2026-08-01", dateEnd: "2026-08-03" },
        {} as never,
      ),
    ).rejects.toThrow(/Access token not available/);
  });
});

describe("draftBookingQuote", () => {
  it("returns local draft without RPC", async () => {
    const result = await draftBookingQuote.execute!(
      {
        displayName: "Jordan",
        dateStart: "2026-09-01",
        dateEnd: "2026-09-02",
        rateTier: "$",
      },
      {} as never,
    );

    expect(result!.suggestedRate).toBe(400);
    expect(result!.messageDraft).toContain("Jordan");
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe("createBookingDraft", () => {
  it("rejects when operatorConfirmed is false", async () => {
    await expect(
      createBookingDraft.execute!(
        {
          brandOrgId: BRAND_ORG_ID,
          talentProfileId: TALENT_ID,
          dateStart: "2026-08-01",
          dateEnd: "2026-08-03",
          operatorConfirmed: false,
        },
        {} as never,
      ),
    ).rejects.toThrow(/operatorConfirmed/);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calls create_booking_request when operator confirmed", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        booking_id: BOOKING_ID,
        status: "requested",
        version: 1,
        expires_at: "2026-08-10T00:00:00Z",
      },
      error: null,
    });

    const result = await createBookingDraft.execute!(
      {
        brandOrgId: BRAND_ORG_ID,
        talentProfileId: TALENT_ID,
        dateStart: "2026-08-01",
        dateEnd: "2026-08-03",
        rateQuoted: 1200,
        message: "Looking forward to working together.",
        operatorConfirmed: true,
      },
      {} as never,
    );

    expect(result).toEqual({
      booking_id: BOOKING_ID,
      status: "requested",
      version: 1,
      expires_at: "2026-08-10T00:00:00Z",
    });
    expect(mockRpc).toHaveBeenCalledWith("create_booking_request", {
      p_brand_org_id: BRAND_ORG_ID,
      p_talent_profile_id: TALENT_ID,
      p_date_start: "2026-08-01",
      p_date_end: "2026-08-03",
      p_shoot_id: undefined,
      p_rate_quoted: 1200,
      p_message: "Looking forward to working together.",
    });
  });

  it("throws when access token is missing", async () => {
    mockGetStore.mockReturnValueOnce(undefined as never);

    await expect(
      createBookingDraft.execute!(
        {
          brandOrgId: BRAND_ORG_ID,
          talentProfileId: TALENT_ID,
          dateStart: "2026-08-01",
          dateEnd: "2026-08-03",
          operatorConfirmed: true,
        },
        {} as never,
      ),
    ).rejects.toThrow(/Access token not available/);
  });
});
