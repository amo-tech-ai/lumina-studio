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

  it("ignores spoofed x-forwarded-host and uses request origin", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "attacker.example.com",
        "x-forwarded-proto": "https",
      }),
    );

    expect(res.headers.get("location")).toBe("https://www.ipix.co/app");
  });

  it("uses TRUSTED_OAUTH_FORWARDED_HOSTS for Cloudflare preview redirect origin", async () => {
    vi.stubEnv("TRUSTED_OAUTH_FORWARDED_HOSTS", "ipix-operator.workers.dev");
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "ipix-operator.workers.dev",
        "x-forwarded-proto": "https",
      }),
    );

    expect(res.headers.get("location")).toBe("https://ipix-operator.workers.dev/app");
  });

  it("rejects spoofed *.workers.dev not in the allowlist", async () => {
    delete process.env.TRUSTED_OAUTH_FORWARDED_HOSTS;
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "attacker-subdomain.workers.dev",
        "x-forwarded-proto": "https",
      }),
    );

    expect(res.headers.get("location")).toBe("https://www.ipix.co/app");
  });

  it("no longer trusts the *.vercel.app namespace by default (no blanket wildcard)", async () => {
    delete process.env.TRUSTED_OAUTH_FORWARDED_HOSTS;
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "attacker-app.vercel.app",
        "x-forwarded-proto": "https",
      }),
    );

    expect(res.headers.get("location")).toBe("https://www.ipix.co/app");
  });

  it("matches an allowlisted host even when x-forwarded-host includes a port", async () => {
    vi.stubEnv("TRUSTED_OAUTH_FORWARDED_HOSTS", "localhost:8787");
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const GET = await loadGet();

    const res = await GET(
      callbackRequest("code=abc123", {
        "x-forwarded-host": "localhost:8787",
        "x-forwarded-proto": "http",
      }),
    );

    expect(res.headers.get("location")).toBe("http://localhost:8787/app");
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

  it("preserves cookies written during exchange when redirecting to login on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createServerClient.mockImplementation((_url, _key, options) => {
      exchangeCodeForSession.mockImplementation(async () => {
        options.cookies.setAll(
          [{ name: "sb-cleanup", value: "cleared", options: { path: "/" } }],
          undefined,
        );
        return {
          error: { message: "invalid flow state", status: 400, name: "AuthApiError" },
        };
      });
      return { auth: { exchangeCodeForSession } };
    });
    const GET = await loadGet();

    const res = await GET(callbackRequest());

    expect(res.headers.get("location")).toBe("https://www.ipix.co/login?error=auth");
    expect(res.cookies.get("sb-cleanup")?.value).toBe("cleared");
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
