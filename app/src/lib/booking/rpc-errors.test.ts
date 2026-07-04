import { describe, expect, it } from "vitest";
import { isStaleBookingMessage, mapSupabaseRpcError } from "./rpc-errors";

describe("mapSupabaseRpcError", () => {
  it("maps stale_booking with expected and current version in details", () => {
    const mapped = mapSupabaseRpcError("stale_booking", null, {
      expectedVersion: 1,
      currentVersion: 3,
    });
    expect(mapped).toEqual({
      status: 409,
      code: "STALE_BOOKING",
      message: "This booking was updated elsewhere. Refresh and try again.",
      details: { expected_version: 1, current_version: 3 },
    });
  });

  it("maps EXCLUDE overlap to BOOKING_CONFLICT", () => {
    const mapped = mapSupabaseRpcError("Booking conflict", "23P01");
    expect(mapped.code).toBe("BOOKING_CONFLICT");
    expect(mapped.status).toBe(409);
  });
});

describe("isStaleBookingMessage", () => {
  it("detects exact and embedded stale_booking messages", () => {
    expect(isStaleBookingMessage("stale_booking")).toBe(true);
    expect(isStaleBookingMessage("ERROR: stale_booking")).toBe(true);
    expect(isStaleBookingMessage("invalid_transition")).toBe(false);
  });
});
