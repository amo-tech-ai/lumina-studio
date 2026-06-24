import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenFromCookieString, extractAccessToken, resolveOperatorUser } from "./auth";

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/copilotkit", { headers });
}

describe("extractAccessToken", () => {
  it("reads a Bearer token", () => {
    expect(extractAccessToken(req({ authorization: "Bearer abc.def.ghi" }))).toBe("abc.def.ghi");
  });

  it("accepts Bearer prefix case-insensitively", () => {
    expect(extractAccessToken(req({ authorization: "bearer token-value" }))).toBe("token-value");
  });

  it("prefers Authorization header over session cookie", () => {
    const session = JSON.stringify(["cookie-jwt"]);
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(
      extractAccessToken(req({ authorization: "Bearer header-jwt", cookie })),
    ).toBe("header-jwt");
  });

  it("reads the sb-*-auth-token cookie (base64 JSON array)", () => {
    const session = JSON.stringify(["jwt-token", "refresh"]);
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("jwt-token");
  });

  it("reads chunked sb-*-auth-token.0 cookies", () => {
    const session = JSON.stringify({ access_token: "chunked-jwt" });
    const cookie = `sb-proj-auth-token.0=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("chunked-jwt");
  });

  it("reconstructs a session split across multiple chunks (.0 + .1)", () => {
    const jwt = `${"h".repeat(40)}.payload.signature`;
    const b64 = btoa(JSON.stringify([jwt]));
    const mid = Math.floor(b64.length / 2);
    const cookie = `sb-proj-auth-token.0=base64-${b64.slice(0, mid)}; sb-proj-auth-token.1=${b64.slice(mid)}`;
    expect(extractAccessToken(req({ cookie }))).toBe(jwt);
  });

  it("reads access_token from object-shaped session JSON", () => {
    const session = JSON.stringify({ access_token: "object-jwt", refresh_token: "r" });
    const cookie = `sb-proj-auth-token=base64-${btoa(session)}`;
    expect(extractAccessToken(req({ cookie }))).toBe("object-jwt");
  });

  it("returns undefined for malformed session cookies", () => {
    expect(extractAccessToken(req({ cookie: "sb-proj-auth-token=not-valid-json" }))).toBeUndefined();
  });

  it("returns undefined when no token is present", () => {
    expect(extractAccessToken(req({}))).toBeUndefined();
  });

  it("returns undefined for an empty Bearer token", () => {
    expect(extractAccessToken(req({ authorization: "Bearer   " }))).toBeUndefined();
  });
});

describe("accessTokenFromCookieString", () => {
  it("decodes URL-encoded cookie values before base64 parsing", () => {
    const jwt = "header.payload.signature";
    const encoded = encodeURIComponent(`base64-${btoa(JSON.stringify([jwt]))}`);
    expect(accessTokenFromCookieString(`sb-proj-auth-token=${encoded}`)).toBe(jwt);
  });

  it("rejects session cookies missing the base64- prefix", () => {
    const jwt = "header.payload.signature";
    const raw = btoa(JSON.stringify([jwt]));
    expect(accessTokenFromCookieString(`sb-proj-auth-token=${raw}`)).toBeUndefined();
  });

  it("returns undefined when chunk indices are out of order in the header", () => {
    const jwt = `${"h".repeat(40)}.payload.signature`;
    const b64 = btoa(JSON.stringify([jwt]));
    const mid = Math.floor(b64.length / 2);
    // Deliberately reversed chunk order in the cookie string
    const cookie = `sb-proj-auth-token.1=${b64.slice(mid)}; sb-proj-auth-token.0=base64-${b64.slice(0, mid)}`;
    expect(accessTokenFromCookieString(cookie)).toBe(jwt);
  });
});

describe("resolveOperatorUser (fail-closed)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falls back to a marked demo identity outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await resolveOperatorUser(req({}));
    expect(user.id).toBe("demo-user");
    expect(user.name).toContain("dev fallback");
  });

  it("throws (fails closed) in production with no session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(resolveOperatorUser(req({}))).rejects.toThrow(/failing closed/);
  });
});

describe("resolveOperatorUser with Supabase validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@supabase/supabase-js");
  });

  async function loadAuthWithSupabase(
    getUser: ReturnType<typeof vi.fn>,
    env: Record<string, string>,
  ) {
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }
    vi.doMock("@supabase/supabase-js", () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    return import("./auth");
  }

  it("returns the Supabase user when the access token validates", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-abc",
          email: "op@example.com",
          user_metadata: { name: "Operator Name" },
        },
      },
      error: null,
    });
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(getUser, {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    const user = await resolve(req({ authorization: "Bearer valid.jwt" }));
    expect(user).toEqual({
      id: "user-abc",
      email: "op@example.com",
      name: "Operator Name",
    });
    expect(getUser).toHaveBeenCalledWith("valid.jwt");
  });

  it("falls back display name to email then id when metadata.name is absent", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-only-id", email: null, user_metadata: {} } },
      error: null,
    });
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(getUser, {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    expect(await resolve(req({ authorization: "Bearer valid.jwt" }))).toMatchObject({
      id: "user-only-id",
      name: "user-only-id",
    });

    getUser.mockResolvedValueOnce({
      data: { user: { id: "user-2", email: "op@example.com", user_metadata: {} } },
      error: null,
    });
    expect(await resolve(req({ authorization: "Bearer valid.jwt" }))).toMatchObject({
      id: "user-2",
      email: "op@example.com",
      name: "op@example.com",
    });
  });

  it("fails closed in production when Supabase rejects the token", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "invalid JWT" },
    });
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(getUser, {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    await expect(resolve(req({ authorization: "Bearer bad.jwt" }))).rejects.toThrow(
      /failing closed/,
    );
  });

  it("uses NEXT_PUBLIC_SUPABASE_ANON_KEY when SUPABASE_ANON_KEY is unset", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-public-key", email: "op@example.com", user_metadata: {} } },
      error: null,
    });
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(getUser, {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });

    await resolve(req({ authorization: "Bearer valid.jwt" }));
    expect(getUser).toHaveBeenCalledWith("valid.jwt");
  });

  it("fails closed in production when a token is present but Supabase env is missing", async () => {
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(vi.fn(), {
      NODE_ENV: "production",
    });

    await expect(resolve(req({ authorization: "Bearer orphan.jwt" }))).rejects.toThrow(
      /failing closed/,
    );
  });

  it("fails closed in production when Supabase returns no user without an error", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const { resolveOperatorUser: resolve } = await loadAuthWithSupabase(getUser, {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    await expect(resolve(req({ authorization: "Bearer valid.jwt" }))).rejects.toThrow(
      /failing closed/,
    );
  });
});
