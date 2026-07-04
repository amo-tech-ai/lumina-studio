import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

const mockListNotifications = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockWithOperatorAuth = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/lib/notifications/notification-service", () => ({
  listNotifications: (...args: unknown[]) => mockListNotifications(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "22222222-2222-2222-2222-222222222222", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ rpc: vi.fn() });
  mockListNotifications.mockResolvedValue({
    ok: true,
    data: { items: [], next_cursor: null },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("GET /api/notifications", () => {
  function makeGet(query = "") {
    const suffix = query ? `?${query}` : "";
    return new NextRequest(`http://localhost/api/notifications${suffix}`, { method: "GET" });
  }

  it("returns 401 with error envelope when auth fails", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { GET } = await importRoute();
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Sign in to continue." },
    });
  });

  it("returns 400 when limit is out of range", async () => {
    const { GET } = await importRoute();
    const res = await GET(makeGet("limit=51"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when unread_only is invalid", async () => {
    const { GET } = await importRoute();
    const res = await GET(makeGet("unread_only=maybe"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when service reports invalid cursor", async () => {
    mockListNotifications.mockResolvedValueOnce({
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      message: "invalid cursor",
    });
    const { GET } = await importRoute();
    const res = await GET(makeGet("cursor=bad"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { code: "VALIDATION_ERROR", message: "invalid cursor" },
    });
  });

  it("returns 200 with list payload on success", async () => {
    mockListNotifications.mockResolvedValueOnce({
      ok: true,
      data: {
        items: [
          {
            id: NOTIFICATION_ID,
            kind: "booking_quoted",
            payload: { booking_id: NOTIFICATION_ID },
            created_at: "2026-07-01T00:00:00Z",
            read: false,
            deep_link: `/app/bookings/${NOTIFICATION_ID}`,
          },
        ],
        next_cursor: "2026-07-01T00:00:00Z|" + NOTIFICATION_ID,
      },
    });
    const { GET } = await importRoute();
    const res = await GET(makeGet("unread_only=true&limit=25"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [
        {
          id: NOTIFICATION_ID,
          kind: "booking_quoted",
          payload: { booking_id: NOTIFICATION_ID },
          created_at: "2026-07-01T00:00:00Z",
          read: false,
          deep_link: `/app/bookings/${NOTIFICATION_ID}`,
        },
      ],
      next_cursor: "2026-07-01T00:00:00Z|" + NOTIFICATION_ID,
    });
    expect(mockListNotifications).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        unread_only: true,
        limit: 25,
      }),
    );
  });
});
