import type { ApiErrorCode } from "@/lib/api/error-envelope";

export type MappedRpcError = {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function mapSupabaseRpcError(
  message: string,
  pgCode?: string | null,
  ctx?: { expectedVersion?: number },
): MappedRpcError {
  const msg = message ?? "";

  if (pgCode === "23P01" || includes(msg, "overlapping date")) {
    return {
      status: 409,
      code: "BOOKING_CONFLICT",
      message: "Talent already confirmed for overlapping dates.",
    };
  }

  if (msg === "stale_booking" || includes(msg, "stale_booking")) {
    const details: Record<string, unknown> = {};
    if (ctx?.expectedVersion != null) {
      details.expected_version = ctx.expectedVersion;
    }
    return {
      status: 409,
      code: "STALE_BOOKING",
      message: "This booking was updated elsewhere. Refresh and try again.",
      ...(Object.keys(details).length > 0 ? { details } : {}),
    };
  }

  if (includes(msg, "invalid_transition")) {
    return {
      status: 409,
      code: "INVALID_TRANSITION",
      message: "This status change is not allowed for this booking.",
    };
  }

  if (
    includes(msg, "not in approved state") ||
    includes(msg, "not in approved") ||
    includes(msg, "confirm not approved")
  ) {
    return {
      status: 409,
      code: "BOOKING_NOT_APPROVED",
      message: "This booking must be approved before it can be confirmed.",
    };
  }

  if (includes(msg, "cancellation_reason_required")) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "A cancellation reason is required.",
    };
  }

  if (includes(msg, "authentication required")) {
    return { status: 401, code: "UNAUTHORIZED", message: "Sign in to continue." };
  }

  if (
    includes(msg, "not authorized for this booking") ||
    includes(msg, "not authorized") ||
    includes(msg, "not authorized for this talent profile")
  ) {
    return {
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    };
  }

  if (includes(msg, "not a member of this organization") || includes(msg, "not a member")) {
    return {
      status: 403,
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    };
  }

  if (
    includes(msg, "booking not found") ||
    includes(msg, "booking % not found") ||
    includes(msg, "talent profile not found") ||
    includes(msg, "shoot not found")
  ) {
    const notFoundMessage = includes(msg, "talent profile")
      ? "Talent profile not found."
      : includes(msg, "shoot")
        ? "Shoot not found."
        : "Booking not found.";
    return { status: 404, code: "NOT_FOUND", message: notFoundMessage };
  }

  if (/booking .* not found/i.test(msg)) {
    return { status: 404, code: "NOT_FOUND", message: "Booking not found." };
  }

  if (
    includes(msg, "invalid date range") ||
    includes(msg, "date_start and date_end") ||
    includes(msg, "start date cannot be in the past") ||
    includes(msg, "rate_quoted") ||
    includes(msg, "invalid role") ||
    includes(msg, "org_id is required") ||
    includes(msg, "talent_profile_id is required") ||
    includes(msg, "invalid cursor") ||
    includes(msg, "expected_version is required") ||
    includes(msg, "booking_id is required")
  ) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: msg || "Invalid request.",
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
}
