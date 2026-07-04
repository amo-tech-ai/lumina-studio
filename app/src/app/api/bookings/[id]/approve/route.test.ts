import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const CREW_ID = "55555555-5555-4555-8555-555555555555";

const mockApproveBooking = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockCreateSupabaseAdminClient = vi.fn();
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

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => mockCreateSupabaseAdminClient(),
}));

vi.mock("@/lib/booking/booking-service", () => ({
  approveBooking: (...args: unknown[]) => mockApproveBooking(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ rpc: vi.fn() });
  mockCreateSupabaseAdminClient.mockReturnValue({ rpc: vi.fn() });
  mockApproveBooking.mockResolvedValue({
    ok: true,
    data: {
      status: "confirmed",
      already_confirmed: false,
      booking_id: BOOKING_ID,
      crew_id: CREW_ID,
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

describe("POST /api/bookings/[id]/approve", () => {
  it("returns 401 when unauthenticated", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not brand", async () => {
    mockApproveBooking.mockResolvedValueOnce({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Only brand members can confirm a booking.",
    });
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Only brand members can confirm a booking.",
      },
    });
  });

  it("returns 409 BOOKING_NOT_APPROVED", async () => {
    mockApproveBooking.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "BOOKING_NOT_APPROVED",
      message: "This booking must be approved before it can be confirmed.",
    });
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("BOOKING_NOT_APPROVED");
  });

  it("returns 409 BOOKING_CONFLICT on overlap", async () => {
    mockApproveBooking.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "BOOKING_CONFLICT",
      message: "Talent already confirmed for overlapping dates.",
    });
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: {
        code: "BOOKING_CONFLICT",
        message: "Talent already confirmed for overlapping dates.",
      },
    });
  });

  it("returns confirmed payload on success", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "confirmed",
      already_confirmed: false,
      booking_id: BOOKING_ID,
      crew_id: CREW_ID,
    });
    expect(mockApproveBooking).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      BOOKING_ID,
    );
  });

  it("returns idempotent already_confirmed payload", async () => {
    mockApproveBooking.mockResolvedValueOnce({
      ok: true,
      data: {
        status: "confirmed",
        already_confirmed: true,
        booking_id: BOOKING_ID,
        crew_id: null,
      },
    });
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/" + BOOKING_ID + "/approve", { method: "POST" }),
      routeContext,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "confirmed",
      already_confirmed: true,
      booking_id: BOOKING_ID,
      crew_id: null,
    });
  });
});
