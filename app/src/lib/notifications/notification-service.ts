import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiErrorCode } from "@/lib/api/error-envelope";
import { mapSupabaseRpcError } from "@/lib/booking/rpc-errors";
import type { ListNotificationsQuery, MarkReadBody } from "@/lib/notifications/validation";

export type ServiceFailure = {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type ServiceSuccess<T> = { ok: true; data: T };

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function rpcFailure(error: { message?: string; code?: string | null }): ServiceFailure {
  const mapped = mapSupabaseRpcError(error.message ?? "Unknown error", error.code);
  return { ok: false, ...mapped };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export type NotificationItem = {
  id: string;
  kind: string;
  payload: unknown;
  created_at: string;
  read: boolean;
  deep_link: string | null;
};

export type ListNotificationsResponse = {
  items: NotificationItem[];
  next_cursor: string | null;
};

export async function listNotifications(
  userSb: SupabaseClient,
  query: ListNotificationsQuery,
): Promise<ServiceResult<ListNotificationsResponse>> {
  const { data, error } = await userSb.rpc("list_notifications", {
    p_limit: query.limit,
    p_cursor: query.cursor ?? undefined,
    p_unread_only: query.unread_only,
  });

  if (error) {
    console.error("[notifications] list_notifications:", error.message);
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
      items: row.items as NotificationItem[],
      next_cursor: row.next_cursor != null ? String(row.next_cursor) : null,
    },
  };
}

export type MarkReadResponse = {
  updated_count: number;
};

export async function markNotificationsRead(
  userSb: SupabaseClient,
  input: MarkReadBody,
): Promise<ServiceResult<MarkReadResponse>> {
  const { data, error } = await userSb.rpc("mark_notifications_read", {
    p_notification_ids: input.mark_all ? undefined : input.notification_ids,
    p_mark_all: input.mark_all,
  });

  if (error) {
    console.error("[notifications] mark_notifications_read:", error.message);
    return rpcFailure(error);
  }

  const row = asRecord(data);
  if (!row || row.updated_count == null) {
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
      updated_count: Number(row.updated_count),
    },
  };
}
