import type { ApiErrorCode } from "@/lib/api/error-envelope";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const BOOKING_STATUS_VALUES = [
  "requested",
  "quoted",
  "approved",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];

export const BOOKING_LIST_ROLES = ["brand", "talent", "agency"] as const;
export type BookingListRole = (typeof BOOKING_LIST_ROLES)[number];

export type ParseFailure = {
  ok: false;
  status: 400;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidDateRange(start: string, end: string): boolean {
  return start <= end;
}

export function isRateQuoted(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 999999.99;
}

function validationFail(message: string, details?: Record<string, unknown>): ParseFailure {
  return { ok: false, status: 400, code: "VALIDATION_ERROR", message, details };
}

export type CreateBookingBody = {
  brand_org_id: string;
  talent_profile_id: string;
  shoot_id: string | null;
  date_start: string;
  date_end: string;
  rate_quoted?: number;
  message?: string;
};

export function parseCreateBookingBody(body: unknown):
  | { ok: true; data: CreateBookingBody }
  | ParseFailure {
  if (!body || typeof body !== "object") {
    return validationFail("Request body must be a JSON object.");
  }

  const b = body as Record<string, unknown>;

  if (!isUuid(b.brand_org_id)) {
    return validationFail("brand_org_id must be a valid UUID.");
  }
  if (!isUuid(b.talent_profile_id)) {
    return validationFail("talent_profile_id must be a valid UUID.");
  }

  let shoot_id: string | null = null;
  if (b.shoot_id != null) {
    if (b.shoot_id === null) {
      shoot_id = null;
    } else if (!isUuid(b.shoot_id)) {
      return validationFail("shoot_id must be a valid UUID or null.");
    } else {
      shoot_id = b.shoot_id;
    }
  }

  if (!isIsoDate(b.date_start)) {
    return validationFail("date_start must be a valid YYYY-MM-DD date.");
  }
  if (!isIsoDate(b.date_end)) {
    return validationFail("date_end must be a valid YYYY-MM-DD date.");
  }
  if (!isValidDateRange(b.date_start, b.date_end)) {
    return validationFail("date_end must be on or after date_start.");
  }

  if (b.rate_quoted !== undefined && b.rate_quoted !== null && !isRateQuoted(b.rate_quoted)) {
    return validationFail("rate_quoted must be a number between 0 and 999999.99.");
  }

  if (b.message !== undefined && b.message !== null) {
    if (typeof b.message !== "string") {
      return validationFail("message must be a string.");
    }
    const trimmed = b.message.trim();
    if (trimmed.length > 2000) {
      return validationFail("message must be at most 2000 characters.");
    }
  }

  return {
    ok: true,
    data: {
      brand_org_id: b.brand_org_id,
      talent_profile_id: b.talent_profile_id,
      shoot_id,
      date_start: b.date_start,
      date_end: b.date_end,
      rate_quoted: b.rate_quoted != null ? (b.rate_quoted as number) : undefined,
      message:
        typeof b.message === "string" ? b.message.trim() || undefined : undefined,
    },
  };
}

export type ListBookingsQuery = {
  role: BookingListRole;
  org_id?: string;
  talent_profile_id?: string;
  status?: BookingStatus[];
  cursor?: string;
  limit: number;
};

function parseStatusTokens(params: URLSearchParams): string[] {
  return params
    .getAll("status")
    .flatMap((value) => value.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStatusFilter(params: URLSearchParams): BookingStatus[] | undefined {
  const combined = parseStatusTokens(params);
  if (combined.length === 0) return undefined;

  const invalid = combined.find((s) => !BOOKING_STATUS_VALUES.includes(s as BookingStatus));
  if (invalid) {
    return undefined;
  }
  return combined as BookingStatus[];
}

export function parseListBookingsQuery(searchParams: URLSearchParams):
  | { ok: true; data: ListBookingsQuery }
  | ParseFailure {
  const role = searchParams.get("role");
  if (!role || !BOOKING_LIST_ROLES.includes(role as BookingListRole)) {
    return validationFail("role must be one of: brand, talent, agency.");
  }

  const status = parseStatusFilter(searchParams);
  if (searchParams.has("status") && status === undefined) {
    const values = parseStatusTokens(searchParams);
    if (values.length > 0) {
      return validationFail(`Invalid status filter: ${values.join(", ")}`);
    }
  }

  const org_id = searchParams.get("org_id") ?? undefined;
  const talent_profile_id = searchParams.get("talent_profile_id") ?? undefined;

  if (role === "brand" || role === "agency") {
    if (!org_id) {
      return validationFail("org_id is required for brand and agency roles.");
    }
    if (!isUuid(org_id)) {
      return validationFail("org_id must be a valid UUID.");
    }
  }

  if (role === "talent") {
    if (!talent_profile_id) {
      return validationFail("talent_profile_id is required for talent role.");
    }
    if (!isUuid(talent_profile_id)) {
      return validationFail("talent_profile_id must be a valid UUID.");
    }
  }

  const limitRaw = searchParams.get("limit");
  let limit = 25;
  if (limitRaw != null) {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
      return validationFail("limit must be an integer between 1 and 50.");
    }
    limit = parsed;
  }

  const cursor = searchParams.get("cursor") ?? undefined;

  return {
    ok: true,
    data: {
      role: role as BookingListRole,
      org_id,
      talent_profile_id,
      status,
      cursor,
      limit,
    },
  };
}

export type TransitionBody = {
  expected_version: number;
  to_status?: BookingStatus;
  rate_quoted?: number;
  date_start?: string;
  date_end?: string;
  cancellation_reason?: string;
};

function validateTransitionRateQuoted(
  b: Record<string, unknown>,
  toStatus: unknown,
): ParseFailure | null {
  if (toStatus === "quoted") {
    if (!isRateQuoted(b.rate_quoted)) {
      return validationFail("rate_quoted is required when transitioning to quoted.");
    }
    return null;
  }

  if (b.rate_quoted !== undefined && b.rate_quoted !== null && !isRateQuoted(b.rate_quoted)) {
    return validationFail("rate_quoted must be a number between 0 and 999999.99.");
  }
  return null;
}

function validateTransitionCancellation(
  b: Record<string, unknown>,
  toStatus: unknown,
): ParseFailure | null {
  if (toStatus === "cancelled") {
    if (typeof b.cancellation_reason !== "string" || b.cancellation_reason.trim().length < 1) {
      return validationFail("cancellation_reason is required when cancelling a booking.");
    }
    if (b.cancellation_reason.trim().length > 500) {
      return validationFail("cancellation_reason must be at most 500 characters.");
    }
    return null;
  }

  if (b.cancellation_reason !== undefined && b.cancellation_reason !== null) {
    if (typeof b.cancellation_reason !== "string" || b.cancellation_reason.trim().length < 1) {
      return validationFail("cancellation_reason must be a non-empty string.");
    }
    if (b.cancellation_reason.trim().length > 500) {
      return validationFail("cancellation_reason must be at most 500 characters.");
    }
  }
  return null;
}

function validateTransitionReschedule(b: Record<string, unknown>): ParseFailure | null {
  const hasStart = b.date_start !== undefined && b.date_start !== null;
  const hasEnd = b.date_end !== undefined && b.date_end !== null;
  if (hasStart !== hasEnd) {
    return validationFail("date_start and date_end must both be provided for reschedule.");
  }
  if (!hasStart) {
    return null;
  }

  if (!isIsoDate(b.date_start) || !isIsoDate(b.date_end)) {
    return validationFail("date_start and date_end must be valid YYYY-MM-DD dates.");
  }
  if (!isValidDateRange(b.date_start as string, b.date_end as string)) {
    return validationFail("date_end must be on or after date_start.");
  }
  return null;
}

type TransitionFieldValidator = (
  body: Record<string, unknown>,
  toStatus: unknown,
) => ParseFailure | null;

const TRANSITION_FIELD_VALIDATORS: TransitionFieldValidator[] = [
  validateTransitionRateQuoted,
  validateTransitionCancellation,
  (body) => validateTransitionReschedule(body),
];

function validateTransitionToStatus(toStatus: unknown): ParseFailure | null {
  if (toStatus === "confirmed") {
    return validationFail("Use POST /api/bookings/{id}/approve to confirm a booking.");
  }

  if (toStatus === undefined || toStatus === null) {
    return null;
  }

  if (typeof toStatus !== "string") {
    return validationFail("to_status must be a string.");
  }

  const allowedWithoutConfirmed = BOOKING_STATUS_VALUES.filter((s) => s !== "confirmed");
  if (!allowedWithoutConfirmed.includes(toStatus as (typeof allowedWithoutConfirmed)[number])) {
    return validationFail(`Invalid to_status: ${String(toStatus)}`);
  }

  return null;
}

function runTransitionFieldValidators(
  body: Record<string, unknown>,
  toStatus: unknown,
): ParseFailure | null {
  for (const validate of TRANSITION_FIELD_VALIDATORS) {
    const error = validate(body, toStatus);
    if (error) {
      return error;
    }
  }
  return null;
}

export function parseTransitionBody(body: unknown):
  | { ok: true; data: TransitionBody }
  | ParseFailure {
  if (!body || typeof body !== "object") {
    return validationFail("Request body must be a JSON object.");
  }

  const b = body as Record<string, unknown>;

  if (
    typeof b.expected_version !== "number" ||
    !Number.isInteger(b.expected_version) ||
    b.expected_version < 1
  ) {
    return validationFail("expected_version must be a positive integer.");
  }

  const toStatusError = validateTransitionToStatus(b.to_status);
  if (toStatusError) {
    return toStatusError;
  }

  const fieldError = runTransitionFieldValidators(b, b.to_status);
  if (fieldError) {
    return fieldError;
  }

  const hasStart = b.date_start !== undefined && b.date_start !== null;

  return {
    ok: true,
    data: {
      expected_version: b.expected_version,
      to_status: b.to_status as BookingStatus | undefined,
      rate_quoted: b.rate_quoted != null ? (b.rate_quoted as number) : undefined,
      date_start: hasStart ? (b.date_start as string) : undefined,
      date_end: hasStart ? (b.date_end as string) : undefined,
      cancellation_reason:
        typeof b.cancellation_reason === "string"
          ? b.cancellation_reason.trim()
          : undefined,
    },
  };
}

export function parseBookingIdParam(id: string): { ok: true; id: string } | ParseFailure {
  if (!isUuid(id)) {
    return validationFail("Booking id must be a valid UUID.");
  }
  return { ok: true, id };
}
