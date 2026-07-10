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

export type StaleBookingContext = {
  expectedVersion?: number;
  currentVersion?: number;
};

export function isStaleBookingMessage(message: string): boolean {
  const msg = message ?? "";
  return msg === "stale_booking" || msg.toLowerCase().includes("stale_booking");
}

type RpcErrorMatcher = {
  match: (msg: string, pgCode?: string | null) => boolean;
  map: (msg: string, ctx?: StaleBookingContext) => MappedRpcError;
};

function staleBookingError(ctx?: StaleBookingContext): MappedRpcError {
  const details: Record<string, unknown> = {};
  if (ctx?.expectedVersion != null) {
    details.expected_version = ctx.expectedVersion;
  }
  if (ctx?.currentVersion != null) {
    details.current_version = ctx.currentVersion;
  }
  return {
    status: 409,
    code: "STALE_BOOKING",
    message: "This booking was updated elsewhere. Refresh and try again.",
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };
}

const RPC_ERROR_MATCHERS: RpcErrorMatcher[] = [
  {
    match: (msg, pgCode) => pgCode === "23P01" || includes(msg, "overlapping date"),
    map: () => ({
      status: 409,
      code: "BOOKING_CONFLICT",
      message: "Talent already confirmed for overlapping dates.",
    }),
  },
  {
    match: (msg) => isStaleBookingMessage(msg),
    map: (_msg, ctx) => staleBookingError(ctx),
  },
  {
    match: (msg) => includes(msg, "invalid_transition"),
    map: () => ({
      status: 409,
      code: "INVALID_TRANSITION",
      message: "This status change is not allowed for this booking.",
    }),
  },
  {
    match: (msg) =>
      includes(msg, "not in approved state") ||
      includes(msg, "not in approved") ||
      includes(msg, "confirm not approved"),
    map: () => ({
      status: 409,
      code: "BOOKING_NOT_APPROVED",
      message: "This booking must be approved before it can be confirmed.",
    }),
  },
  {
    match: (msg) => includes(msg, "cancellation_reason_required"),
    map: () => ({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "A cancellation reason is required.",
    }),
  },
  {
    match: (msg) => includes(msg, "authentication required"),
    map: () => ({ status: 401, code: "UNAUTHORIZED", message: "Sign in to continue." }),
  },
  // Anon lacks EXECUTE on booking RPCs → PostgREST "permission denied for function …"
  // (not the in-body "authentication required"). Map to 401 so auth-off never 500s.
  {
    match: (msg, pgCode) =>
      pgCode === "42501" ||
      includes(msg, "permission denied for function") ||
      includes(msg, "permission denied for schema"),
    map: () => ({ status: 401, code: "UNAUTHORIZED", message: "Sign in to continue." }),
  },
  {
    match: (msg) =>
      includes(msg, "not authorized for this booking") ||
      includes(msg, "not authorized") ||
      includes(msg, "not authorized for this talent profile"),
    map: () => ({
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    }),
  },
  {
    match: (msg) => includes(msg, "not a member of this organization") || includes(msg, "not a member"),
    map: () => ({
      status: 403,
      code: "FORBIDDEN",
      message: "You are not a member of this organization.",
    }),
  },
  {
    match: (msg) =>
      includes(msg, "booking not found") ||
      includes(msg, "booking % not found") ||
      includes(msg, "talent profile not found") ||
      includes(msg, "shoot not found"),
    map: (msg) => {
      const notFoundMessage = includes(msg, "talent profile")
        ? "Talent profile not found."
        : includes(msg, "shoot")
          ? "Shoot not found."
          : "Booking not found.";
      return { status: 404, code: "NOT_FOUND", message: notFoundMessage };
    },
  },
  {
    match: (msg) => /booking .* not found/i.test(msg),
    map: () => ({ status: 404, code: "NOT_FOUND", message: "Booking not found." }),
  },
  {
    match: (msg) =>
      includes(msg, "invalid date range") ||
      includes(msg, "date_start and date_end") ||
      includes(msg, "start date cannot be in the past") ||
      includes(msg, "rate_quoted") ||
      includes(msg, "invalid role") ||
      includes(msg, "org_id is required") ||
      includes(msg, "talent_profile_id is required") ||
      includes(msg, "invalid cursor") ||
      includes(msg, "expected_version is required") ||
      includes(msg, "booking_id is required"),
    map: (msg) => ({
      status: 400,
      code: "VALIDATION_ERROR",
      message: msg || "Invalid request.",
    }),
  },
];

export function mapSupabaseRpcError(
  message: string,
  pgCode?: string | null,
  ctx?: StaleBookingContext,
): MappedRpcError {
  const msg = message ?? "";

  for (const rule of RPC_ERROR_MATCHERS) {
    if (rule.match(msg, pgCode)) {
      return rule.map(msg, ctx);
    }
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
}
