import { NextResponse } from "next/server";

/** Stable codes for client branching — matches api-contracts.md */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_TRANSITION"
  | "STALE_BOOKING"
  | "BOOKING_NOT_APPROVED"
  | "BOOKING_CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Sign in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Check the highlighted fields and try again.",
  INVALID_TRANSITION: "This status change is not allowed for this booking.",
  STALE_BOOKING: "This booking was updated elsewhere. Refresh and try again.",
  BOOKING_NOT_APPROVED: "This booking must be approved before it can be confirmed.",
  BOOKING_CONFLICT: "Talent already confirmed for overlapping dates.",
  RATE_LIMITED: "Too many requests. Try again shortly.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export function apiErrorBody(
  code: ApiErrorCode,
  message?: string,
  details?: Record<string, unknown>,
): ApiErrorEnvelope {
  const body: ApiErrorEnvelope = {
    error: {
      code,
      message: message ?? DEFAULT_MESSAGES[code],
    },
  };
  if (details && Object.keys(details).length > 0) {
    body.error.details = details;
  }
  return body;
}

export function apiErrorResponse(
  code: ApiErrorCode,
  status: number,
  message?: string,
  details?: Record<string, unknown>,
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json(apiErrorBody(code, message, details), { status });
}

/** Maps service-layer failures (validation + RPC) to HTTP error responses. */
export type ServiceFailurePayload = {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export function serviceFailureResponse(result: ServiceFailurePayload) {
  return apiErrorResponse(result.code, result.status, result.message, result.details);
}
