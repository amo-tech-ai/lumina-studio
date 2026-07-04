import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

const mockMarkNotificationsRead = vi.fn();
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
  markNotificationsRead: (...args: unknown[]) => mockMarkNotificationsRead(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "33333333-3333-3333-3333-333333333333", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ rpc: vi.fn() });
  mockMarkNotificationsRead.mockResolvedValue({
    ok: true,
    data: { updated_count: 1 },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("POST /api/notifications/read", () => {
  function makePost(body: unknown) {
    return new NextRequest("http://localhost/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 with error envelope when auth fails", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(makePost({ notification_ids: [NOTIFICATION_ID] }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Sign in to continue." },
    });
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when notification_ids is empty", async () => {
    const { POST } = await importRoute();
    const res = await POST(makePost({ notification_ids: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when notification_ids exceeds 100", async () => {
    const ids = Array.from(
      { length: 101 },
      (_, i) => `${String(i).padStart(8, "0")}-1111-4111-8111-111111111111`,
    );
    const { POST } = await importRoute();
    const res = await POST(makePost({ notification_ids: ids }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when service reports not authorized for notification", async () => {
    mockMarkNotificationsRead.mockResolvedValueOnce({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
    const { POST } = await importRoute();
    const res = await POST(makePost({ notification_ids: [NOTIFICATION_ID] }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      },
    });
  });

  it("returns 200 with updated_count for specific ids", async () => {
    const { POST } = await importRoute();
    const res = await POST(makePost({ notification_ids: [NOTIFICATION_ID, OTHER_ID] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated_count: 1 });
    expect(mockMarkNotificationsRead).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mark_all: false,
        notification_ids: [NOTIFICATION_ID, OTHER_ID],
      }),
    );
  });

  it("returns 200 with updated_count for mark_all", async () => {
    mockMarkNotificationsRead.mockResolvedValueOnce({
      ok: true,
      data: { updated_count: 5 },
    });
    const { POST } = await importRoute();
    const res = await POST(makePost({ mark_all: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated_count: 5 });
    expect(mockMarkNotificationsRead).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mark_all: true }),
    );
  });
});
