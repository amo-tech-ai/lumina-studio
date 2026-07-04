import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceFailure, ServiceResult } from "@/lib/booking/booking-service";
import { mapSupabaseRpcError } from "@/lib/booking/rpc-errors";

import type { ListNotificationsQuery, MarkReadBody } from "@/lib/notifications/validation";

function rpcFailure(error: { message?: string; code?: string | null }): ServiceFailure {
  const mapped = mapSupabaseRpcError(error.message ?? "Unknown error", error.code);
  return { ok: false, ...mapped };
}

function internalError(): ServiceFailure {
  return {
    ok: false,
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

function parseListNotificationsPayload(data: unknown): ListNotificationsResponse | null {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const row = data as Record<string, unknown>;
  if (!Array.isArray(row.items)) {
    return null;
  }
  return {
    items: row.items as NotificationItem[],
    next_cursor: row.next_cursor != null ? String(row.next_cursor) : null,
  };
}

function parseMarkReadPayload(data: unknown): MarkReadResponse | null {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const row = data as Record<string, unknown>;
  if (row.updated_count == null) {
    return null;
  }
  return { updated_count: Number(row.updated_count) };
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

  const parsed = parseListNotificationsPayload(data);
  if (!parsed) {
    return internalError();
  }

  return { ok: true, data: parsed };
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

  const parsed = parseMarkReadPayload(data);
  if (!parsed) {
    return internalError();
  }

  return { ok: true, data: parsed };
}
