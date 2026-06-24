import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function appRequest(
  pathname: string,
  cookies: Record<string, string> = {},
): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`http://localhost:3002${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy (operator auth gate)", () => {
  it("passes through when OPERATOR_AUTH_ENABLED is not true", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    const response = proxy(appRequest("/app/dashboard"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated /app/* requests to /login with a redirect param", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const response = proxy(appRequest("/app/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fapp%2Fdashboard");
  });

  it("allows /app/* when a Supabase session cookie is present", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const response = proxy(
      appRequest("/app/settings", { "sb-proj-auth-token": "session" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("recognizes chunked Supabase auth cookies (sb-*-auth-token.0)", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const response = proxy(
      appRequest("/app/dashboard", { "sb-proj-auth-token.0": "chunk" }),
    );
    expect(response.status).toBe(200);
  });
});
