import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { OAUTH_NEXT_COOKIE } from "@/lib/oauth-next-cookie";

describe("POST /api/auth/oauth-next", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadPost() {
    const mod = await import("./route");
    return mod.POST;
  }

  function post(body: unknown) {
    return new NextRequest("https://www.ipix.co/api/auth/oauth-next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("sets HttpOnly oauth_next for a safe /onboarding redirect", async () => {
    const POST = await loadPost();
    const res = await POST(post({ redirect: "/onboarding" }));

    expect(res.status).toBe(204);
    const cookie = res.cookies.get(OAUTH_NEXT_COOKIE);
    expect(cookie?.value).toBe("/onboarding");
    expect(cookie).toMatchObject(
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("clears the cookie when redirect is unsafe", async () => {
    const POST = await loadPost();
    const res = await POST(post({ redirect: "https://evil.com" }));

    expect(res.status).toBe(204);
    const cookie = res.cookies.get(OAUTH_NEXT_COOKIE);
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });
});
