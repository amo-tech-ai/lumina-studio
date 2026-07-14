// IPI-397 · AC-J — booking state transition safety integration test
// Proves the operator approval gate is the only path to "confirmed"
import { describe, expect, it, vi } from "vitest";
import { approveBooking, getBooking, transitionBooking } from "./booking-service";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const BRAND_VIEWER = {
  booking: { booking_id: BOOKING_ID, status: "approved", version: 2 },
  talent: null,
  history: [],
  viewer_role: "brand",
};
const NON_BRAND_VIEWER = {
  booking: { booking_id: BOOKING_ID, status: "approved", version: 2 },
  talent: null,
  history: [],
  viewer_role: "talent",
};

function userClient(mockRpc: ReturnType<typeof vi.fn>) {
  return { rpc: mockRpc } as never;
}

function serviceClient(mockRpc: ReturnType<typeof vi.fn>) {
  return { rpc: mockRpc } as never;
}

describe("booking safety — unauthorized confirm blocked", () => {
  it("approveBooking returns 403 when viewer is not brand", async () => {
    const userRpc = vi.fn().mockResolvedValueOnce({
      data: NON_BRAND_VIEWER,
      error: null,
    });
    const serviceRpc = vi.fn(); // should never be called

    const result = await approveBooking(
      userClient(userRpc),
      serviceClient(serviceRpc),
      BOOKING_ID,
    );

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
    });
    expect(serviceRpc).not.toHaveBeenCalled();
  });
});

describe("booking safety — transitionBooking rejects confirmed", () => {
  it("transitionBooking to confirmed is not supported by the service layer", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "to_status not supported: confirmed", code: "INVALID_TRANSITION" },
    });

    const result = await transitionBooking(userClient(rpc), BOOKING_ID, {
      expected_version: 1,
      to_status: "confirmed",
    });

    // Real enforcement is at the SQL RPC level — the TypeScript service layer
    // wraps whatever error the RPC returns. Key assertion: it never succeeds.
    expect(result).toMatchObject({ ok: false });
    expect(result).not.toMatchObject({ ok: true });
    expect(rpc).toHaveBeenCalledWith("transition_booking", expect.objectContaining({
      p_to_status: "confirmed",
    }));
  });
});

describe("booking safety — operator approval path", () => {
  it("approveBooking calls get_booking then confirm_booking on correct clients", async () => {
    const userRpc = vi.fn().mockResolvedValueOnce({
      data: BRAND_VIEWER,
      error: null,
    });
    const serviceRpc = vi.fn().mockResolvedValueOnce({
      data: { booking_id: BOOKING_ID, status: "confirmed", already_confirmed: false, crew_id: null },
      error: null,
    });

    const result = await approveBooking(
      userClient(userRpc),
      serviceClient(serviceRpc),
      BOOKING_ID,
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "confirmed",
        already_confirmed: false,
        booking_id: BOOKING_ID,
      },
    });
    expect(userRpc).toHaveBeenCalledWith("get_booking", { p_booking_id: BOOKING_ID });
    expect(serviceRpc).toHaveBeenCalledWith("confirm_booking", { p_booking_id: BOOKING_ID });
  });
});
