import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession, createServerClient } = vi.hoisted(() => {
  const exchangeCodeForSession = vi.fn();
  const createServerClient = vi.fn(() => ({
    auth: { exchangeCodeForSession },
  }));
  return { exchangeCodeForSession, createServerClient };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

describe("GET /auth/callback", () => {
  beforeEach(async () => {
    vi.resetModules();
    exchangeCodeForSession.mockReset();
    createServerClient.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadGet() {
    const mod = await import("./route");
    return mod.GET;
  }

  function callbackRequest(
    query = "code=abc123",
    headers: Record<string, string> = {},
  ): NextRequest {
    return new NextRequest(`https://www.ipix.co/auth/callback?${query}`, {
      headers,
    });
  }

  it("redirects to /app after a successful code exchange", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(callbackRequest());

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.ipix.co/app");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
  });

  it("uses x-forwarded-host for the redirect origin in production", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "www.ipix.co",
        "x-forwarded-proto": "https",
      }),
    );

    expect(res.headers.get("location")).toBe("https://www.ipix.co/app");
  });

  it("redirects to /login?error=auth when the code exchange fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid flow state", status: 400, name: "AuthApiError" },
    });
    const GET = await loadGet();

    const res = await GET(callbackRequest());

    expect(res.headers.get("location")).toBe("https://www.ipix.co/login?error=auth");
    expect(consoleSpy).toHaveBeenCalledWith(
      "[auth/callback] exchangeCodeForSession failed",
      expect.objectContaining({ message: "invalid flow state" }),
    );
    consoleSpy.mockRestore();
  });

  it("redirects to /login?error=auth when the provider returns an OAuth error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("error=access_denied&error_description=User%20denied"),
    );

    expect(res.headers.get("location")).toBe("https://www.ipix.co/login?error=auth");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("redirects to /login?error=auth when the code param is missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const GET = await loadGet();

    const res = await GET(callbackRequest(""));

    expect(res.headers.get("location")).toBe("https://www.ipix.co/login?error=auth");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
