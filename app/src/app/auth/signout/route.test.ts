import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue({ error: null });
const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signOut, getUser },
  })),
}));

import { GET } from "./route";

describe("GET /auth/signout — IPI-725", () => {
  beforeEach(() => {
    signOut.mockClear();
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  });

  it("signs out when a user session exists, then redirects to /login", async () => {
    const req = new Request("http://localhost:3002/auth/signout");
    const res = await GET(req as never);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3002/login");
  });

  it("skips signOut when unauthenticated and still redirects", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = new Request("http://localhost:3002/auth/signout");
    const res = await GET(req as never);
    expect(signOut).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3002/login");
  });

  it("still redirects when getUser/signOut throws", async () => {
    getUser.mockRejectedValueOnce(new Error("boom"));
    const req = new Request("https://ipix-operator-preview.sk-498.workers.dev/auth/signout");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://ipix-operator-preview.sk-498.workers.dev/login",
    );
  });
});
