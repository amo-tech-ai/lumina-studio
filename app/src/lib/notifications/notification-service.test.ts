import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listNotifications, markNotificationsRead } from "./notification-service";

const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: NOTIFICATION_ID,
    kind: "booking_requested",
    payload: { booking_id: NOTIFICATION_ID },
    created_at: "2026-07-01T10:00:00.000Z",
    read: false,
    deep_link: "/app/bookings",
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listNotifications", () => {
  it("passes the query through to list_notifications and returns the payload", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({
      data: { items: [notification()], next_cursor: "2026-07-01T10:00:00.000Z" },
      error: null,
    });

    const result = await listNotifications({ rpc } as never, {
      limit: 25,
      cursor: "2026-07-02T10:00:00.000Z",
      unread_only: true,
    });

    expect(rpc).toHaveBeenCalledWith("list_notifications", {
      p_limit: 25,
      p_cursor: "2026-07-02T10:00:00.000Z",
      p_unread_only: true,
    });
    expect(result).toEqual({
      ok: true,
      data: { items: [notification()], next_cursor: "2026-07-01T10:00:00.000Z" },
    });
  });

  it("sends an undefined cursor when the query has none", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: [], next_cursor: null }, error: null });

    await listNotifications({ rpc } as never, { limit: 10, unread_only: false });

    expect(rpc).toHaveBeenCalledWith("list_notifications", {
      p_limit: 10,
      p_cursor: undefined,
      p_unread_only: false,
    });
  });

  it("normalizes a non-string next_cursor to a string", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: [], next_cursor: 42 }, error: null });

    const result = await listNotifications({ rpc } as never, { limit: 10, unread_only: false });

    expect(result).toEqual({ ok: true, data: { items: [], next_cursor: "42" } });
  });

  it("maps an RPC error through the shared mapper", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied for function list_notifications", code: "42501" },
    });

    const result = await listNotifications({ rpc } as never, { limit: 25, unread_only: false });

    expect(result).toEqual({
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sign in to continue.",
    });
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a payload without items", { next_cursor: null }],
    ["a payload whose items is not an array", { items: "nope", next_cursor: null }],
  ])("returns INTERNAL_ERROR when the RPC returns %s", async (_label, data) => {
    const rpc = vi.fn().mockResolvedValueOnce({ data, error: null });

    const result = await listNotifications({ rpc } as never, { limit: 25, unread_only: false });

    expect(result).toEqual({
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  });
});

describe("markNotificationsRead", () => {
  it("forwards explicit notification ids", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: { updated_count: 2 }, error: null });

    const result = await markNotificationsRead({ rpc } as never, {
      notification_ids: [NOTIFICATION_ID],
      mark_all: false,
    });

    expect(rpc).toHaveBeenCalledWith("mark_notifications_read", {
      p_notification_ids: [NOTIFICATION_ID],
      p_mark_all: false,
    });
    expect(result).toEqual({ ok: true, data: { updated_count: 2 } });
  });

  it("omits the ids when marking all as read", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: { updated_count: 7 }, error: null });

    await markNotificationsRead({ rpc } as never, {
      notification_ids: [NOTIFICATION_ID],
      mark_all: true,
    });

    expect(rpc).toHaveBeenCalledWith("mark_notifications_read", {
      p_notification_ids: undefined,
      p_mark_all: true,
    });
  });

  it("coerces a string updated_count to a number", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: { updated_count: "3" }, error: null });

    const result = await markNotificationsRead({ rpc } as never, { mark_all: true });

    expect(result).toEqual({ ok: true, data: { updated_count: 3 } });
  });

  it("maps an RPC error through the shared mapper", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "authentication required", code: null },
    });

    const result = await markNotificationsRead({ rpc } as never, { mark_all: true });

    expect(result).toEqual({
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Sign in to continue.",
    });
  });

  it("returns INTERNAL_ERROR when updated_count is missing", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: {}, error: null });

    const result = await markNotificationsRead({ rpc } as never, { mark_all: true });

    expect(result).toEqual({
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  });
});
