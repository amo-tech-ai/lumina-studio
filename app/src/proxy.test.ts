import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

// A minimally valid Supabase session cookie value: base64-encoded JSON array
// whose first element is a JWT-shaped (3-part) access token.
function sessionCookieValue(jwt = "header.payload.signature"): string {
  return `base64-${btoa(JSON.stringify([jwt]))}`;
}

function appRequest(
  pathname: string,
  cookies: { name: string; value: string }[] = [],
): NextRequest {
  const req = new NextRequest(`http://localhost:3002${pathname}`);
  for (const { name, value } of cookies) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("proxy — operator auth gate (IPI2-127)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes through when OPERATOR_AUTH_ENABLED is not true", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    const res = proxy(appRequest("/app/brand"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated /app/* requests to /login with redirect param", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(appRequest("/app/shoots"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fapp%2Fshoots");
  });

  it("preserves the original query string in the redirect param", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(appRequest("/app/assets?tab=review&id=42"));
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("redirect=/app/assets?tab=review&id=42");
  });

  it("allows /app/* when a valid Supabase session cookie is present", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token", value: sessionCookieValue() },
      ]),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("recognizes chunked Supabase auth cookies (.0 suffix)", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(
      appRequest("/app/assets", [
        { name: "sb-proj-auth-token.0", value: sessionCookieValue() },
      ]),
    );
    expect(res.status).toBe(200);
  });

  it("rejects a spoofed cookie with the right name but junk value", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token", value: "not-a-real-session" },
      ]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("rejects a decodable session whose access token is not JWT-shaped", () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = proxy(
      appRequest("/app/brand", [
        {
          name: "sb-proj-auth-token",
          value: `base64-${btoa(JSON.stringify(["not-a-jwt"]))}`,
        },
      ]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("scopes the middleware matcher to /app/* routes", () => {
    expect(config.matcher).toEqual(["/app/:path*"]);
  });
});
