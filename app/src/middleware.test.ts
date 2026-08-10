import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, middleware } from "./middleware";

describe("middleware wiring (IPI2-127 / CF-MIG-110)", () => {
  it("middleware exports a handler function", () => {
    expect(typeof middleware).toBe("function");
  });

  it("middleware config matches all non-static routes for session refresh", () => {
    expect(config.matcher).toEqual([
      "/((?!monitoring|auth/signout$|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });

  it("excludes only the exact /auth/signout path, not near-matches (IPI-915)", () => {
    // Assert through Next's own matcher compiler (unstable_doesMiddlewareMatch)
    // rather than re-deriving the regex: exact /auth/signout is excluded while
    // near-match paths still get session refresh.
    expect(
      unstable_doesMiddlewareMatch({ config, url: "http://localhost:3000/auth/signout" }),
    ).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({ config, url: "http://localhost:3000/auth/signout-other" }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({ config, url: "http://localhost:3000/auth/signout/nested" }),
    ).toBe(true);
  });
});

describe("middleware version header (IPI-707)", () => {
  beforeEach(() => {
    // Keep updateSession() deterministic regardless of host env: with empty
    // Supabase vars the session helper takes the no-op path and the version
    // header logic stays the only thing under test.
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
  });

  it("middleware does not throw when getCloudflareContext is unavailable (Node runtime)", async () => {
    // In Node runtime, getCloudflareContext() throws; middleware should catch and continue.
    // This test verifies the try/catch block prevents test failures.
    const request = new NextRequest("http://localhost:3000/app");
    const response = await middleware(request);
    expect(response).toBeDefined();
  });

  it("omits X-iPix-Worker-Version in Node runtime (no Cloudflare context)", async () => {
    const request = new NextRequest("http://localhost:3000/app");
    const response = await middleware(request);
    expect(response.headers.get("x-ipix-worker-version")).toBeNull();
  });
});
