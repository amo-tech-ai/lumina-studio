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

  it("passes through when OPERATOR_AUTH_ENABLED is not true", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    const res = await proxy(appRequest("/app/brand"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated /app/* requests to /login with redirect param", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(appRequest("/app/shoots"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fapp%2Fshoots");
  });

  it("preserves the original query string in the redirect param", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(appRequest("/app/assets?tab=review&id=42"));
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("redirect=/app/assets?tab=review&id=42");
  });

  it("allows /app/* when a valid Supabase session cookie is present", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token", value: sessionCookieValue() },
      ]),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("recognizes chunked Supabase auth cookies (.0 suffix)", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(
      appRequest("/app/assets", [
        { name: "sb-proj-auth-token.0", value: sessionCookieValue() },
      ]),
    );
    expect(res.status).toBe(200);
  });

  it("rejects a spoofed cookie with the right name but junk value", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token", value: "not-a-real-session" },
      ]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("rejects a decoded token that is not JWT-shaped (3 segments)", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token", value: sessionCookieValue("only-two.parts") },
      ]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("reconstructs multi-chunk Supabase auth cookies (.0 + .1)", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const full = sessionCookieValue();
    const mid = Math.ceil(full.length / 2);
    const res = await proxy(
      appRequest("/app/brand", [
        { name: "sb-proj-auth-token.0", value: full.slice(0, mid) },
        { name: "sb-proj-auth-token.1", value: full.slice(mid) },
      ]),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("rejects a cookie that decodes to an empty session array", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const empty = `base64-${btoa(JSON.stringify([]))}`;
    const res = await proxy(
      appRequest("/app/brand", [{ name: "sb-proj-auth-token", value: empty }]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("passes through non-/app routes without an operator gate redirect", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    const res = await proxy(appRequest("/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("matches all app routes except static assets for session refresh", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });
});
