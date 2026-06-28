import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const VALID_BODY = {
  brand_id: "11111111-1111-1111-1111-111111111111",
  shoot_name: "Spring Lookbook",
  brief: "Clean studio ecommerce",
  channels: ["shopify"],
  deliverables: [{ channel: "shopify", format: "hero", quantity: 2 }],
  shots: [{ shot_number: 1, description: "Front full body" }],
  approved_budget: 4200,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/shoots/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockCommitShootDraft = vi.fn();
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

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/shoot/commit-shoot-draft", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shoot/commit-shoot-draft")>();
  return {
    ...actual,
    commitShootDraft: (...args: unknown[]) => mockCommitShootDraft(...args),
  };
});

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "22222222-2222-2222-2222-222222222222", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
  mockCommitShootDraft.mockResolvedValue({
    ok: true,
    shoot_id: "33333333-3333-3333-3333-333333333333",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("POST /api/shoots/commit", () => {
  it("returns 401 when withOperatorAuth throws OperatorAuthError", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost/api/shoots/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ brand_id: VALID_BODY.brand_id }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 403 when brand access denied", async () => {
    mockCommitShootDraft.mockResolvedValueOnce({
      ok: false,
      status: 403,
      error: "Brand not found or access denied",
    });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it("returns 500 when RPC fails", async () => {
    mockCommitShootDraft.mockResolvedValueOnce({
      ok: false,
      status: 500,
      error: "Failed to commit shoot",
    });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to commit shoot" });
  });

  it("returns 201 with shoot_id on success", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      shoot_id: "33333333-3333-3333-3333-333333333333",
    });
    expect(mockCommitShootDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorId: "22222222-2222-2222-2222-222222222222",
        input: expect.objectContaining({
          brand_id: VALID_BODY.brand_id,
          shoot_name: VALID_BODY.shoot_name,
        }),
      }),
    );
  });
});
