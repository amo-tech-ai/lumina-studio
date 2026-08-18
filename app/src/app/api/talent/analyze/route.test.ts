import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve({
    auth: { getUser: mockGetUser },
  }),
}));

describe("POST /api/talent/analyze", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import("./route");
    const res = await POST(new NextRequest("http://localhost/api/talent/analyze", {
      method: "POST",
      body: JSON.stringify({ name: "Kara", url: "https://instagram.com/kara/" }),
    }));
    expect(res.status).toBe(401);
  });

  it("parses trailing-slash Instagram handles", async () => {
    const { POST } = await import("./route");
    const res = await POST(new NextRequest("http://localhost/api/talent/analyze", {
      method: "POST",
      body: JSON.stringify({ name: "Kara", url: "https://instagram.com/runwithkara/" }),
    }));
    const json = await res.json() as { fields: Array<{ key: string; value: string }> };
    expect(json.fields.find((field) => field.key === "handle")?.value).toBe("@runwithkara");
  });

  it("rejects invalid URLs instead of guessing a handle", async () => {
    const { POST } = await import("./route");
    const res = await POST(new NextRequest("http://localhost/api/talent/analyze", {
      method: "POST",
      body: JSON.stringify({ name: "Kara", url: "not-a-url" }),
    }));
    expect(res.status).toBe(400);
  });

  it("does not present mock drafts as high-confidence facts", async () => {
    const { POST } = await import("./route");
    const res = await POST(new NextRequest("http://localhost/api/talent/analyze", {
      method: "POST",
      body: JSON.stringify({ name: "Kara", url: "https://instagram.com/runwithkara/" }),
    }));
    const json = await res.json() as { fields: Array<{ confidence: number; evidence: string }> };
    expect(json.fields.every((field) => field.confidence === 0)).toBe(true);
    expect(json.fields.every((field) => field.evidence.includes("not crawled"))).toBe(true);
  });
});
