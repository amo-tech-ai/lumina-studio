import type { ApiErrorCode } from "@/lib/api/error-envelope";
import { isUuid } from "@/lib/booking/validation";

export type ParseFailure = {
  ok: false;
  status: 400;
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

function validationFail(message: string, details?: Record<string, unknown>): ParseFailure {
  return { ok: false, status: 400, code: "VALIDATION_ERROR", message, details };
}

export type ListNotificationsQuery = {
  unread_only: boolean;
  cursor?: string;
  limit: number;
};

function parseBooleanParam(value: string | null, defaultValue: boolean): boolean | null {
  if (value == null || value === "") return defaultValue;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

export function parseListNotificationsQuery(searchParams: URLSearchParams):
  | { ok: true; data: ListNotificationsQuery }
  | ParseFailure {
  const unreadRaw = searchParams.get("unread_only");
  const unread_only = parseBooleanParam(unreadRaw, false);
  if (unread_only === null) {
    return validationFail("unread_only must be a boolean.");
  }

  const limitRaw = searchParams.get("limit");
  let limit = 25;
  if (limitRaw != null && limitRaw !== "") {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
      return validationFail("limit must be an integer between 1 and 50.");
    }
    limit = parsed;
  }

  const cursorRaw = searchParams.get("cursor");
  const cursor =
    cursorRaw != null && cursorRaw !== "" ? cursorRaw : undefined;

  return {
    ok: true,
    data: {
      unread_only,
      cursor,
      limit,
    },
  };
}

export type MarkReadBody = {
  notification_ids?: string[];
  mark_all: boolean;
};

export function parseMarkReadBody(body: unknown):
  | { ok: true; data: MarkReadBody }
  | ParseFailure {
  if (!body || typeof body !== "object") {
    return validationFail("Request body must be a JSON object.");
  }

  const b = body as Record<string, unknown>;

  let mark_all = false;
  if (b.mark_all !== undefined && b.mark_all !== null) {
    if (typeof b.mark_all !== "boolean") {
      return validationFail("mark_all must be a boolean.");
    }
    mark_all = b.mark_all;
  }

  if (mark_all) {
    return { ok: true, data: { mark_all: true } };
  }

  if (!Array.isArray(b.notification_ids)) {
    return validationFail("notification_ids must be a non-empty array of UUIDs.");
  }

  if (b.notification_ids.length < 1) {
    return validationFail("notification_ids must contain at least one UUID.");
  }

  if (b.notification_ids.length > 100) {
    return validationFail("notification_ids must contain at most 100 UUIDs.");
  }

  const notification_ids: string[] = [];
  for (const id of b.notification_ids) {
    if (!isUuid(id)) {
      return validationFail("Each notification_id must be a valid UUID.");
    }
    notification_ids.push(id);
  }

  return {
    ok: true,
    data: {
      notification_ids,
      mark_all: false,
    },
  };
}
