import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

function makePost(body: unknown) {
  return new NextRequest("http://localhost/api/talent/profile-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID = {
  displayName: "Kara",
  handle: "@kara",
  niche: "Running",
  location: "London, UK",
  dayRate: "£1,200",
  sourceUrl: "https://instagram.com/kara/",
  analyzedFields: [{ key: "handle", value: "@kara", confidence: 99, evidence: "url", status: "approved" }],
};

describe("POST /api/talent/profile-create", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockRpc.mockResolvedValue({
      data: {
        id: "profile-1",
        display_name: "Kara",
        bio: null,
        verification_status: "pending",
        sources_inserted: 1,
      },
      error: null,
    });
  });

  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import("./route");
    const res = await POST(makePost(VALID));
    expect(res.status).toBe(401);
  });

  it("calls the public RPC with numeric half_day and reviewed fields", async () => {
    const { POST } = await import("./route");
    const res = await POST(makePost(VALID));
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "create_talent_profile_with_sources",
      expect.objectContaining({
        p_display_name: "Kara",
        p_handle: "@kara",
        p_niche: "Running",
        p_location: "London, UK",
        p_half_day: 1200,
        p_sources: [{ field_name: "handle", confidence: 99, review_status: "approved" }],
      }),
    );
    expect(await res.json()).toMatchObject({ success: true, sourcesInserted: 1, profile: { id: "profile-1" } });
  });

  it("maps duplicate-profile RPC errors to 409", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "talent profile already exists" } });
    const { POST } = await import("./route");
    const res = await POST(makePost(VALID));
    expect(res.status).toBe(409);
  });

  it("rejects fields that are still AI-pending", async () => {
    const { POST } = await import("./route");
    const res = await POST(makePost({
      ...VALID,
      analyzedFields: [{ key: "handle", value: "@kara", confidence: 99, evidence: "url", status: "ai" }],
    }));
    expect(res.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
