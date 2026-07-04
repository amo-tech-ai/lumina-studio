import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiErrorCode } from "@/lib/api/error-envelope";
import { isStaleBookingMessage, mapSupabaseRpcError } from "@/lib/booking/rpc-errors";
import type {
  CreateBookingBody,
  ListBookingsQuery,
  TransitionBody,
} from "@/lib/booking/validation";

export type ServiceFailure = {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ServiceSuccess<T> = { ok: true; data: T };

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function rpcFailure(
  error: { message?: string; code?: string | null },
  ctx?: { expectedVersion?: number; currentVersion?: number },
): ServiceFailure {
  const mapped = mapSupabaseRpcError(error.message ?? "Unknown error", error.code, ctx);
  return { ok: false, ...mapped };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export type CreateBookingResponse = {
  booking_id: string;
  status: string;
  version: number;
  expires_at: string;
};

export async function createBookingRequest(
  userSb: SupabaseClient,
  input: CreateBookingBody,
): Promise<ServiceResult<CreateBookingResponse>> {
  const { data, error } = await userSb.rpc("create_booking_request", {
    p_brand_org_id: input.brand_org_id,
    p_talent_profile_id: input.talent_profile_id,
    p_date_start: input.date_start,
    p_date_end: input.date_end,
    p_shoot_id: input.shoot_id ?? undefined,
    p_rate_quoted: input.rate_quoted ?? undefined,
    p_message: input.message ?? undefined,
  });

  if (error) {
    console.error("[booking] create_booking_request:", error.message);
    return rpcFailure(error);
  }

  const row = asRecord(data);
  if (!row || typeof row.booking_id !== "string") {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      booking_id: row.booking_id,
      status: String(row.status ?? "requested"),
      version: Number(row.version ?? 1),
      expires_at: String(row.expires_at ?? ""),
    },
  };
}

export type BookingSummary = {
  id: string;
  status: string;
  version: number;
  date_start: string;
  date_end: string;
  brand_org_id: string;
  talent_profile_id: string;
  shoot_id: string | null;
  rate_quoted: number | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ListBookingsResponse = {
  items: BookingSummary[];
  next_cursor: string | null;
};

export async function listBookings(
  userSb: SupabaseClient,
  query: ListBookingsQuery,
): Promise<ServiceResult<ListBookingsResponse>> {
  const { data, error } = await userSb.rpc("list_bookings", {
    p_role: query.role,
    p_org_id: query.org_id ?? undefined,
    p_talent_profile_id: query.talent_profile_id ?? undefined,
    p_status: query.status ?? undefined,
    p_cursor: query.cursor ?? undefined,
    p_limit: query.limit,
  });

  if (error) {
    console.error("[booking] list_bookings:", error.message);
    return rpcFailure(error);
  }

  const row = asRecord(data);
  if (!row || !Array.isArray(row.items)) {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      items: row.items as BookingSummary[],
      next_cursor: row.next_cursor != null ? String(row.next_cursor) : null,
    },
  };
}

export type GetBookingResponse = {
  booking: Record<string, unknown>;
  talent: unknown;
  history: unknown[];
  viewer_role: string;
};

export async function getBooking(
  userSb: SupabaseClient,
  bookingId: string,
): Promise<ServiceResult<GetBookingResponse>> {
  const { data, error } = await userSb.rpc("get_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    console.error("[booking] get_booking:", error.message);
    return rpcFailure(error);
  }

  const row = asRecord(data);
  const booking = row?.booking;
  if (!row || !booking || typeof booking !== "object") {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      booking: booking as Record<string, unknown>,
      talent: row.talent ?? null,
      history: Array.isArray(row.history) ? row.history : [],
      viewer_role: String(row.viewer_role ?? ""),
    },
  };
}

export type TransitionBookingResponse = {
  booking: Record<string, unknown>;
  from_status: string;
  to_status: string;
  version: number;
};

function rpcRowToBooking(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.booking_id ?? row.id,
    brand_org_id: row.brand_org_id,
    talent_profile_id: row.talent_profile_id,
    shoot_id: row.shoot_id ?? null,
    status: row.status,
    date_start: row.date_start,
    date_end: row.date_end,
    rate_quoted: row.rate_quoted ?? null,
    message: row.message ?? null,
    requested_by: row.requested_by ?? null,
    approved_by: row.approved_by ?? null,
    cancelled_by: row.cancelled_by ?? null,
    cancellation_reason: row.cancellation_reason ?? null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    version: row.version,
  };
}

export async function transitionBooking(
  userSb: SupabaseClient,
  bookingId: string,
  input: TransitionBody,
): Promise<ServiceResult<TransitionBookingResponse>> {
  const { data, error } = await userSb.rpc("transition_booking", {
    p_booking_id: bookingId,
    p_expected_version: input.expected_version,
    p_to_status: input.to_status ?? undefined,
    p_rate_quoted: input.rate_quoted ?? undefined,
    p_date_start: input.date_start ?? undefined,
    p_date_end: input.date_end ?? undefined,
    p_cancellation_reason: input.cancellation_reason ?? undefined,
  });

  if (error) {
    console.error("[booking] transition_booking:", error.message);
    if (isStaleBookingMessage(error.message ?? "")) {
      const fresh = await getBooking(userSb, bookingId);
      const currentVersion =
        fresh.ok && fresh.data.booking.version != null
          ? Number(fresh.data.booking.version)
          : undefined;
      return rpcFailure(error, {
        expectedVersion: input.expected_version,
        currentVersion,
      });
    }
    return rpcFailure(error, { expectedVersion: input.expected_version });
  }

  const row = asRecord(data);
  if (!row || row.version == null) {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      booking: rpcRowToBooking(row),
      from_status: String(row.from_status ?? ""),
      to_status: String(row.to_status ?? row.status ?? ""),
      version: Number(row.version),
    },
  };
}

export type ApproveBookingResponse = {
  status: string;
  already_confirmed: boolean;
  booking_id: string;
  crew_id: string | null;
};

export async function approveBooking(
  userSb: SupabaseClient,
  serviceSb: SupabaseClient,
  bookingId: string,
): Promise<ServiceResult<ApproveBookingResponse>> {
  const viewer = await getBooking(userSb, bookingId);
  if (!viewer.ok) {
    return viewer;
  }

  if (viewer.data.viewer_role !== "brand") {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Only brand members can confirm a booking.",
    };
  }

  const { data, error } = await serviceSb.rpc("confirm_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    console.error("[booking] confirm_booking:", error.message);
    return rpcFailure(error);
  }

  const row = asRecord(data);
  if (!row || typeof row.booking_id !== "string") {
    return {
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    ok: true,
    data: {
      status: String(row.status ?? "confirmed"),
      already_confirmed: Boolean(row.already_confirmed),
      booking_id: row.booking_id,
      crew_id: row.crew_id != null ? String(row.crew_id) : null,
    },
  };
}
