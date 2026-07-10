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

  it("maps anon EXECUTE denial to UNAUTHORIZED (not INTERNAL_ERROR)", () => {
    const byMessage = mapSupabaseRpcError(
      "permission denied for function create_booking_request",
    );
    expect(byMessage).toEqual({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sign in to continue.",
    });

    const byPgCode = mapSupabaseRpcError("permission denied", "42501");
    expect(byPgCode.status).toBe(401);
    expect(byPgCode.code).toBe("UNAUTHORIZED");
  });

  it("maps EXECUTE denial to FORBIDDEN when caller is authenticated", () => {
    const mapped = mapSupabaseRpcError(
      "permission denied for function create_booking_request",
      null,
      { authenticated: true },
    );
    expect(mapped).toEqual({
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  });
});

describe("isStaleBookingMessage", () => {
  it("detects exact and embedded stale_booking messages", () => {
    expect(isStaleBookingMessage("stale_booking")).toBe(true);
    expect(isStaleBookingMessage("ERROR: stale_booking")).toBe(true);
    expect(isStaleBookingMessage("invalid_transition")).toBe(false);
  });
});
