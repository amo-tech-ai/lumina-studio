import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signOut },
  })),
}));

import { GET } from "./route";

describe("GET /auth/signout — IPI-725", () => {
  beforeEach(() => {
    signOut.mockClear();
  });

  it("signs out then redirects to /login", async () => {
    const req = new Request("http://localhost:3002/auth/signout");
    const res = await GET(req as never);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3002/login");
  });

  it("still redirects when signOut throws", async () => {
    signOut.mockRejectedValueOnce(new Error("boom"));
    const req = new Request("https://ipix-operator-preview.sk-498.workers.dev/auth/signout");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://ipix-operator-preview.sk-498.workers.dev/login",
    );
  });
});
