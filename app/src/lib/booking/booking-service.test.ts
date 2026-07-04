import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBooking, transitionBooking } from "./booking-service";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";

describe("getBooking", () => {
  it("normalizes booking_id to id in the response", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({
      data: {
        booking: { booking_id: BOOKING_ID, status: "requested", version: 1 },
        talent: null,
        history: [],
        viewer_role: "brand",
      },
      error: null,
    });

    const result = await getBooking({ rpc } as never, BOOKING_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.booking).toMatchObject({
        id: BOOKING_ID,
        status: "requested",
        version: 1,
      });
      expect(result.data.booking).not.toHaveProperty("booking_id");
    }
  });
});

describe("transitionBooking stale enrichment", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
  });

  it("includes current_version when transition_booking raises stale_booking", async () => {
    rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: "stale_booking", code: null },
      })
      .mockResolvedValueOnce({
        data: {
          booking: { id: BOOKING_ID, version: 4 },
          talent: null,
          history: [],
          viewer_role: "brand",
        },
        error: null,
      });

    const userSb = { rpc } as never;
    const result = await transitionBooking(userSb, BOOKING_ID, {
      expected_version: 2,
      to_status: "quoted",
      rate_quoted: 3000,
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "STALE_BOOKING",
      message: "This booking was updated elsewhere. Refresh and try again.",
      details: { expected_version: 2, current_version: 4 },
    });
    expect(rpc).toHaveBeenNthCalledWith(1, "transition_booking", expect.any(Object));
    expect(rpc).toHaveBeenNthCalledWith(2, "get_booking", { p_booking_id: BOOKING_ID });
  });
});
