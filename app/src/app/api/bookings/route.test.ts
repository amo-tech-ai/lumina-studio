import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const ORG_ID = "22222222-2222-4222-8222-222222222222";
const TALENT_ID = "33333333-3333-4333-8333-333333333333";

const VALID_CREATE_BODY = {
  brand_org_id: ORG_ID,
  talent_profile_id: TALENT_ID,
  date_start: "2026-08-01",
  date_end: "2026-08-03",
  rate_quoted: 2500,
  message: "Spring editorial",
};

const mockCreateBookingRequest = vi.fn();
const mockListBookings = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockWithOperatorAuth = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/lib/booking/booking-service", () => ({
  createBookingRequest: (...args: unknown[]) => mockCreateBookingRequest(...args),
  listBookings: (...args: unknown[]) => mockListBookings(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "44444444-4444-4444-8444-444444444444", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ rpc: vi.fn() });
  mockCreateBookingRequest.mockResolvedValue({
    ok: true,
    data: {
      booking_id: BOOKING_ID,
      status: "requested",
      version: 1,
      expires_at: "2026-08-04T12:00:00Z",
    },
  });
  mockListBookings.mockResolvedValue({
    ok: true,
    data: { items: [], next_cursor: null },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("POST /api/bookings", () => {
  function makePost(body: unknown) {
    return new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 with error envelope when auth fails", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(makePost(VALID_CREATE_BODY));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Sign in to continue." },
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 validation envelope for missing fields", async () => {
    const { POST } = await importRoute();
    const res = await POST(makePost({ brand_org_id: ORG_ID }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when service reports forbidden", async () => {
    mockCreateBookingRequest.mockResolvedValueOnce({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    });
    const { POST } = await importRoute();
    const res = await POST(makePost(VALID_CREATE_BODY));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "You are not a member of this organization.",
      },
    });
  });

  it("returns 201 with booking payload on success", async () => {
    const { POST } = await importRoute();
    const res = await POST(makePost(VALID_CREATE_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      booking_id: BOOKING_ID,
      status: "requested",
      version: 1,
      expires_at: "2026-08-04T12:00:00Z",
    });
    expect(mockCreateBookingRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        brand_org_id: ORG_ID,
        talent_profile_id: TALENT_ID,
      }),
    );
  });
});

describe("GET /api/bookings", () => {
  function makeGet(query: string) {
    return new NextRequest(`http://localhost/api/bookings?${query}`, { method: "GET" });
  }

  it("returns 400 when role is missing", async () => {
    const { GET } = await importRoute();
    const res = await GET(makeGet("org_id=" + ORG_ID));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 with list payload", async () => {
    mockListBookings.mockResolvedValueOnce({
      ok: true,
      data: {
        items: [{ id: BOOKING_ID, status: "requested" }],
        next_cursor: "2026-07-01T00:00:00Z|" + BOOKING_ID,
      },
    });
    const { GET } = await importRoute();
    const res = await GET(makeGet(`role=brand&org_id=${ORG_ID}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [{ id: BOOKING_ID, status: "requested" }],
      next_cursor: "2026-07-01T00:00:00Z|" + BOOKING_ID,
    });
  });

  it("passes comma-separated status filters to listBookings", async () => {
    const { GET } = await importRoute();
    const res = await GET(makeGet(`role=brand&org_id=${ORG_ID}&status=requested,quoted`));
    expect(res.status).toBe(200);
    expect(mockListBookings).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: ["requested", "quoted"] }),
    );
  });
});
