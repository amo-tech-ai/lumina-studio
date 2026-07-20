import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue({ error: null });
const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signOut, getUser },
  })),
}));

import { revalidatePath } from "next/cache";
import { POST } from "./route";

describe("POST /auth/signout — IPI-725", () => {
  beforeEach(() => {
    signOut.mockClear();
    signOut.mockResolvedValue({ error: null });
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    vi.mocked(revalidatePath).mockClear();
  });

  it("signs out locally when a user session exists, then redirects to /login", async () => {
    const req = new Request("http://localhost:3002/auth/signout", { method: "POST" });
    const res = await POST(req as never);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3002/login");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("skips signOut when unauthenticated and still redirects to /login", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const req = new Request("http://localhost:3002/auth/signout", { method: "POST" });
    const res = await POST(req as never);
    expect(signOut).not.toHaveBeenCalled();
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3002/login");
  });

  it("redirects to /app?signoutError=1 when signOut returns an error", async () => {
    signOut.mockResolvedValueOnce({ error: { message: "network" } });
    const req = new Request("http://localhost:3002/auth/signout", { method: "POST" });
    const res = await POST(req as never);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3002/app?signoutError=1",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("redirects to signoutError when getUser/signOut throws", async () => {
    getUser.mockRejectedValueOnce(new Error("boom"));
    const req = new Request("https://ipix-operator-preview.sk-498.workers.dev/auth/signout", {
      method: "POST",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://ipix-operator-preview.sk-498.workers.dev/app?signoutError=1",
    );
  });
});
