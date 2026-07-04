import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";

const mockGetBooking = vi.fn();
const mockTransitionBooking = vi.fn();
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
  getBooking: (...args: unknown[]) => mockGetBooking(...args),
  transitionBooking: (...args: unknown[]) => mockTransitionBooking(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ rpc: vi.fn() });
  mockGetBooking.mockResolvedValue({
    ok: true,
    data: {
      booking: { id: BOOKING_ID, status: "requested", version: 1 },
      talent: { id: "33333333-3333-4333-8333-333333333333" },
      history: [],
      viewer_role: "brand",
    },
  });
  mockTransitionBooking.mockResolvedValue({
    ok: true,
    data: {
      booking: { id: BOOKING_ID, status: "quoted", version: 2 },
      from_status: "requested",
      to_status: "quoted",
      version: 2,
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

const routeContext = { params: Promise.resolve({ id: BOOKING_ID }) };

async function importRoute() {
  return import("./route");
}

describe("GET /api/bookings/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { GET } = await importRoute();
    const res = await GET(new NextRequest("http://localhost/api/bookings/" + BOOKING_ID), routeContext);
    expect(res.status).toBe(401);
  });

  it("returns 400 when booking id is not a valid UUID", async () => {
    const badContext = { params: Promise.resolve({ id: "not-a-uuid" }) };
    const { GET } = await importRoute();
    const res = await GET(new NextRequest("http://localhost/api/bookings/not-a-uuid"), badContext);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(mockGetBooking).not.toHaveBeenCalled();
  });

  it("returns 404 envelope when booking missing", async () => {
    mockGetBooking.mockResolvedValueOnce({
      ok: false,
      status: 404,
      code: "NOT_FOUND",
      message: "Booking not found.",
    });
    const { GET } = await importRoute();
    const res = await GET(new NextRequest("http://localhost/api/bookings/" + BOOKING_ID), routeContext);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Booking not found." },
    });
  });

  it("returns booking bundle on success", async () => {
    const { GET } = await importRoute();
    const res = await GET(new NextRequest("http://localhost/api/bookings/" + BOOKING_ID), routeContext);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      booking: { id: BOOKING_ID, status: "requested", version: 1 },
      talent: { id: "33333333-3333-4333-8333-333333333333" },
      history: [],
      viewer_role: "brand",
    });
  });
});

describe("PATCH /api/bookings/[id]", () => {
  function makePatch(body: unknown) {
    return new NextRequest("http://localhost/api/bookings/" + BOOKING_ID, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 for invalid JSON body", async () => {
    const { PATCH } = await importRoute();
    const req = new NextRequest("http://localhost/api/bookings/" + BOOKING_ID, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await PATCH(req, routeContext);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(mockTransitionBooking).not.toHaveBeenCalled();
  });

  it("rejects to_status=confirmed at validation", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(
      makePatch({ expected_version: 1, to_status: "confirmed" }),
      routeContext,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(mockTransitionBooking).not.toHaveBeenCalled();
  });

  it("returns 409 STALE_BOOKING from service", async () => {
    mockTransitionBooking.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "STALE_BOOKING",
      message: "This booking was updated elsewhere. Refresh and try again.",
      details: { expected_version: 1 },
    });
    const { PATCH } = await importRoute();
    const res = await PATCH(
      makePatch({ expected_version: 1, to_status: "quoted", rate_quoted: 3200 }),
      routeContext,
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: {
        code: "STALE_BOOKING",
        message: "This booking was updated elsewhere. Refresh and try again.",
        details: { expected_version: 1 },
      },
    });
  });

  it("returns transition payload on success", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(
      makePatch({ expected_version: 1, to_status: "quoted", rate_quoted: 3200 }),
      routeContext,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      booking: { id: BOOKING_ID, status: "quoted", version: 2 },
      from_status: "requested",
      to_status: "quoted",
      version: 2,
    });
  });
});
